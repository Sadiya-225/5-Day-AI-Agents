import React from "react";
import { checkUser } from "@/lib/checkUser";
import HeaderClient from "./header-client";

// Server Component
export default async function Header() {
  const user = await checkUser();

  return <HeaderClient userData={user} />;
}
