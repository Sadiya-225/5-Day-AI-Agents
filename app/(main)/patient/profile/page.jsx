import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PatientProfileForm } from "./components/patient-profile-form";
import { serializePrismaData } from "@/lib/utils";

export default async function PatientProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "PATIENT") {
    redirect("/onboarding");
  }

  // Serialize user data to handle Prisma Decimal types
  const serializedUser = serializePrismaData(user);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Card className="border-emerald-900/20">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 bg-emerald-500/10 rounded-full mb-4 w-fit">
              <User className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Update Your Profile
            </CardTitle>
            <CardDescription className="text-md sm:text-lg">
              Keep Your Health Information Up to Date for Better Care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PatientProfileForm user={serializedUser} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
