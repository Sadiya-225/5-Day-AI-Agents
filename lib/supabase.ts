import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export const createSupabaseClient = async (requireAuth: boolean = false) => {
  let token = null;

  if (requireAuth) {
    const session = await auth();
    if (!session?.userId) {
      throw new Error("Authentication required");
    }
    try {
      token = await session.getToken({ template: "supabase" });
    } catch (error) {
      console.warn("Supabase JWT template not configured in Clerk");
    }
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      },
    }
  );
};
