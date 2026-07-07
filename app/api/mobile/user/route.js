import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * GET /api/mobile/user?email=user@example.com
 * Get user data by email
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get user", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mobile/user
 * Update user profile
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { email, ...updateData } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data - only include fields that are provided
    const dataToUpdate = {};

    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.age !== undefined) dataToUpdate.age = updateData.age;
    if (updateData.gender !== undefined) dataToUpdate.gender = updateData.gender;
    if (updateData.address !== undefined) dataToUpdate.address = updateData.address;
    if (updateData.dateOfBirth !== undefined) {
      dataToUpdate.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
    }
    if (updateData.ethnicity !== undefined) dataToUpdate.ethnicity = updateData.ethnicity;
    if (updateData.occupation !== undefined) dataToUpdate.occupation = updateData.occupation;
    if (updateData.allergies !== undefined) dataToUpdate.allergies = updateData.allergies;
    if (updateData.medicalHistory !== undefined) dataToUpdate.medicalHistory = updateData.medicalHistory;
    if (updateData.surgery !== undefined) dataToUpdate.surgery = updateData.surgery;
    if (updateData.transfusion !== undefined) dataToUpdate.transfusion = updateData.transfusion;
    if (updateData.accident !== undefined) dataToUpdate.accident = updateData.accident;

    // Enum fields
    if (updateData.foodHabit !== undefined) {
      dataToUpdate.foodHabit = updateData.foodHabit || null;
    }
    if (updateData.smokingStatus !== undefined) {
      dataToUpdate.smokingStatus = updateData.smokingStatus || null;
    }
    if (updateData.alcoholConsumption !== undefined) {
      dataToUpdate.alcoholConsumption = updateData.alcoholConsumption || null;
    }

    const updatedUser = await db.user.update({
      where: { email },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Sanitize user object for response
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
    role: user.role,
    credits: user.credits,
    age: user.age,
    gender: user.gender,
    address: user.address,
    allergies: user.allergies,
    foodHabit: user.foodHabit?.toString(),
    bpSys: user.bpSys,
    bpDia: user.bpDia,
    sugarFasting: user.sugarFasting ? parseFloat(user.sugarFasting) : null,
    sugarPp: user.sugarPp ? parseFloat(user.sugarPp) : null,
    surgery: user.surgery,
    transfusion: user.transfusion,
    accident: user.accident,
    medicalHistory: user.medicalHistory,
    dateOfBirth: user.dateOfBirth?.toISOString(),
    ethnicity: user.ethnicity,
    occupation: user.occupation,
    height: user.height ? parseFloat(user.height) : null,
    weight: user.weight ? parseFloat(user.weight) : null,
    bmi: user.bmi ? parseFloat(user.bmi) : null,
    waistCircumference: user.waistCircumference ? parseFloat(user.waistCircumference) : null,
    smokingStatus: user.smokingStatus?.toString(),
    cigarettesPerDay: user.cigarettesPerDay,
    alcoholConsumption: user.alcoholConsumption?.toString(),
    exerciseFrequency: user.exerciseFrequency?.toString(),
    sleepHours: user.sleepHours ? parseFloat(user.sleepHours) : null,
    stressLevel: user.stressLevel,
    hemoglobin: user.hemoglobin ? parseFloat(user.hemoglobin) : null,
    hba1c: user.hba1c ? parseFloat(user.hba1c) : null,
    cholesterolTotal: user.cholesterolTotal,
    ldl: user.ldl,
    hdl: user.hdl,
    triglycerides: user.triglycerides,
    creatinine: user.creatinine ? parseFloat(user.creatinine) : null,
    egfr: user.egfr ? parseFloat(user.egfr) : null,
    alt: user.alt,
    ast: user.ast,
    wbcCount: user.wbcCount ? parseFloat(user.wbcCount) : null,
    heartRate: user.heartRate,
    hrv: user.hrv,
    spo2: user.spo2 ? parseFloat(user.spo2) : null,
    temperature: user.temperature ? parseFloat(user.temperature) : null,
    respiratoryRate: user.respiratoryRate,
    currentMedications: user.currentMedications,
    currentConditions: user.currentConditions,
    pregnancyStatus: user.pregnancyStatus?.toString(),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}
