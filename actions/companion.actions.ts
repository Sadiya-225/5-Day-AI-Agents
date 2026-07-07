"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";

export const createCompanion = async (
  formData: CreateCompanion,
  projectId: string
) => {
  const { userId: author } = await auth();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .insert({ ...formData, author, projectId })
    .select();

  if (error || !data)
    throw new Error(error?.message || "Failed to Create a Companion");

  return data[0];
};

export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
  userId,
}: GetAllCompanions & { userId?: string }) => {
  try {
    const supabase = await createSupabaseClient();

    let query = supabase.from("companions").select();

    // Exclude companions with subject="Inventory"
    query = query.neq("subject", "Inventory");

    if (userId) {
      query = query.eq("author", userId);
    }

    if (subject && topic) {
      query = query
        .ilike("subject", `%${subject}%`)
        .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    } else if (subject) {
      query = query.ilike("subject", `%${subject}%`);
    } else if (topic) {
      query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: companions, error } = await query;

    if (error) {
      console.error("Supabase error in getAllCompanions:", error);
      throw new Error(error.message);
    }

    return companions || [];
  } catch (error) {
    console.error("Failed to fetch companions:", error);
    // Return empty array instead of throwing to prevent page crashes
    return [];
  }
};

export const getCompanion = async (id: string) => {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("id", id);

  if (error) return console.log(error);

  return data[0];
};

export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("session_history").insert({
    companion_id: companionId,
    user_id: userId,
  });

  if (error) throw new Error(error.message);

  return data;
};

export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();
  const supabase = await createSupabaseClient();

  let limit = 0;

  if (has({ plan: "pro" })) {
    return true;
  } else if (has({ feature: "3_companion_limit" })) {
    limit = 3;
  } else if (has({ feature: "10_companion_limit" })) {
    limit = 10;
  }

  const { data, error } = await supabase
    .from("companions")
    .select("id", { count: "exact" })
    .eq("author", userId);

  if (error) throw new Error(error.message);

  const companionCount = data?.length;

  if (companionCount >= limit) {
    return false;
  } else {
    return true;
  }
};
