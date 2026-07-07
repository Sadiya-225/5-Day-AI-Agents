/**
 * Drug Lookup API Proxy
 *
 * Proxies all /api/drug-lookup/* requests to the Python backend so that
 * the backend URL (MEDICAL_PIPELINE_URL) is never exposed to the browser.
 *
 * Usage from the frontend:
 *   GET  /api/drug-lookup?path=search&q=paracetamol
 *   GET  /api/drug-lookup?path=info/Dolo%20650
 *   GET  /api/drug-lookup?path=alternatives/Augmentin%20625
 *   GET  /api/drug-lookup?path=autocomplete&q=aug
 *   GET  /api/drug-lookup?path=pharmacies&lat=17.385&lon=78.486&radius=3000
 *   GET  /api/drug-lookup?path=safety/ibuprofen
 */

const BACKEND_URL = process.env.MEDICAL_PIPELINE_URL || "http://localhost:8000";

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 45_000; // Increased from 30s to 45s for slow endpoints

async function fetchWithRetry(url, options, retries = 0) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Check if error is retryable (network errors, not timeouts)
    const isNetworkError =
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message === "fetch failed";

    if (isNetworkError && retries < MAX_RETRIES) {
      console.log(
        `[Drug Lookup Proxy] Retry Attempt ${retries + 1}/${MAX_RETRIES} After ${RETRY_DELAY_MS}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return fetchWithRetry(url, options, retries + 1);
    }

    throw error;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract the target path and remove it from the forwarded query string
    const path = searchParams.get("path") || "";
    searchParams.delete("path");

    const forwardedParams = searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/drug-lookup/${path}${
      forwardedParams ? `?${forwardedParams}` : ""
    }`;

    console.log(`[Drug Lookup Proxy] Fetching: ${backendUrl}`);

    const backendResponse = await fetchWithRetry(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MedSync-AI-Frontend/1.0",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const data = await backendResponse.json();

    return Response.json(data, { status: backendResponse.status });
  } catch (error) {
    // Timeout error
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      console.error(
        "[Drug Lookup Proxy] Request Timeout After",
        TIMEOUT_MS / 1000,
        "seconds",
      );
      return Response.json(
        {
          error: "Request Timed Out",
          code: "TIMEOUT",
        },
        { status: 504 },
      );
    }

    // DNS/Network error
    if (error.code === "ENOTFOUND") {
      console.error(
        `[Drug Lookup Proxy] Backend Unreachable at ${BACKEND_URL}. Check if the Service is Running.`,
      );
      return Response.json(
        {
          error: "Backend Service Unavailable",
          message: "The Drug Lookup Backend is Not Responding",
          code: "BACKEND_UNREACHABLE",
        },
        { status: 503 },
      );
    }

    // Other network errors
    if (
      error.code === "ECONNREFUSED" ||
      error.message.includes("fetch failed")
    ) {
      console.error("[Drug Lookup Proxy] Connection Failed:", error.message);
      return Response.json(
        {
          error: "Connection Error",
          message:
            "Unable to Reach the Backend Service. It may be Temporarily Unavailable.",
          code: "CONNECTION_ERROR",
        },
        { status: 503 },
      );
    }

    console.error("[Drug Lookup Proxy] Unexpected Error:", error);
    return Response.json(
      {
        error: "Drug Lookup Service Error",
        message: "An Unexpected Error Occurred",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 },
    );
  }
}
