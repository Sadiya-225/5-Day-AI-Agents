import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * POST /api/mobile/health-data/sync
 * Sync health data from Health Connect to the database
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, healthData } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    if (!healthData) {
      return NextResponse.json(
        { success: false, message: "Health data is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    const updatedFields = [];

    // Helper function to safely add field
    const addField = (key, value, dbKey = null) => {
      if (value !== undefined && value !== null) {
        updateData[dbKey || key] = value;
        updatedFields.push(dbKey || key);
      }
    };

    // Vital Signs
    addField("heartRate", healthData.heartRate);
    addField("hrv", healthData.hrv);
    addField("restingHeartRate", healthData.restingHeartRate);
    addField("bpSys", healthData.bpSys, "bp_sys");
    addField("bpDia", healthData.bpDia, "bp_dia");
    addField("spo2", healthData.spo2);
    addField("temperature", healthData.temperature);
    addField("skinTemperature", healthData.skinTemperature);
    addField("respiratoryRate", healthData.respiratoryRate);

    // Body Measurements
    addField("weight", healthData.weight);
    addField("height", healthData.height);
    addField("bmi", healthData.bmi);
    addField("waistCircumference", healthData.waistCircumference);
    addField("bodyFat", healthData.bodyFat);
    addField("bodyWaterMass", healthData.bodyWaterMass);
    addField("boneMass", healthData.boneMass);
    addField("leanBodyMass", healthData.leanBodyMass);
    addField("basalMetabolicRate", healthData.basalMetabolicRate);

    // Activity Data
    addField("todaySteps", healthData.todaySteps);
    addField("todayDistance", healthData.todayDistance);
    addField("todayCalories", healthData.todayCalories);
    addField("activeCalories", healthData.activeCalories);
    addField("floorsClimbed", healthData.floorsClimbed);
    addField("elevationGained", healthData.elevationGained);
    addField("vo2Max", healthData.vo2Max);
    addField("exerciseSessions", healthData.exerciseSessions);

    // Blood Glucose
    addField("sugarFasting", healthData.sugarFasting, "sugar_fasting");
    addField("sugarPp", healthData.sugarPp, "sugar_pp");

    // Sleep Data
    addField("sleepHours", healthData.sleepHours);
    if (healthData.sleepStages) {
      updateData.sleepStages = healthData.sleepStages;
      updatedFields.push("sleepStages");
    }
    if (healthData.lastSleepStart) {
      updateData.lastSleepStart = new Date(healthData.lastSleepStart);
      updatedFields.push("lastSleepStart");
    }
    if (healthData.lastSleepEnd) {
      updateData.lastSleepEnd = new Date(healthData.lastSleepEnd);
      updatedFields.push("lastSleepEnd");
    }

    // Nutrition
    addField("hydrationMl", healthData.hydrationMl);
    if (healthData.nutritionData) {
      updateData.nutritionData = healthData.nutritionData;
      updatedFields.push("nutritionData");
    }

    // Cycle Tracking
    addField("menstruationFlow", healthData.menstruationFlow);
    if (healthData.lastPeriodDate) {
      updateData.lastPeriodDate = new Date(healthData.lastPeriodDate);
      updatedFields.push("lastPeriodDate");
    }
    addField("cycleLength", healthData.cycleLength);

    // Exercise Frequency Mapping
    if (healthData.exerciseFrequency !== undefined && healthData.exerciseFrequency !== null) {
      const exerciseMap = {
        "SEDENTARY": "SEDENTARY",
        "LIGHT": "LIGHT",
        "MODERATE": "MODERATE",
        "ACTIVE": "ACTIVE",
        "VERY_ACTIVE": "VERY_ACTIVE",
      };
      if (exerciseMap[healthData.exerciseFrequency]) {
        updateData.exerciseFrequency = exerciseMap[healthData.exerciseFrequency];
        updatedFields.push("exerciseFrequency");
      }
    }

    // Lab Values (if available from connected devices)
    addField("hemoglobin", healthData.hemoglobin);
    addField("hba1c", healthData.hba1c);
    addField("cholesterolTotal", healthData.cholesterolTotal);
    addField("ldl", healthData.ldl);
    addField("hdl", healthData.hdl);
    addField("triglycerides", healthData.triglycerides);
    addField("creatinine", healthData.creatinine);
    addField("egfr", healthData.egfr);
    addField("alt", healthData.alt);
    addField("ast", healthData.ast);
    addField("wbcCount", healthData.wbcCount);

    // Update timestamp
    updateData.lastHealthConnectSync = new Date();
    updatedFields.push("lastHealthConnectSync");

    // Update user if there's any data to update
    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { email },
        data: updateData,
      });

      // Create a vital sign record for historical tracking
      try {
        await db.vitalSign.create({
          data: {
            userId: user.id,
            heartRate: healthData.heartRate,
            hrv: healthData.hrv,
            restingHeartRate: healthData.restingHeartRate,
            bpSystolic: healthData.bpSys,
            bpDiastolic: healthData.bpDia,
            spo2: healthData.spo2 ? parseFloat(healthData.spo2) : null,
            bloodGlucose: healthData.sugarFasting ? parseFloat(healthData.sugarFasting) : null,
            temperature: healthData.temperature ? parseFloat(healthData.temperature) : null,
            skinTemperature: healthData.skinTemperature ? parseFloat(healthData.skinTemperature) : null,
            respiratoryRate: healthData.respiratoryRate,
            weight: healthData.weight ? parseFloat(healthData.weight) : null,
            height: healthData.height ? parseFloat(healthData.height) : null,
            bmi: healthData.bmi ? parseFloat(healthData.bmi) : null,
            bodyFat: healthData.bodyFat ? parseFloat(healthData.bodyFat) : null,
            steps: healthData.todaySteps,
            distance: healthData.todayDistance ? parseFloat(healthData.todayDistance) : null,
            calories: healthData.todayCalories ? parseFloat(healthData.todayCalories) : null,
            floorsClimbed: healthData.floorsClimbed,
            vo2Max: healthData.vo2Max ? parseFloat(healthData.vo2Max) : null,
            sleepHours: healthData.sleepHours ? parseFloat(healthData.sleepHours) : null,
            sleepStages: healthData.sleepStages,
            source: "HEALTH_CONNECT",
            recordedAt: new Date(),
          },
        });
      } catch (vitalError) {
        console.error("Failed to Create Vital Sign Record:", vitalError);
      }
    }

    return NextResponse.json({
      success: true,
      message: updatedFields.length > 0
        ? `Successfully Synced ${updatedFields.length} Health Data`
        : "No New Data to Sync",
      updatedFields,
    });
  } catch (error) {
    console.error("Health Data Sync Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to Sync Health Data", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mobile/health-data?email=user@example.com
 * Get user's health data (all fields)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is Required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        // Vital Signs
        heartRate: true,
        hrv: true,
        restingHeartRate: true,
        bp_sys: true,
        bp_dia: true,
        spo2: true,
        temperature: true,
        skinTemperature: true,
        respiratoryRate: true,

        // Body Measurements
        weight: true,
        height: true,
        bmi: true,
        waistCircumference: true,
        bodyFat: true,
        bodyWaterMass: true,
        boneMass: true,
        leanBodyMass: true,
        basalMetabolicRate: true,

        // Activity Data
        todaySteps: true,
        todayDistance: true,
        todayCalories: true,
        activeCalories: true,
        floorsClimbed: true,
        elevationGained: true,
        vo2Max: true,
        exerciseSessions: true,

        // Blood Glucose
        sugar_fasting: true,
        sugar_pp: true,

        // Sleep Data
        sleepHours: true,
        sleepStages: true,
        lastSleepStart: true,
        lastSleepEnd: true,

        // Nutrition
        hydrationMl: true,
        nutritionData: true,

        // Cycle Tracking
        menstruationFlow: true,
        lastPeriodDate: true,
        cycleLength: true,

        // Lifestyle
        exerciseFrequency: true,
        smokingStatus: true,
        alcoholConsumption: true,
        stressLevel: true,

        // Lab Values
        hemoglobin: true,
        hba1c: true,
        cholesterolTotal: true,
        ldl: true,
        hdl: true,
        triglycerides: true,
        creatinine: true,
        egfr: true,
        alt: true,
        ast: true,
        wbcCount: true,

        // Personal Info
        age: true,
        gender: true,
        dateOfBirth: true,
        ethnicity: true,
        occupation: true,

        // Medical Info
        allergies: true,
        food_habit: true,
        surgery: true,
        transfusion: true,
        accident: true,
        medical_history: true,
        currentMedications: true,
        currentConditions: true,
        pregnancyStatus: true,

        // Sync metadata
        lastHealthConnectSync: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Transform Decimal fields to numbers
    const transformDecimal = (val) => val ? parseFloat(val) : null;

    return NextResponse.json({
      success: true,
      data: {
        // Vital Signs
        heartRate: user.heartRate,
        hrv: user.hrv,
        restingHeartRate: user.restingHeartRate,
        bpSys: user.bp_sys,
        bpDia: user.bp_dia,
        spo2: transformDecimal(user.spo2),
        temperature: transformDecimal(user.temperature),
        skinTemperature: transformDecimal(user.skinTemperature),
        respiratoryRate: user.respiratoryRate,

        // Body Measurements
        weight: transformDecimal(user.weight),
        height: transformDecimal(user.height),
        bmi: transformDecimal(user.bmi),
        waistCircumference: transformDecimal(user.waistCircumference),
        bodyFat: transformDecimal(user.bodyFat),
        bodyWaterMass: transformDecimal(user.bodyWaterMass),
        boneMass: transformDecimal(user.boneMass),
        leanBodyMass: transformDecimal(user.leanBodyMass),
        basalMetabolicRate: user.basalMetabolicRate,

        // Activity Data
        todaySteps: user.todaySteps,
        todayDistance: transformDecimal(user.todayDistance),
        todayCalories: transformDecimal(user.todayCalories),
        activeCalories: transformDecimal(user.activeCalories),
        floorsClimbed: user.floorsClimbed,
        elevationGained: transformDecimal(user.elevationGained),
        vo2Max: transformDecimal(user.vo2Max),
        exerciseSessions: user.exerciseSessions,

        // Blood Glucose
        sugarFasting: transformDecimal(user.sugar_fasting),
        sugarPp: transformDecimal(user.sugar_pp),

        // Sleep Data
        sleepHours: transformDecimal(user.sleepHours),
        sleepStages: user.sleepStages,
        lastSleepStart: user.lastSleepStart?.toISOString(),
        lastSleepEnd: user.lastSleepEnd?.toISOString(),

        // Nutrition
        hydrationMl: user.hydrationMl,
        nutritionData: user.nutritionData,

        // Cycle Tracking
        menstruationFlow: user.menstruationFlow,
        lastPeriodDate: user.lastPeriodDate?.toISOString(),
        cycleLength: user.cycleLength,

        // Lifestyle
        exerciseFrequency: user.exerciseFrequency?.toString(),
        smokingStatus: user.smokingStatus?.toString(),
        alcoholConsumption: user.alcoholConsumption?.toString(),
        stressLevel: user.stressLevel,

        // Lab Values
        hemoglobin: transformDecimal(user.hemoglobin),
        hba1c: transformDecimal(user.hba1c),
        cholesterolTotal: user.cholesterolTotal,
        ldl: user.ldl,
        hdl: user.hdl,
        triglycerides: user.triglycerides,
        creatinine: transformDecimal(user.creatinine),
        egfr: transformDecimal(user.egfr),
        alt: user.alt,
        ast: user.ast,
        wbcCount: transformDecimal(user.wbcCount),

        // Personal Info
        age: user.age,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth?.toISOString(),
        ethnicity: user.ethnicity,
        occupation: user.occupation,

        // Medical Info
        allergies: user.allergies,
        foodHabit: user.food_habit?.toString(),
        surgery: user.surgery,
        transfusion: user.transfusion,
        accident: user.accident,
        medicalHistory: user.medical_history,
        currentMedications: user.currentMedications,
        currentConditions: user.currentConditions,
        pregnancyStatus: user.pregnancyStatus?.toString(),

        // Sync metadata
        lastHealthConnectSync: user.lastHealthConnectSync?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get health data error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get health data", error: error.message },
      { status: 500 }
    );
  }
}
