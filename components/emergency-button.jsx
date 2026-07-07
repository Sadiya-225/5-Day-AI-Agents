"use client";

import React from "react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";

export default function EmergencyButton() {
  const handleEmergencyCall = () => {
    window.location.href = "tel:108";
  };

  return (
    <Button
      variant="destructive"
      onClick={handleEmergencyCall}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg animate-pulse"
      aria-label="Emergency Call 108"
    >
      <Phone className="h-4 w-4" />
      <span className="hidden md:inline">Emergency</span>
      <span className="md:hidden">SOS</span>
    </Button>
  );
}
