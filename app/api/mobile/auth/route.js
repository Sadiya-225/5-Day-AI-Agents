import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * POST /api/mobile/auth
 * Authenticate or create a user from the mobile app
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { clerkUserId, email, name, imageUrl } = body;

    if (!clerkUserId || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: clerkUserId and email" },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await db.user.findUnique({
      where: { email },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await db.user.create({
        data: {
          clerkUserId,
          email,
          name: name || email.split("@")[0],
          imageUrl,
          role: "PATIENT",
        },
      });
      isNewUser = true;
    } else if (user.clerkUserId !== clerkUserId) {
      user = await db.user.update({
        where: { email },
        data: {
          clerkUserId,
          name: name || user.name,
          imageUrl: imageUrl || user.imageUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: sanitizeUser(user),
      isNewUser,
    });
  } catch (error) {
    console.error("Mobile auth error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Sanitize user object for response (remove sensitive fields)
 */
function sanitizeUser(user) {
  const {
    id, clerkUserId, email, name, imageUrl, role, credits,
    age, gender, address, allergies, foodHabit,
    bpSys, bpDia, sugarFasting, sugarPp,
    surgery, transfusion, accident, medicalHistory,
    dateOfBirth, ethnicity, occupation, height, weight, bmi, waistCircumference,
    smokingStatus, cigarettesPerDay, alcoholConsumption, exerciseFrequency,
    sleepHours, stressLevel,
    hemoglobin, hba1c, cholesterolTotal, ldl, hdl, triglycerides,
    creatinine, egfr, alt, ast, wbcCount,
    heartRate, hrv, spo2, temperature, respiratoryRate,
    currentMedications, currentConditions, pregnancyStatus,
    createdAt, updatedAt
  } = user;

  return {
    id, clerkUserId, email, name, imageUrl, role, credits,
    age, gender, address, allergies, foodHabit: foodHabit?.toString(),
    bpSys, bpDia,
    sugarFasting: sugarFasting ? parseFloat(sugarFasting) : null,
    sugarPp: sugarPp ? parseFloat(sugarPp) : null,
    surgery, transfusion, accident, medicalHistory,
    dateOfBirth: dateOfBirth?.toISOString(),
    ethnicity, occupation,
    height: height ? parseFloat(height) : null,
    weight: weight ? parseFloat(weight) : null,
    bmi: bmi ? parseFloat(bmi) : null,
    waistCircumference: waistCircumference ? parseFloat(waistCircumference) : null,
    smokingStatus: smokingStatus?.toString(),
    cigarettesPerDay,
    alcoholConsumption: alcoholConsumption?.toString(),
    exerciseFrequency: exerciseFrequency?.toString(),
    sleepHours: sleepHours ? parseFloat(sleepHours) : null,
    stressLevel,
    hemoglobin: hemoglobin ? parseFloat(hemoglobin) : null,
    hba1c: hba1c ? parseFloat(hba1c) : null,
    cholesterolTotal, ldl, hdl, triglycerides,
    creatinine: creatinine ? parseFloat(creatinine) : null,
    egfr: egfr ? parseFloat(egfr) : null,
    alt, ast,
    wbcCount: wbcCount ? parseFloat(wbcCount) : null,
    heartRate, hrv,
    spo2: spo2 ? parseFloat(spo2) : null,
    temperature: temperature ? parseFloat(temperature) : null,
    respiratoryRate,
    currentMedications, currentConditions,
    pregnancyStatus: pregnancyStatus?.toString(),
    createdAt: createdAt?.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  };
}
