"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Calendar,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  User,
  UserCog,
  MessageCircle,
  Headphones,
  Moon,
  Sun,
  Brain,
  Pill,
} from "lucide-react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function HeaderClient({ userData }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [clientUser, setClientUser] = useState(userData);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && userData) {
      setClientUser(userData);
    }
  }, [isLoaded, isSignedIn, userData]);

  return (
    <>
      <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-backdrop-filter:bg-background/60">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center cursor-pointer shrink-0">
            <Image
              src="/logo-single.png"
              alt="MedSync AI Logo"
              width={200}
              height={60}
              className="h-8 sm:h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 p-0"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            <SignedIn>
              {/* Admin Links */}
              {clientUser?.role === "ADMIN" && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin Dashboard
                  </Button>
                  <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                    <ShieldCheck className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {/* Doctor Links */}
              {clientUser?.role === "DOCTOR" && (
                <>
                  <Link href="/doctor/update-profile">
                    <Button
                      variant="outline"
                      className="hidden md:inline-flex items-center gap-2"
                    >
                      <UserCog className="h-4 w-4" />
                      Update Profile
                    </Button>
                    <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                      <UserCog className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/doctor">
                    <Button
                      variant="outline"
                      className="hidden md:inline-flex items-center gap-2"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Doctor Dashboard
                    </Button>
                    <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                      <Stethoscope className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}

              {/* Patient Links */}
              {clientUser?.role === "PATIENT" && (
                <>
                  <Link href="/patient/profile">
                    <Button
                      variant="outline"
                      className="hidden md:inline-flex items-center gap-2"
                    >
                      <UserCog className="h-4 w-4" />
                      Update Profile
                    </Button>
                    <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                      <UserCog className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/appointments">
                    <Button
                      variant="outline"
                      className="hidden md:inline-flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      My Appointments
                    </Button>
                    <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}

              {/* Unassigned Role */}
              {clientUser?.role === "UNASSIGNED" && (
                <Link href="/onboarding">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Complete Profile
                  </Button>
                  <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {clientUser?.role === "PATIENT" && (
                <>
                  <Link href="/ai-assistant">
                    <Button
                      variant="outline"
                      className="hidden md:inline-flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      AI Chat
                    </Button>
                    <Button
                      variant="ghost"
                      className="md:hidden w-10 h-10 p-0 bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                    </Button>
                  </Link>
                </>
              )}

              {clientUser?.role === "PATIENT" && (
                <Link href="/companion">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30"
                  >
                    <Headphones className="h-4 w-4 text-emerald-400" />
                    Voice Companion
                  </Button>
                  <Button
                    variant="ghost"
                    className="md:hidden w-10 h-10 p-0 bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30"
                  >
                    <Headphones className="h-4 w-4 text-emerald-400" />
                  </Button>
                </Link>
              )}

              {clientUser?.role === "PATIENT" && (
                <Link href="/drug-lookup">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30"
                  >
                    <Pill className="h-4 w-4 text-emerald-400" />
                    Drug Lookup
                  </Button>
                  <Button
                    variant="ghost"
                    className="md:hidden w-10 h-10 p-0 bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30"
                  >
                    <Pill className="h-4 w-4 text-emerald-400" />
                  </Button>
                </Link>
              )}
            </SignedIn>

            <SignedOut>
              <SignInButton>
                <Button variant="secondary">Sign In</Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "shadow-xl",
                    userPreviewMainIdentifier: "font-semibold",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>
        </nav>
      </header>
    </>
  );
}
