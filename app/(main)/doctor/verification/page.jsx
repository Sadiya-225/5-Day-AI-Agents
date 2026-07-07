import { ClipboardCheck, AlertCircle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";

export default async function VerificationPage() {
  const user = await getCurrentUser();

  if (user?.verificationStatus === "VERIFIED") {
    redirect("/doctor");
  }

  const isRejected = user?.verificationStatus === "REJECTED";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="border-emerald-900/20">
          <CardHeader className="text-center">
            <div
              className={`mx-auto p-4 ${
                isRejected ? "bg-red-900/20" : "bg-amber-900/20"
              } rounded-full mb-4 w-fit`}
            >
              {isRejected ? (
                <XCircle className="h-8 w-8 text-red-400" />
              ) : (
                <ClipboardCheck className="h-8 w-8 text-amber-400" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {isRejected
                ? "Verification Declined"
                : "Verification in Progress"}
            </CardTitle>
            <CardDescription className="text-lg">
              {isRejected
                ? "Unfortunately, your Application Needs Revision"
                : "Thank You for Submitting your Information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isRejected ? (
              <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4 mb-6 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 shrink-0" />
                <div className="text-muted-foreground text-left">
                  <p className="mb-2">
                    Our Administrative Team has Reviewed your Application and
                    Found that it Doesn&apos;t Meet our Current Requirements.
                    Common Reasons for Rejection Include:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Insufficient or Unclear Credential Documentation</li>
                    <li>Professional Experience Requirements Not Met</li>
                    <li>Incomplete or Vague Service Description</li>
                  </ul>
                  <p>
                    You can Update your Application with More Information and
                    Resubmit for Review.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-900/10 border border-amber-900/20 rounded-lg p-4 mb-6 flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-400 mr-3 mt-0.5 shrink-0" />
                <p className="text-muted-foreground text-left">
                  Your Profile is Currently Under Review by our Administrative
                  Team. This Process Typically takes 1-2 Business Days.
                  You&apos;ll Receive an Email Notification Once Your Account is
                  Verified.
                </p>
              </div>
            )}

            <p className="text-muted-foreground mb-6">
              {isRejected
                ? "You can Update Your Doctor Profile and Resubmit for Verification."
                : "While You Wait, You can Familiarize Yourself with Our Platform or Reach Out to Our Support Team, If You Have Any Questions."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isRejected ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="border-emerald-900/30"
                  >
                    <Link href="/">Return to Home</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Link href="/doctor/update-profile">Update Profile</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="border-emerald-900/30"
                  >
                    <Link href="/">Return to Home</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
