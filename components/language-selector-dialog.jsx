"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react";

export const INDIAN_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
];

export default function LanguageSelectorDialog({ open, onClose, onSelect }) {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const handleConfirm = () => {
    const language = INDIAN_LANGUAGES.find(
      (lang) => lang.code === selectedLanguage
    );
    onSelect(language);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[95vw] sm:w-full
          max-w-sm sm:max-w-md md:max-w-lg
          bg-card border border-emerald-900/20
          text-foreground
          max-h-[90vh] overflow-y-auto
          rounded-xl
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Languages className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
            Choose Your Language
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            Select Your Preferred Language for the Voice Conversation
          </DialogDescription>
        </DialogHeader>

        {/* Responsive Grid */}
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-3
            py-4
          "
        >
          {INDIAN_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`
                relative flex flex-col items-center justify-center gap-2
                rounded-lg border-2 p-4 sm:p-5
                transition-all text-center
                ${
                  selectedLanguage === lang.code
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                }
              `}
            >
              {selectedLanguage === lang.code && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                </div>
              )}
              <span className="text-xl sm:text-2xl font-semibold">
                {lang.nativeName}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {lang.name}
              </span>
            </button>
          ))}
        </div>

        {/* Responsive Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto border-gray-300 dark:border-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}