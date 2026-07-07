import z from "zod";
import { Filter } from "bad-words";

const filter = new Filter();

const noProfanity = (val) => !filter.isProfane(val);

export const doctorFormSchema = z.object({
  specialty: z.string().min(1, "Specialty is Required").refine(noProfanity, {
    message: "Specialty contains inappropriate language",
  }),
  experience: z
    .number({ invalid_type_error: "Experience Must be a Number" })
    .int()
    .min(1, "Experience Must be At Least 1 Year")
    .max(70, "Experience Must be Less than 70 Years"),
  credentialUrl: z
    .string()
    .url("Please Enter a Valid URL")
    .min(1, "Credential URL is Required"),
  description: z
    .string()
    .min(20, "Description Must be At Least 20 Characters")
    .max(1000, "Description Cannot Exceed 1000 Characters")
    .refine(noProfanity, {
      message: "Description Contains Inappropriate Language",
    }),
});

// Schema for updating doctor profile (without credential URL)
export const doctorProfileUpdateSchema = z.object({
  specialty: z.string().min(1, "Specialty is Required").refine(noProfanity, {
    message: "Specialty contains inappropriate language",
  }),
  experience: z
    .number({ invalid_type_error: "Experience Must be a Number" })
    .int()
    .min(1, "Experience Must be At Least 1 Year")
    .max(70, "Experience Must be Less than 70 Years"),
  description: z
    .string()
    .min(20, "Description Must be At Least 20 Characters")
    .max(1000, "Description Cannot Exceed 1000 Characters")
    .refine(noProfanity, {
      message: "Description Contains Inappropriate Language",
    }),
});

// Helper to handle optional number fields (transforms NaN/undefined to null)
const optionalNumber = (schema) =>
  z.preprocess(
    (val) => (val === "" || val === undefined || Number.isNaN(val) ? undefined : val),
    schema.optional().nullable()
  );

export const patientFormSchema = z.object({
  // Basic Information (Required)
  age: z
    .number({ invalid_type_error: "Age is Required" })
    .int()
    .min(1, "Age Must be At Least 1 Year")
    .max(120, "Age Must be Less than 120 Years"),
  gender: z.string().min(1, "Gender is Required").refine(noProfanity, {
    message: "Gender Field Contains Inappropriate Language",
  }),
  dateOfBirth: z.string().optional().nullable(),
  ethnicity: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || noProfanity(val), {
      message: "Ethnicity Contains Inappropriate Language",
    }),
  occupation: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || noProfanity(val), {
      message: "Occupation Contains Inappropriate Language",
    }),
  address: z
    .string()
    .min(5, "Address is Required (At Least 5 Characters)")
    .refine(noProfanity, {
      message: "Address Contains Inappropriate Language",
    }),

  // Body Measurements (Required)
  height: z
    .number({ invalid_type_error: "Height is Required" })
    .min(30, "Height Must be At Least 30 cm")
    .max(300, "Height Must be Less than 300 cm"),
  weight: z
    .number({ invalid_type_error: "Weight is Required" })
    .min(1, "Weight Must be At Least 1 kg")
    .max(500, "Weight Must be Less than 500 kg"),
  waistCircumference: optionalNumber(
    z
      .number()
      .min(30, "Waist Circumference Must be At Least 30 cm")
      .max(300, "Waist Circumference Must be Less than 300 cm")
  ),

  // Lifestyle Factors (Optional)
  smokingStatus: z
    .union([z.enum(["NEVER", "FORMER", "CURRENT"]), z.literal("")])
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  cigarettesPerDay: optionalNumber(
    z.number().int().min(0).max(100)
  ),
  alcoholConsumption: z
    .union([z.enum(["NONE", "OCCASIONAL", "MODERATE", "HEAVY"]), z.literal("")])
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  exerciseFrequency: z
    .union([z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]), z.literal("")])
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  sleepHours: optionalNumber(
    z.number().min(0).max(24)
  ),
  stressLevel: optionalNumber(
    z.number().int().min(1).max(10)
  ),

  // Food Habit (legacy field)
  food_habit: z.enum(["VEG", "NON_VEG", "BOTH"], {
    errorMap: () => ({ message: "Food Preference Required" }),
  }),
  allergies: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || noProfanity(val), {
      message: "Allergies Contain Inappropriate Language",
    }),

  // Blood Pressure (Optional)
  bp_sys: optionalNumber(
    z.number().int().min(70).max(200)
  ),
  bp_dia: optionalNumber(
    z.number().int().min(40).max(120)
  ),

  // Blood Sugar (Optional)
  sugar_fasting: optionalNumber(
    z.number().min(50).max(300)
  ),
  sugar_pp: optionalNumber(
    z.number().min(50).max(400)
  ),

  // Vital Signs (Optional)
  heartRate: optionalNumber(
    z.number().int().min(30).max(250)
  ),
  hrv: optionalNumber(
    z.number().int().min(0).max(300)
  ),
  spo2: optionalNumber(
    z.number().min(50).max(100)
  ),
  temperature: optionalNumber(
    z.number().min(90).max(110)
  ),
  respiratoryRate: optionalNumber(
    z.number().int().min(5).max(60)
  ),

  // Lab Values (Optional)
  hemoglobin: optionalNumber(
    z.number().min(3).max(25)
  ),
  hba1c: optionalNumber(
    z.number().min(3).max(20)
  ),
  cholesterolTotal: optionalNumber(
    z.number().int().min(50).max(500)
  ),
  ldl: optionalNumber(
    z.number().int().min(20).max(400)
  ),
  hdl: optionalNumber(
    z.number().int().min(10).max(150)
  ),
  triglycerides: optionalNumber(
    z.number().int().min(20).max(1000)
  ),
  creatinine: optionalNumber(
    z.number().min(0.1).max(20)
  ),
  egfr: optionalNumber(
    z.number().min(5).max(200)
  ),
  alt: optionalNumber(
    z.number().int().min(0).max(1000)
  ),
  ast: optionalNumber(
    z.number().int().min(0).max(1000)
  ),
  wbcCount: optionalNumber(
    z.number().min(0).max(50)
  ),

  surgery: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || noProfanity(val), {
      message: "Surgery Field Contains Inappropriate Language",
    }),
  transfusion: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || noProfanity(val), {
      message: "Transfusion Field Contains Inappropriate Language",
    }),
  accident: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || noProfanity(val), {
      message: "Accident Field Contains Inappropriate Language",
    }),
  medical_history: z
    .string()
    .optional()
    .nullable(),

  // Current Medications and Conditions (as JSON strings)
  currentMedications: z.string().optional().nullable(),
  currentConditions: z.string().optional().nullable(),

  // Pregnancy Status
  pregnancyStatus: z
    .union([z.enum(["NOT_PREGNANT", "PREGNANT", "POSTPARTUM", "UNKNOWN"]), z.literal("")])
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
});

export const patientProfileUpdateSchema = patientFormSchema;