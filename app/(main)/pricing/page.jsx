import { checkUser } from "@/lib/checkUser";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const user = await checkUser();
  return <PricingClient user={user} />;
}
