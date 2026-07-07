import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import { Stethoscope } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DoctorProfileForm } from "./components/doctor-profile-form";
import { serializePrismaData } from "@/lib/utils";

export default async function UpdateProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "DOCTOR") {
    redirect("/onboarding");
  }

  // Serialize to handle Prisma Decimal types
  const serializedUser = serializePrismaData(user);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Card className="border-emerald-900/20">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 bg-emerald-500/10 rounded-full mb-4 w-fit">
              <Stethoscope className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Update Your Doctor Profile
            </CardTitle>
            <CardDescription className="text-md sm:text-lg">
              Update Your Professional Details for Verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DoctorProfileForm user={serializedUser} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
