import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LLM_WHISPERER_URL = process.env.LLM_WHISPERER_URL;
const UNSTRACT_API_KEY = process.env.UNSTRACT_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No File Uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF Files are Allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Extract text using LLM Whisperer OCR
    const extractResponse = await fetch(`${LLM_WHISPERER_URL}/whisper`, {
      method: "POST",
      headers: {
        "unstract-key": UNSTRACT_API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    });

    if (!extractResponse.ok) {
      throw new Error(
        `LLM Whisperer Extraction Failed: ${extractResponse.statusText}`
      );
    }

    const extractData = await extractResponse.json();
    const whisperHash = extractData.whisper_hash;

    if (!whisperHash) {
      throw new Error("No whisper_hash Returned from Extraction");
    }

    // Step 2: Poll for extraction completion
    let status = "processing";
    let attempts = 0;
    const maxAttempts = 30;

    while (status === "processing" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `${LLM_WHISPERER_URL}/whisper-status?whisper_hash=${whisperHash}`,
        {
          headers: {
            "unstract-key": UNSTRACT_API_KEY,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to Check Extraction Status");
      }

      const statusData = await statusResponse.json();
      status = statusData.status;
      attempts++;
    }

    if (status !== "processed") {
      throw new Error("PDF Extraction Timed Out or Failed");
    }

    // Step 3: Retrieve extracted text
    const retrieveResponse = await fetch(
      `${LLM_WHISPERER_URL}/whisper-retrieve?whisper_hash=${whisperHash}`,
      {
        headers: {
          "unstract-key": UNSTRACT_API_KEY,
        },
      }
    );

    if (!retrieveResponse.ok) {
      throw new Error("Failed to Retrieve Extracted Text");
    }

    const retrieveData = await retrieveResponse.json();
    const extractedText = retrieveData.result_text || "";

    if (!extractedText) {
      throw new Error("No Text Extracted from PDF");
    }

    // Step 4: Use Gemini to parse lab values from extracted text
    const parsePrompt = `You are a medical lab report parser. Extract lab values from the following medical lab report text.

Return ONLY a valid JSON object with the following structure. Use null for any values not found in the report.
Do NOT include any explanation or markdown formatting - ONLY the JSON object.

{
  "hemoglobin": <number or null>,
  "hba1c": <number or null>,
  "cholesterolTotal": <number or null>,
  "ldl": <number or null>,
  "hdl": <number or null>,
  "triglycerides": <number or null>,
  "creatinine": <number or null>,
  "egfr": <number or null>,
  "alt": <number or null>,
  "ast": <number or null>,
  "wbcCount": <number or null>,
  "sugar_fasting": <number or null>,
  "sugar_pp": <number or null>
}

Expected units and common names to look for:
- hemoglobin (Hb, Haemoglobin): g/dL
- hba1c (HbA1c, Glycated Hemoglobin, A1C): %
- cholesterolTotal (Total Cholesterol, TC): mg/dL
- ldl (LDL Cholesterol, LDL-C, Low Density Lipoprotein): mg/dL
- hdl (HDL Cholesterol, HDL-C, High Density Lipoprotein): mg/dL
- triglycerides (TG, Triglyceride): mg/dL
- creatinine (Serum Creatinine, S. Creatinine): mg/dL
- egfr (eGFR, Estimated GFR, Glomerular Filtration Rate): mL/min/1.73m²
- alt (ALT, SGPT, Alanine Aminotransferase): U/L
- ast (AST, SGOT, Aspartate Aminotransferase): U/L
- wbcCount (WBC, White Blood Cell Count, Leukocyte Count): ×10³/µL or K/µL
- sugar_fasting (Fasting Blood Sugar, FBS, Fasting Glucose): mg/dL
- sugar_pp (Post Prandial Blood Sugar, PPBS, PP Glucose): mg/dL

Lab Report Text:
${extractedText}

JSON Output:`;

    const result = await model.generateContent(parsePrompt);
    const responseText = result.response.text().trim();

    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = responseText;
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    let labValues;
    try {
      labValues = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to Parse Lab Values JSON:", parseError);
      console.error("Raw Response:", responseText);
      return NextResponse.json(
        { error: "Failed to Parse Lab Values from Report" },
        { status: 500 }
      );
    }

    // Filter out null values and validate numbers
    const validatedValues = {};
    const labFields = [
      "hemoglobin",
      "hba1c",
      "cholesterolTotal",
      "ldl",
      "hdl",
      "triglycerides",
      "creatinine",
      "egfr",
      "alt",
      "ast",
      "wbcCount",
      "sugar_fasting",
      "sugar_pp",
    ];

    for (const field of labFields) {
      const value = labValues[field];
      if (value !== null && value !== undefined && !isNaN(Number(value))) {
        validatedValues[field] = Number(value);
      }
    }

    return NextResponse.json({
      success: true,
      labValues: validatedValues,
      extractedText: extractedText.substring(0, 500) + "...", // Return preview for debugging
    });
  } catch (err) {
    console.error("API /api/lab-report/extract Error:", err);
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 500 }
    );
  }
}
