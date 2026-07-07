"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/**
 * Sign Out Page for Mobile App
 * Signs out from Clerk and redirects back to the mobile app
 */
export default function SignOutPage() {
  const { signOut, loaded } = useClerk();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!loaded) return;

    const performSignOut = async () => {
      try {
        setStatus("signing_out");
        await signOut();
        setStatus("success");

        // Redirect to mobile app after a short delay
        setTimeout(() => {
          // Use deep link to return to mobile app's auth screen
          window.location.href = "healthsync://auth/signout";
        }, 1500);
      } catch (error) {
        console.error("Sign out error:", error);
        setStatus("success");
        // Still redirect even on error
        setTimeout(() => {
          window.location.href = "healthsync://auth/signout";
        }, 1500);
      }
    };

    performSignOut();
  }, [signOut, loaded]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md mx-4">
        {status === "loading" || status === "signing_out" ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Health Sync
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Signing Out...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Signed Out Successfully
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Returning to Health Sync app...
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
