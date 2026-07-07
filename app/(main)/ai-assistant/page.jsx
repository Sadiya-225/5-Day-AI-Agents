import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";

export const metadata = {
  title: "AI Assistant - MedSync AI",
  description: "Get Help from our AI Medical Assistant",
};

export default async function AIAssistantPage() {
  const user = await checkUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center">
        <Bot className="mr-2 h-8 w-8 text-emerald-400" />
        AI Medical Assistant
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-emerald-400" />
              How Can Our AI Help You?
            </CardTitle>
            <CardDescription>
              Our AI Assistant Can Provide General Medical Information and
              Guidance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20">
              <h3 className="text-lg font-medium text-foreground mb-3">Features</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-1 rounded-full mr-2 mt-1">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span>Ask General Medical Questions</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-1 rounded-full mr-2 mt-1">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span>Get Information About Common Symptoms</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-1 rounded-full mr-2 mt-1">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span>Learn About Preventive Healthcare Measures</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-1 rounded-full mr-2 mt-1">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span>Understand Medical Terminology</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Link href="/ai-assistant/chat">
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Start Chat with AI Assistant
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center">
              <Bot className="h-5 w-5 mr-2 text-emerald-400" />
              Important Information
            </CardTitle>
            <CardDescription>
              Please Note the Limitations of Our AI Assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Disclaimer
                </h3>
                <p className="text-sm text-muted-foreground">
                  The AI Assistant Provides General Information Only and is NOT
                  a Substitute for Professional Medical Advice, Diagnosis, or
                  Treatment. Always Seek the Advice of Your Physician or Other
                  Qualified Health Provider with Any Questions You may have
                  Regarding a Medical Condition.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  For Emergencies
                </h3>
                <p className="text-sm text-muted-foreground">
                  If You're Experiencing a Medical Emergency, Please Call your
                  Local Emergency Number Immediately or Visit the Nearest
                  Emergency Room.
                </p>
              </div>

              <div className="pt-4 border-t border-emerald-900/20">
                <Link
                  href="/doctors"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center"
                >
                  <Sparkles className="mr-2 h-4 w-4 shrink-0" />
                  Prefer to Talk to a Real Doctor? Book an Appointment
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
