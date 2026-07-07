import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import DrugLookupClient from "./_components/DrugLookupClient";

export const metadata = {
  title: "Drug Lookup - MedSync AI",
  description:
    "Search Indian & FDA drug databases, find generic alternatives, and locate nearby pharmacies.",
};

export default async function DrugLookupPage() {
  const user = await checkUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/");
  }

  return <DrugLookupClient />;
}
