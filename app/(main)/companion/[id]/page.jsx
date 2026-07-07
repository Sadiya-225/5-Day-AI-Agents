import { getCompanion } from "@/actions/companion.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import VideoTriageCompanion from "@/components/VideoTriageCompanion";
import { Stethoscope, Video } from "lucide-react";
import { db } from "@/lib/prisma";

const CompanionSession = async ({ params }) => {
  const { id } = await params;
  const companion = await getCompanion(id);
  const user = await currentUser();

  const dbUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
  });

  const userDetails = dbUser
    ? {
        name: dbUser.name || "",
        accident: dbUser.accident || "",
        address: dbUser.address || "",
        age: dbUser.age || null,
        allergies: dbUser.allergies || "",
        bp_dia: dbUser.bp_dia || null,
        bp_sys: dbUser.bp_sys || null,
        food_habit: dbUser.food_habit || "",
        gender: dbUser.gender || "",
        medical_history: dbUser.medical_history || "",
        sugar_fasting: dbUser.sugar_fasting
          ? Number(dbUser.sugar_fasting)
          : null,
        sugar_pp: dbUser.sugar_pp ? Number(dbUser.sugar_pp) : null,
        surgery: dbUser.surgery || "",
        transfusion: dbUser.transfusion || "",
      }
    : {};

  const { name, subject, topic, duration } = companion;

  if (!user) redirect("/sign-in");
  if (!name) redirect("/companion");

  return (
    <main className="container mx-auto max-w-7xl px-4 py-6">
      <article className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:flex-row flex-col md:items-center dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex size-14 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
            <Stethoscope className="text-foreground" size={28} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {name}
                </h1>

                <span className="hidden sm:inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {subject}
                </span>

                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  <Video size={15} />
                  Video Triage
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                {topic}
              </p>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                {duration}
                {duration != 1 ? " Minutes" : " Minute"}
              </span>
            </div>
          </div>
        </div>
      </article>

      <VideoTriageCompanion
        {...companion}
        companionId={id}
        userName={user.fullName}
        userImage={user.imageUrl}
        userDetails={userDetails}
        enableVideoTriage={true}
      />
    </main>
  );
};

export default CompanionSession;
