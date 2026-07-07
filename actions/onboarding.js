"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { serializePrismaData } from "@/lib/utils";

export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User Not Found in Database");

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid Role Selection");
  }

  try {
    if (role === "PATIENT") {
      // Basic Info
      const age = parseInt(formData.get("age"), 10);
      const gender = formData.get("gender");
      const address = formData.get("address");
      const food_habit = formData.get("food_habit");

      // Extended Basic Info
      const dateOfBirthStr = formData.get("dateOfBirth");
      const dateOfBirth = dateOfBirthStr ? new Date(dateOfBirthStr) : null;
      const ethnicity = formData.get("ethnicity") || null;
      const occupation = formData.get("occupation") || null;

      // Body Measurements
      const height = formData.get("height")
        ? parseFloat(formData.get("height"))
        : null;
      const weight = formData.get("weight")
        ? parseFloat(formData.get("weight"))
        : null;
      const waistCircumference = formData.get("waistCircumference")
        ? parseFloat(formData.get("waistCircumference"))
        : null;
      const bodyFat = formData.get("bodyFat")
        ? parseFloat(formData.get("bodyFat"))
        : null;

      // Calculate BMI if height and weight are provided
      let bmi = null;
      if (height && weight && height > 0) {
        const heightInMeters = height / 100;
        bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
      }

      // Lifestyle Factors
      const smokingStatus = formData.get("smokingStatus") || null;
      const cigarettesPerDay = formData.get("cigarettesPerDay")
        ? parseInt(formData.get("cigarettesPerDay"), 10)
        : null;
      const alcoholConsumption = formData.get("alcoholConsumption") || null;
      const exerciseFrequency = formData.get("exerciseFrequency") || null;
      const sleepHours = formData.get("sleepHours")
        ? parseFloat(formData.get("sleepHours"))
        : null;
      const stressLevel = formData.get("stressLevel")
        ? parseInt(formData.get("stressLevel"), 10)
        : null;

      // Cycle Tracking
      const cycleLength = formData.get("cycleLength")
        ? parseInt(formData.get("cycleLength"), 10)
        : null;

      // Blood Pressure
      const bp_sys = formData.get("bp_sys")
        ? parseInt(formData.get("bp_sys"), 10)
        : null;
      const bp_dia = formData.get("bp_dia")
        ? parseInt(formData.get("bp_dia"), 10)
        : null;

      // Vital Signs
      const heartRate = formData.get("heartRate")
        ? parseInt(formData.get("heartRate"), 10)
        : null;
      const spo2 = formData.get("spo2")
        ? parseFloat(formData.get("spo2"))
        : null;
      const temperature = formData.get("temperature")
        ? parseFloat(formData.get("temperature"))
        : null;
      const respiratoryRate = formData.get("respiratoryRate")
        ? parseInt(formData.get("respiratoryRate"), 10)
        : null;

      // Blood Sugar
      const sugar_fasting = formData.get("sugar_fasting")
        ? parseFloat(formData.get("sugar_fasting"))
        : null;
      const sugar_pp = formData.get("sugar_pp")
        ? parseFloat(formData.get("sugar_pp"))
        : null;

      // Lab Values
      const hemoglobin = formData.get("hemoglobin")
        ? parseFloat(formData.get("hemoglobin"))
        : null;
      const hba1c = formData.get("hba1c")
        ? parseFloat(formData.get("hba1c"))
        : null;
      const cholesterolTotal = formData.get("cholesterolTotal")
        ? parseInt(formData.get("cholesterolTotal"), 10)
        : null;
      const ldl = formData.get("ldl")
        ? parseInt(formData.get("ldl"), 10)
        : null;
      const hdl = formData.get("hdl")
        ? parseInt(formData.get("hdl"), 10)
        : null;
      const triglycerides = formData.get("triglycerides")
        ? parseInt(formData.get("triglycerides"), 10)
        : null;
      const creatinine = formData.get("creatinine")
        ? parseFloat(formData.get("creatinine"))
        : null;
      const egfr = formData.get("egfr")
        ? parseFloat(formData.get("egfr"))
        : null;
      const alt = formData.get("alt")
        ? parseInt(formData.get("alt"), 10)
        : null;
      const ast = formData.get("ast")
        ? parseInt(formData.get("ast"), 10)
        : null;
      const wbcCount = formData.get("wbcCount")
        ? parseFloat(formData.get("wbcCount"))
        : null;
      const hrv = formData.get("hrv")
        ? parseInt(formData.get("hrv"), 10)
        : null;

      // Medical History
      const allergies = formData.get("allergies") || null;
      const surgery = formData.get("surgery") || null;
      const transfusion = formData.get("transfusion") || null;
      const accident = formData.get("accident") || null;
      const medical_history = formData.get("medical_history") || null;

      // Current Medications & Conditions (stored as JSON)
      const currentMedicationsStr = formData.get("currentMedications");
      const currentConditionsStr = formData.get("currentConditions");
      const currentMedications = currentMedicationsStr ? [{ text: currentMedicationsStr }] : null;
      const currentConditions = currentConditionsStr ? [{ text: currentConditionsStr }] : null;

      // Pregnancy Status
      const pregnancyStatus = formData.get("pregnancyStatus") || null;

      if (!age || !gender || !address || !food_habit) {
        throw new Error("Age, Gender, Address, and Food Habit are Required");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "PATIENT",
          // Basic Info
          age,
          gender,
          address,
          food_habit,
          dateOfBirth,
          ethnicity,
          occupation,
          // Body Measurements
          height,
          weight,
          bmi,
          waistCircumference,
          bodyFat,
          // Lifestyle
          smokingStatus,
          cigarettesPerDay,
          alcoholConsumption,
          exerciseFrequency,
          sleepHours,
          stressLevel,
          // Blood Pressure
          bp_sys,
          bp_dia,
          // Vital Signs
          heartRate,
          spo2,
          temperature,
          respiratoryRate,
          // Blood Sugar
          sugar_fasting,
          sugar_pp,
          // Lab Values
          hemoglobin,
          hba1c,
          cholesterolTotal,
          ldl,
          hdl,
          triglycerides,
          creatinine,
          egfr,
          alt,
          ast,
          wbcCount,
          hrv,
          // Medical History
          allergies,
          surgery,
          transfusion,
          accident,
          medical_history,
          currentMedications,
          currentConditions,
          pregnancyStatus,
          // Cycle Tracking
          cycleLength,
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }

    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("All Fields are Required");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to Set User Role:", error);
    throw new Error(`Failed to Update User Profile: ${error.message}`);
  }
}

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    return serializePrismaData(user);
  } catch (error) {
    console.error("Failed to Get User Information:", error);
    return null;
  }
}

export async function updatePatientProfile(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User Not Found in Database");

  if (user.role !== "PATIENT") {
    throw new Error("Only Patients Can Update Patient Profile");
  }

  try {
    // Basic Info
    const age = formData.get("age") ? parseInt(formData.get("age"), 10) : user.age;
    const gender = formData.get("gender") || user.gender;
    const address = formData.get("address") || user.address;
    const food_habit = formData.get("food_habit") || user.food_habit;

    // Extended Basic Info
    const dateOfBirthStr = formData.get("dateOfBirth");
    const dateOfBirth = dateOfBirthStr ? new Date(dateOfBirthStr) : user.dateOfBirth;
    const ethnicity = formData.get("ethnicity") || user.ethnicity;
    const occupation = formData.get("occupation") || user.occupation;

    // Body Measurements
    const height = formData.get("height")
      ? parseFloat(formData.get("height"))
      : user.height;
    const weight = formData.get("weight")
      ? parseFloat(formData.get("weight"))
      : user.weight;
    const waistCircumference = formData.get("waistCircumference")
      ? parseFloat(formData.get("waistCircumference"))
      : user.waistCircumference;
    const bodyFat = formData.get("bodyFat")
      ? parseFloat(formData.get("bodyFat"))
      : user.bodyFat;

    // Calculate BMI if height and weight are provided
    let bmi = user.bmi;
    if (height && weight && height > 0) {
      const heightInMeters = parseFloat(height) / 100;
      bmi = parseFloat((parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(1));
    }

    // Lifestyle Factors
    const smokingStatus = formData.get("smokingStatus") || user.smokingStatus;
    const cigarettesPerDay = formData.get("cigarettesPerDay")
      ? parseInt(formData.get("cigarettesPerDay"), 10)
      : user.cigarettesPerDay;
    const alcoholConsumption = formData.get("alcoholConsumption") || user.alcoholConsumption;
    const exerciseFrequency = formData.get("exerciseFrequency") || user.exerciseFrequency;
    const sleepHours = formData.get("sleepHours")
      ? parseFloat(formData.get("sleepHours"))
      : user.sleepHours;
    const stressLevel = formData.get("stressLevel")
      ? parseInt(formData.get("stressLevel"), 10)
      : user.stressLevel;

    // Cycle Tracking
    const cycleLength = formData.get("cycleLength")
      ? parseInt(formData.get("cycleLength"), 10)
      : user.cycleLength;

    // Blood Pressure
    const bp_sys = formData.get("bp_sys")
      ? parseInt(formData.get("bp_sys"), 10)
      : user.bp_sys;
    const bp_dia = formData.get("bp_dia")
      ? parseInt(formData.get("bp_dia"), 10)
      : user.bp_dia;

    // Vital Signs
    const heartRate = formData.get("heartRate")
      ? parseInt(formData.get("heartRate"), 10)
      : user.heartRate;
    const spo2 = formData.get("spo2")
      ? parseFloat(formData.get("spo2"))
      : user.spo2;
    const temperature = formData.get("temperature")
      ? parseFloat(formData.get("temperature"))
      : user.temperature;
    const respiratoryRate = formData.get("respiratoryRate")
      ? parseInt(formData.get("respiratoryRate"), 10)
      : user.respiratoryRate;

    // Blood Sugar
    const sugar_fasting = formData.get("sugar_fasting")
      ? parseFloat(formData.get("sugar_fasting"))
      : user.sugar_fasting;
    const sugar_pp = formData.get("sugar_pp")
      ? parseFloat(formData.get("sugar_pp"))
      : user.sugar_pp;

    // Lab Values
    const hemoglobin = formData.get("hemoglobin")
      ? parseFloat(formData.get("hemoglobin"))
      : user.hemoglobin;
    const hba1c = formData.get("hba1c")
      ? parseFloat(formData.get("hba1c"))
      : user.hba1c;
    const cholesterolTotal = formData.get("cholesterolTotal")
      ? parseInt(formData.get("cholesterolTotal"), 10)
      : user.cholesterolTotal;
    const ldl = formData.get("ldl")
      ? parseInt(formData.get("ldl"), 10)
      : user.ldl;
    const hdl = formData.get("hdl")
      ? parseInt(formData.get("hdl"), 10)
      : user.hdl;
    const triglycerides = formData.get("triglycerides")
      ? parseInt(formData.get("triglycerides"), 10)
      : user.triglycerides;
    const creatinine = formData.get("creatinine")
      ? parseFloat(formData.get("creatinine"))
      : user.creatinine;
    const egfr = formData.get("egfr")
      ? parseFloat(formData.get("egfr"))
      : user.egfr;
    const alt = formData.get("alt")
      ? parseInt(formData.get("alt"), 10)
      : user.alt;
    const ast = formData.get("ast")
      ? parseInt(formData.get("ast"), 10)
      : user.ast;
    const wbcCount = formData.get("wbcCount")
      ? parseFloat(formData.get("wbcCount"))
      : user.wbcCount;
    const hrv = formData.get("hrv")
      ? parseInt(formData.get("hrv"), 10)
      : user.hrv;

    // Medical History
    const allergies = formData.get("allergies") !== null
      ? formData.get("allergies")
      : user.allergies;
    const surgery = formData.get("surgery") !== null
      ? formData.get("surgery")
      : user.surgery;
    const transfusion = formData.get("transfusion") !== null
      ? formData.get("transfusion")
      : user.transfusion;
    const accident = formData.get("accident") !== null
      ? formData.get("accident")
      : user.accident;
    const medical_history = formData.get("medical_history") !== null
      ? formData.get("medical_history")
      : user.medical_history;

    // Current Medications & Conditions
    const currentMedicationsStr = formData.get("currentMedications");
    const currentConditionsStr = formData.get("currentConditions");
    const currentMedications = currentMedicationsStr
      ? [{ text: currentMedicationsStr }]
      : user.currentMedications;
    const currentConditions = currentConditionsStr
      ? [{ text: currentConditionsStr }]
      : user.currentConditions;

    // Pregnancy Status
    const pregnancyStatus = formData.get("pregnancyStatus") || user.pregnancyStatus;

    await db.user.update({
      where: {
        clerkUserId: userId,
      },
      data: {
        // Basic Info
        age,
        gender,
        address,
        food_habit,
        dateOfBirth,
        ethnicity,
        occupation,
        // Body Measurements
        height,
        weight,
        bmi,
        waistCircumference,
        bodyFat,
        // Lifestyle
        smokingStatus,
        cigarettesPerDay,
        alcoholConsumption,
        exerciseFrequency,
        sleepHours,
        stressLevel,
        // Blood Pressure
        bp_sys,
        bp_dia,
        // Vital Signs
        heartRate,
        spo2,
        temperature,
        respiratoryRate,
        // Blood Sugar
        sugar_fasting,
        sugar_pp,
        // Lab Values
        hemoglobin,
        hba1c,
        cholesterolTotal,
        ldl,
        hdl,
        triglycerides,
        creatinine,
        egfr,
        alt,
        ast,
        wbcCount,
        hrv,
        // Medical History
        allergies,
        surgery,
        transfusion,
        accident,
        medical_history,
        currentMedications,
        currentConditions,
        pregnancyStatus,
        // Cycle Tracking
        cycleLength,
      },
    });

    revalidatePath("/");
    revalidatePath("/patient/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to Update Patient Profile:", error);
    throw new Error(`Failed to Update Profile: ${error.message}`);
  }
}
