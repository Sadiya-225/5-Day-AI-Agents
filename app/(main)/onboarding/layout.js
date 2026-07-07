import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Onboarding - MedSync AI",
  description: "Complete your Profile to Get Started with MedSync AI",
};

export default async function OnboardingLayout({ children }) {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "PATIENT") {
      redirect("/doctors");
    } else if (user.role === "DOCTOR") {
      if (user.verificationStatus === "VERIFIED") {
        redirect("/doctor");
      } else {
        redirect("/doctor/verification");
      }
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to MedSync AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell Us How You Want to Use the Platform
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
