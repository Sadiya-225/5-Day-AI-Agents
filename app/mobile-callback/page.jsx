"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/**
 * Mobile Auth Callback Page
 * This page handles the redirect after Clerk sign-in for the mobile app.
 * It extracts user info and redirects to the app via deep link.
 */
export default function MobileCallbackPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState("Completing Sign In...");
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user && !redirected) {
      setRedirected(true);
      setStatus("Sign-in Successful! Redirecting to App...");

      // Build the deep link URL with user info
      const params = new URLSearchParams({
        user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || user.firstName || "",
        image_url: user.imageUrl || "",
      });

      const deepLink = `healthsync://auth/callback?${params.toString()}`;

      setTimeout(() => {
        window.location.href = deepLink;

        // Fallback message if redirect doesn't work
        setTimeout(() => {
          setStatus(
            "If the App Didn't Open Automatically, Please Return to the Health Sync App."
          );
        }, 2000);
      }, 500);
    } else if (isLoaded && !isSignedIn) {
      setStatus("Please sign in first.");
      // Redirect to sign-in page
      setTimeout(() => {
        window.location.href = "/sign-in?redirect_url=/mobile-callback";
      }, 1000);
    }
  }, [isLoaded, isSignedIn, user, redirected]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md mx-4">
        <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Health Sync
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">{status}</p>

        {isLoaded && isSignedIn && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span>{user?.primaryEmailAddress?.emailAddress}</span>
            </div>

            <a
              href="healthsync://auth/callback"
              className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Open Health Sync App
            </a>
          </div>
        )}

        {!isLoaded && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
