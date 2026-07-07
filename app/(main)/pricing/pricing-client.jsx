"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { createCheckoutSession } from "@/lib/stripe";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CreditCard } from "lucide-react";
import React, { useState } from "react";

const PricingClient = ({ user }) => {
  const [creditsToBuy, setCreditsToBuy] = useState([500]);
  const creditsToBuyAmount = creditsToBuy[0];
  const appointmentsCount = Math.floor(creditsToBuyAmount / 500);

  const tiers = [
    { credits: 500, label: "Basic" },
    { credits: 1950, label: "Standard" },
    { credits: 3400, label: "Premium" },
    { credits: 5000, label: "Ultimate" },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex flex-col items-center mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          MedSync AI Credits
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Purchase Credits to Book Appointments With Our Specialist Doctors
        </p>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-gray-900/80">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Your Credits</CardTitle>
              <CardDescription>Manage Your MedSync AI Credits</CardDescription>
            </div>
            <Button
              variant="outline"
              className="flex items-center p-1 text-md font-semibold bg-emerald-100/50 dark:bg-emerald-900/30"
            >
              <CreditCard className="h-5 w-5 mr-1" />
              {user?.credits ?? 0}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Info className="size-5 flex-shrink-0" />
              <p className="font-medium">
                500 Credits = 1 Appointment with a Doctor
              </p>
            </div>
            <p className="text-sm pl-7">
              With {creditsToBuyAmount} Credits, You Can Book{" "}
              {appointmentsCount}{" "}
              {appointmentsCount === 1 ? "Appointment" : "Appointments"} With
              Our Specialists.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Select Credit Amount</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {creditsToBuyAmount} Credits
                </span>
              </div>
              <Slider
                defaultValue={[500]}
                max={5000}
                min={500}
                step={50}
                onValueChange={(value) => setCreditsToBuy(value)}
                value={creditsToBuy}
                className="my-4"
              />

              <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                {tiers.map((tier) => (
                  <button
                    key={tier.credits}
                    onClick={() => setCreditsToBuy([tier.credits])}
                    className={`px-2 py-1 rounded ${
                      creditsToBuyAmount === tier.credits
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-medium"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white transition-all duration-300"
            onClick={() => {
              createCheckoutSession(creditsToBuyAmount);
            }}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Purchase {creditsToBuyAmount} Credits
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PricingClient;
