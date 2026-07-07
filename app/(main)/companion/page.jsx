"use server";

import CompanionsLibrary from "@/components/CompanionsLibrary";
import { auth } from "@clerk/nextjs/server";

const CompanionsLibraryPage = async ({ searchParams }) => {
  const params = await searchParams;
  const { userId } = await auth();

  const subject = params?.subject ?? "";
  const topic = params?.topic ?? "";

  return <CompanionsLibrary subject={subject} topic={topic} userId={userId} />;
};

export default CompanionsLibraryPage;
