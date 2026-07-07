"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Stethoscope,
  Loader2,
  MapPin,
  Heart,
  Activity,
  Pill,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserRole } from "@/actions/onboarding";
import { doctorFormSchema, patientFormSchema } from "@/lib/schema";
import { SPECIALITIES } from "@/lib/specialities";
import useFetch from "@/hooks/use-fetch";
import { Filter } from "bad-words";
import { LabReportUpload } from "@/components/lab-report-upload";

const filter = new Filter();

const PATIENT_STEPS = [
  { id: "basic", title: "Basic Info", icon: User },
  { id: "location", title: "Location", icon: MapPin },
  { id: "body", title: "Body Measurements", icon: Activity },
  { id: "lifestyle", title: "Lifestyle", icon: Heart },
  { id: "vitals", title: "Vital Signs", icon: Activity },
  { id: "labs", title: "Lab Values", icon: FileText },
  { id: "history", title: "Medical History", icon: Pill },
];

export default function OnboardingPage() {
  const [step, setStep] = useState("choose-role");
  const [patientStep, setPatientStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { loading, data, fn: submitUserRole } = useFetch(setUserRole);

  const {
    register: registerDoctor,
    handleSubmit: handleDoctorSubmit,
    formState: { errors: doctorErrors },
    setValue: setDoctorValue,
    watch: watchDoctor,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    mode: "onTouched",
    defaultValues: {
      specialty: "",
      experience: undefined,
      credentialUrl: "",
      description: "",
    },
  });

  const {
    register: registerPatient,
    handleSubmit: handlePatientSubmit,
    formState: { errors: patientErrors },
    setValue: setPatientValue,
    watch: watchPatient,
    trigger: triggerPatientValidation,
  } = useForm({
    resolver: zodResolver(patientFormSchema),
    mode: "onTouched",
    defaultValues: {
      age: undefined,
      gender: "",
      dateOfBirth: "",
      ethnicity: "",
      occupation: "",
      address: "",
      height: undefined,
      weight: undefined,
      waistCircumference: undefined,
      bodyFat: undefined,
      smokingStatus: "",
      cigarettesPerDay: undefined,
      alcoholConsumption: "",
      exerciseFrequency: "",
      sleepHours: undefined,
      stressLevel: undefined,
      food_habit: "",
      allergies: "",
      bp_sys: undefined,
      bp_dia: undefined,
      sugar_fasting: undefined,
      sugar_pp: undefined,
      heartRate: undefined,
      hrv: undefined,
      spo2: undefined,
      temperature: undefined,
      respiratoryRate: undefined,
      hemoglobin: undefined,
      hba1c: undefined,
      cholesterolTotal: undefined,
      ldl: undefined,
      hdl: undefined,
      triglycerides: undefined,
      creatinine: undefined,
      egfr: undefined,
      alt: undefined,
      ast: undefined,
      wbcCount: undefined,
      surgery: "",
      transfusion: "",
      accident: "",
      medical_history: "",
      currentMedications: "",
      currentConditions: "",
      pregnancyStatus: "",
      cycleLength: undefined,
    },
  });

  const specialtyValue = watchDoctor("specialty");
  const genderValue = watchPatient("gender");
  const foodHabitValue = watchPatient("food_habit");
  const smokingStatusValue = watchPatient("smokingStatus");
  const alcoholConsumptionValue = watchPatient("alcoholConsumption");
  const exerciseFrequencyValue = watchPatient("exerciseFrequency");
  const pregnancyStatusValue = watchPatient("pregnancyStatus");

  useEffect(() => {
    if (data && data?.success) {
      router.push(data.redirect);
    }
  }, [data, router]);

  // Calculate BMI when height or weight changes
  const height = watchPatient("height");
  const weight = watchPatient("weight");

  useEffect(() => {
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      setPatientValue("bmi", parseFloat(bmi));
    }
  }, [height, weight, setPatientValue]);

  const getLocation = async () => {
    setLocationLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is Not Supported by Your Browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data.display_name) {
            setPatientValue("address", data.display_name);
          } else {
            setPatientValue(
              "address",
              `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`
            );
          }
        } catch (error) {
          setLocationError("Failed to Get Address from Location");
          console.error("Geocoding Error:", error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location Permission Denied. Please Enter Address Manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location Information is Unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location Request Timed Out.");
            break;
          default:
            setLocationError("An Unknown Error Occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const onDoctorSubmit = async (data) => {
    if (loading) return;

    const formData = new FormData();
    formData.append("role", "DOCTOR");
    formData.append("specialty", data.specialty);
    formData.append("experience", data.experience.toString());
    formData.append("credentialUrl", data.credentialUrl);
    formData.append("description", data.description);

    await submitUserRole(formData);
  };

  const onPatientSubmit = async (data) => {
    if (loading || !isSubmitting) return;
    setIsSubmitting(false);

    const formData = new FormData();
    formData.append("role", "PATIENT");

    // Basic Info
    formData.append("age", data.age?.toString() || "");
    formData.append("gender", data.gender || "");
    formData.append("dateOfBirth", data.dateOfBirth || "");
    formData.append("ethnicity", data.ethnicity || "");
    formData.append("occupation", data.occupation || "");
    formData.append("address", data.address || "");

    // Body Measurements
    formData.append("height", data.height?.toString() || "");
    formData.append("weight", data.weight?.toString() || "");
    formData.append("waistCircumference", data.waistCircumference?.toString() || "");
    formData.append("bodyFat", data.bodyFat?.toString() || "");

    // Lifestyle
    formData.append("smokingStatus", data.smokingStatus || "");
    formData.append("cigarettesPerDay", data.cigarettesPerDay?.toString() || "");
    formData.append("alcoholConsumption", data.alcoholConsumption || "");
    formData.append("exerciseFrequency", data.exerciseFrequency || "");
    formData.append("sleepHours", data.sleepHours?.toString() || "");
    formData.append("stressLevel", data.stressLevel?.toString() || "");
    formData.append("food_habit", data.food_habit || "");
    formData.append("allergies", data.allergies || "");

    // Vital Signs
    formData.append("bp_sys", data.bp_sys?.toString() || "");
    formData.append("bp_dia", data.bp_dia?.toString() || "");
    formData.append("heartRate", data.heartRate?.toString() || "");
    formData.append("hrv", data.hrv?.toString() || "");
    formData.append("spo2", data.spo2?.toString() || "");
    formData.append("temperature", data.temperature?.toString() || "");
    formData.append("respiratoryRate", data.respiratoryRate?.toString() || "");

    // Blood Sugar
    formData.append("sugar_fasting", data.sugar_fasting?.toString() || "");
    formData.append("sugar_pp", data.sugar_pp?.toString() || "");

    // Lab Values
    formData.append("hemoglobin", data.hemoglobin?.toString() || "");
    formData.append("hba1c", data.hba1c?.toString() || "");
    formData.append("cholesterolTotal", data.cholesterolTotal?.toString() || "");
    formData.append("ldl", data.ldl?.toString() || "");
    formData.append("hdl", data.hdl?.toString() || "");
    formData.append("triglycerides", data.triglycerides?.toString() || "");
    formData.append("creatinine", data.creatinine?.toString() || "");
    formData.append("egfr", data.egfr?.toString() || "");
    formData.append("alt", data.alt?.toString() || "");
    formData.append("ast", data.ast?.toString() || "");
    formData.append("wbcCount", data.wbcCount?.toString() || "");

    // Medical History
    formData.append("surgery", data.surgery || "");
    formData.append("transfusion", data.transfusion || "");
    formData.append("accident", data.accident || "");
    formData.append("medical_history", data.medical_history || "");
    formData.append("currentMedications", data.currentMedications || "");
    formData.append("currentConditions", data.currentConditions || "");
    formData.append("pregnancyStatus", data.pregnancyStatus || "");
    formData.append("cycleLength", data.cycleLength?.toString() || "");

    await submitUserRole(formData);
  };

  const nextPatientStep = async () => {
    const stepFields = {
      0: ["age", "gender", "food_habit"],
      1: ["address"],
      2: ["height", "weight"],
      3: [],
      4: [],
      5: [],
      6: [],
    };

    const fieldsToValidate = stepFields[patientStep];
    if (fieldsToValidate.length > 0) {
      const isValid = await triggerPatientValidation(fieldsToValidate);
      if (!isValid) return;
    }

    if (patientStep < PATIENT_STEPS.length - 1) {
      setPatientStep(patientStep + 1);
    }
  };

  const prevPatientStep = () => {
    if (patientStep > 0) {
      setPatientStep(patientStep - 1);
    }
  };

  // Role Selection Screen
  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="border-emerald-900/20 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/10"
          onClick={() => !loading && setStep("patient-form")}
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-900/20 rounded-full mb-4">
              <User className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">
              Join as a Patient
            </CardTitle>
            <CardDescription className="mb-4">
              Book Appointments, Consult with Doctors, and Manage your
              Healthcare Journey
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue as Patient"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card
          className="border-emerald-900/20 hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/10"
          onClick={() => !loading && setStep("doctor-form")}
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-500/10 dark:bg-emerald-900/20 rounded-full mb-4">
              <Stethoscope className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">
              Join as a Doctor
            </CardTitle>
            <CardDescription className="mb-4">
              Create your Professional Profile, Set your Availability, and
              Provide Consultations
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              Continue as Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Doctor Form
  if (step === "doctor-form") {
    return (
      <Card className="border-emerald-900/20">
        <CardContent className="pt-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-foreground mb-2">
              Complete Your Doctor Profile
            </CardTitle>
            <CardDescription>
              Please Provide your Professional Details for Verification
            </CardDescription>
          </div>

          <form
            onSubmit={handleDoctorSubmit(onDoctorSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="specialty">Medical Specialty</Label>
              <Select
                value={specialtyValue}
                onValueChange={(value) => setDoctorValue("specialty", value, { shouldValidate: true })}
              >
                <SelectTrigger id="specialty" className="border-emerald-900/20 focus:ring-emerald-500">
                  <SelectValue placeholder="Select Your Specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALITIES.map((spec) => (
                    <SelectItem
                      key={spec.name}
                      value={spec.name}
                      className="flex items-center gap-2"
                    >
                      <span className="text-emerald-500">{spec.icon}</span>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {doctorErrors.specialty && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.specialty.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="e.g. 5"
                className="text-sm border-emerald-900/20 focus:ring-emerald-500"
                {...registerDoctor("experience", { valueAsNumber: true })}
              />
              {doctorErrors.experience && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialUrl">Link to Credential Document</Label>
              <Input
                id="credentialUrl"
                type="url"
                placeholder="https://example.com/my-medical-degree.pdf"
                className="text-sm border-emerald-900/20 focus:ring-emerald-500"
                {...registerDoctor("credentialUrl")}
              />
              {doctorErrors.credentialUrl && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.credentialUrl.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Please Provide a Link to your Medical Degree or Certification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Your Services</Label>
              <Textarea
                id="description"
                placeholder="Describe your Expertise, Services, and Approach to Patient Care..."
                rows="4"
                className="bg-background border border-emerald-900/20 h-32 text-sm focus:ring-emerald-500"
                {...registerDoctor("description")}
              />
              {doctorErrors.description && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {doctorErrors.description.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("choose-role")}
                className="border-emerald-900/30 hover:bg-emerald-500/10"
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Patient Multi-Step Form
  if (step === "patient-form") {
    return (
      <Card className="border-emerald-900/20">
        <CardContent className="pt-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-foreground mb-2">
              Complete Your Patient Profile
            </CardTitle>
            <CardDescription>
              Help Doctors Better Understand Your Health Needs
            </CardDescription>
          </div>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {PATIENT_STEPS.map((s, index) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    className={`flex flex-col items-center ${
                      index <= patientStep ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        index < patientStep
                          ? "bg-emerald-600 text-white"
                          : index === patientStep
                          ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index < patientStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs hidden sm:block">{s.title}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${((patientStep + 1) / PATIENT_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handlePatientSubmit(onPatientSubmit)} className="space-y-6">
            {/* Step 0: Basic Info */}
            {patientStep === 0 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="20"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("age", { valueAsNumber: true })}
                    />
                    {patientErrors.age && (
                      <p className="text-red-500 text-sm">{patientErrors.age.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={genderValue}
                      onValueChange={(value) => setPatientValue("gender", value, { shouldValidate: true })}
                    >
                      <SelectTrigger id="gender" className="border-emerald-900/20 focus:ring-emerald-500">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {patientErrors.gender && (
                      <p className="text-red-500 text-sm">{patientErrors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("dateOfBirth")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ethnicity">Ethnicity</Label>
                    <Input
                      id="ethnicity"
                      placeholder="e.g., Asian, Caucasian"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("ethnicity")}
                    />
                    {patientErrors.ethnicity && (
                      <p className="text-red-500 text-sm">{patientErrors.ethnicity.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="Your Profession or Job"
                    className="border-emerald-900/20 focus:ring-emerald-500"
                    {...registerPatient("occupation")}
                  />
                  {patientErrors.occupation && (
                    <p className="text-red-500 text-sm">{patientErrors.occupation.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="food_habit">Food Preference *</Label>
                  <Select
                    value={foodHabitValue}
                    onValueChange={(value) => setPatientValue("food_habit", value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="food_habit" className="border-emerald-900/20 focus:ring-emerald-500">
                      <SelectValue placeholder="Select Food Preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VEG">Vegetarian</SelectItem>
                      <SelectItem value="NON_VEG">Non-Vegetarian</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  {patientErrors.food_habit && (
                    <p className="text-red-500 text-sm">{patientErrors.food_habit.message}</p>
                  )}
                </div>

                {genderValue === "Female" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="pregnancyStatus">Pregnancy Status</Label>
                        <Select
                          value={pregnancyStatusValue}
                          onValueChange={(value) => setPatientValue("pregnancyStatus", value)}
                        >
                          <SelectTrigger id="pregnancyStatus" className="border-emerald-900/20 focus:ring-emerald-500">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_PREGNANT">Not Pregnant</SelectItem>
                            <SelectItem value="PREGNANT">Pregnant</SelectItem>
                            <SelectItem value="POSTPARTUM">Postpartum</SelectItem>
                            <SelectItem value="UNKNOWN">Prefer Not to Say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cycleLength">Menstrual Cycle Length (days)</Label>
                        <Input
                          id="cycleLength"
                          type="number"
                          min="20"
                          max="45"
                          placeholder="e.g., 28"
                          className="border-emerald-900/20 focus:ring-emerald-500"
                          {...registerPatient("cycleLength", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 1: Location */}
            {patientStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getLocation}
                      disabled={locationLoading}
                      className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Use My Current Location
                        </>
                      )}
                    </Button>
                  </div>

                  {locationError && (
                    <p className="text-amber-500 text-sm">{locationError}</p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      placeholder="Enter Your Complete Address or Use the Location Button Above"
                      className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                      {...registerPatient("address")}
                    />
                    {patientErrors.address && (
                      <p className="text-red-500 text-sm">{patientErrors.address.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Body Measurements */}
            {patientStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Body Measurements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      placeholder="e.g., 170"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("height", { valueAsNumber: true })}
                    />
                    {patientErrors.height && (
                      <p className="text-red-500 text-sm">{patientErrors.height.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="1"
                      max="500"
                      placeholder="e.g., 70"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("weight", { valueAsNumber: true })}
                    />
                    {patientErrors.weight && (
                      <p className="text-red-500 text-sm">{patientErrors.weight.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="waistCircumference">Waist (cm)</Label>
                    <Input
                      id="waistCircumference"
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      placeholder="e.g., 80"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("waistCircumference", { valueAsNumber: true })}
                    />
                    {patientErrors.waistCircumference && (
                      <p className="text-red-500 text-sm">{patientErrors.waistCircumference.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bodyFat">Body Fat (%)</Label>
                    <Input
                      id="bodyFat"
                      type="number"
                      step="0.1"
                      min="1"
                      max="60"
                      placeholder="e.g., 20"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("bodyFat", { valueAsNumber: true })}
                    />
                    {patientErrors.bodyFat && (
                      <p className="text-red-500 text-sm">{patientErrors.bodyFat.message}</p>
                    )}
                  </div>
                </div>

                {height > 0 && weight > 0 && !isNaN(height) && !isNaN(weight) && (
                  <div className="p-4 bg-emerald-500/10 rounded-lg">
                    <p className="text-sm text-emerald-500">
                      <strong>Calculated BMI:</strong>{" "}
                      {(weight / Math.pow(height / 100, 2)).toFixed(1)} kg/m²
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Lifestyle */}
            {patientStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Lifestyle Factors
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smokingStatus">Smoking Status</Label>
                    <Select
                      value={smokingStatusValue}
                      onValueChange={(value) => setPatientValue("smokingStatus", value, { shouldValidate: true })}
                    >
                      <SelectTrigger className="border-emerald-900/20 focus:ring-emerald-500">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEVER">Never Smoked</SelectItem>
                        <SelectItem value="FORMER">Former Smoker</SelectItem>
                        <SelectItem value="CURRENT">Current Smoker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {smokingStatusValue === "CURRENT" && (
                    <div className="space-y-2">
                      <Label htmlFor="cigarettesPerDay">Cigarettes Per Day</Label>
                      <Input
                        id="cigarettesPerDay"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g., 10"
                        className="border-emerald-900/20 focus:ring-emerald-500"
                        {...registerPatient("cigarettesPerDay", { valueAsNumber: true })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="alcoholConsumption">Alcohol Consumption</Label>
                    <Select
                      value={alcoholConsumptionValue}
                      onValueChange={(value) => setPatientValue("alcoholConsumption", value, { shouldValidate: true })}
                    >
                      <SelectTrigger className="border-emerald-900/20 focus:ring-emerald-500">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="OCCASIONAL">Occasional</SelectItem>
                        <SelectItem value="MODERATE">Moderate</SelectItem>
                        <SelectItem value="HEAVY">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exerciseFrequency">Exercise Frequency</Label>
                    <Select
                      value={exerciseFrequencyValue}
                      onValueChange={(value) => setPatientValue("exerciseFrequency", value, { shouldValidate: true })}
                    >
                      <SelectTrigger className="border-emerald-900/20 focus:ring-emerald-500">
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEDENTARY">Sedentary (Little/No Exercise)</SelectItem>
                        <SelectItem value="LIGHT">Light (1-2 days/week)</SelectItem>
                        <SelectItem value="MODERATE">Moderate (3-4 days/week)</SelectItem>
                        <SelectItem value="ACTIVE">Active (5-6 days/week)</SelectItem>
                        <SelectItem value="VERY_ACTIVE">Very Active (Daily)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sleepHours">Average Sleep (hours/day)</Label>
                    <Input
                      id="sleepHours"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="e.g., 7.5"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("sleepHours", { valueAsNumber: true })}
                    />
                    {patientErrors.sleepHours && (
                      <p className="text-red-500 text-sm">{patientErrors.sleepHours.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stressLevel">Stress Level (1-10)</Label>
                    <Input
                      id="stressLevel"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="1 = Low, 10 = High"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("stressLevel", { valueAsNumber: true })}
                    />
                    {patientErrors.stressLevel && (
                      <p className="text-red-500 text-sm">{patientErrors.stressLevel.message}</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Step 4: Vital Signs */}
            {patientStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Vital Signs
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bp_sys">Blood Pressure - Systolic (mmHg)</Label>
                    <Input
                      id="bp_sys"
                      type="number"
                      min="70"
                      max="200"
                      placeholder="e.g., 120"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("bp_sys", { valueAsNumber: true })}
                    />
                    {patientErrors.bp_sys && (
                      <p className="text-red-500 text-sm">{patientErrors.bp_sys.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bp_dia">Blood Pressure - Diastolic (mmHg)</Label>
                    <Input
                      id="bp_dia"
                      type="number"
                      min="40"
                      max="120"
                      placeholder="e.g., 80"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("bp_dia", { valueAsNumber: true })}
                    />
                    {patientErrors.bp_dia && (
                      <p className="text-red-500 text-sm">{patientErrors.bp_dia.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      min="30"
                      max="250"
                      placeholder="e.g., 72"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("heartRate", { valueAsNumber: true })}
                    />
                    {patientErrors.heartRate && (
                      <p className="text-red-500 text-sm">{patientErrors.heartRate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hrv">Heart Rate Variability (ms)</Label>
                    <Input
                      id="hrv"
                      type="number"
                      min="0"
                      max="200"
                      placeholder="e.g., 50"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("hrv", { valueAsNumber: true })}
                    />
                    {patientErrors.hrv && (
                      <p className="text-red-500 text-sm">{patientErrors.hrv.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="spo2">Oxygen Saturation - SpO2 (%)</Label>
                    <Input
                      id="spo2"
                      type="number"
                      step="0.1"
                      min="50"
                      max="100"
                      placeholder="e.g., 98"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("spo2", { valueAsNumber: true })}
                    />
                    {patientErrors.spo2 && (
                      <p className="text-red-500 text-sm">{patientErrors.spo2.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
                    <Input
                      id="respiratoryRate"
                      type="number"
                      min="5"
                      max="60"
                      placeholder="e.g., 16"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("respiratoryRate", { valueAsNumber: true })}
                    />
                    {patientErrors.respiratoryRate && (
                      <p className="text-red-500 text-sm">{patientErrors.respiratoryRate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°F)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="90"
                      max="110"
                      placeholder="e.g., 98.6"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("temperature", { valueAsNumber: true })}
                    />
                    {patientErrors.temperature && (
                      <p className="text-red-500 text-sm">{patientErrors.temperature.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sugar_fasting">Blood Sugar - Fasting (mg/dL)</Label>
                    <Input
                      id="sugar_fasting"
                      type="number"
                      step="0.1"
                      min="50"
                      max="300"
                      placeholder="e.g., 95"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("sugar_fasting", { valueAsNumber: true })}
                    />
                    {patientErrors.sugar_fasting && (
                      <p className="text-red-500 text-sm">{patientErrors.sugar_fasting.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sugar_pp">Blood Sugar - Post Meal (mg/dL)</Label>
                    <Input
                      id="sugar_pp"
                      type="number"
                      step="0.1"
                      min="50"
                      max="400"
                      placeholder="e.g., 140"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("sugar_pp", { valueAsNumber: true })}
                    />
                    {patientErrors.sugar_pp && (
                      <p className="text-red-500 text-sm">{patientErrors.sugar_pp.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Lab Values */}
            {patientStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lab Values (Optional - Enter if Available)
                </h3>

                <LabReportUpload
                  disabled={loading}
                  onLabValuesExtracted={(values) => {
                    if (values.hemoglobin) setPatientValue("hemoglobin", values.hemoglobin);
                    if (values.hba1c) setPatientValue("hba1c", values.hba1c);
                    if (values.cholesterolTotal) setPatientValue("cholesterolTotal", values.cholesterolTotal);
                    if (values.ldl) setPatientValue("ldl", values.ldl);
                    if (values.hdl) setPatientValue("hdl", values.hdl);
                    if (values.triglycerides) setPatientValue("triglycerides", values.triglycerides);
                    if (values.creatinine) setPatientValue("creatinine", values.creatinine);
                    if (values.egfr) setPatientValue("egfr", values.egfr);
                    if (values.alt) setPatientValue("alt", values.alt);
                    if (values.ast) setPatientValue("ast", values.ast);
                    if (values.wbcCount) setPatientValue("wbcCount", values.wbcCount);
                    if (values.sugar_fasting) setPatientValue("sugar_fasting", values.sugar_fasting);
                    if (values.sugar_pp) setPatientValue("sugar_pp", values.sugar_pp);
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hemoglobin">Hemoglobin (g/dL)</Label>
                    <Input
                      id="hemoglobin"
                      type="number"
                      step="0.1"
                      min="3"
                      max="25"
                      placeholder="e.g., 14.5"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("hemoglobin", { valueAsNumber: true })}
                    />
                    {patientErrors.hemoglobin && (
                      <p className="text-red-500 text-sm">{patientErrors.hemoglobin.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hba1c">HbA1c (%)</Label>
                    <Input
                      id="hba1c"
                      type="number"
                      step="0.1"
                      min="3"
                      max="20"
                      placeholder="e.g., 5.7"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("hba1c", { valueAsNumber: true })}
                    />
                    {patientErrors.hba1c && (
                      <p className="text-red-500 text-sm">{patientErrors.hba1c.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cholesterolTotal">Total Cholesterol (mg/dL)</Label>
                    <Input
                      id="cholesterolTotal"
                      type="number"
                      min="50"
                      max="500"
                      placeholder="e.g., 200"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("cholesterolTotal", { valueAsNumber: true })}
                    />
                    {patientErrors.cholesterolTotal && (
                      <p className="text-red-500 text-sm">{patientErrors.cholesterolTotal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ldl">LDL Cholesterol (mg/dL)</Label>
                    <Input
                      id="ldl"
                      type="number"
                      min="20"
                      max="400"
                      placeholder="e.g., 100"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("ldl", { valueAsNumber: true })}
                    />
                    {patientErrors.ldl && (
                      <p className="text-red-500 text-sm">{patientErrors.ldl.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hdl">HDL Cholesterol (mg/dL)</Label>
                    <Input
                      id="hdl"
                      type="number"
                      min="10"
                      max="150"
                      placeholder="e.g., 50"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("hdl", { valueAsNumber: true })}
                    />
                    {patientErrors.hdl && (
                      <p className="text-red-500 text-sm">{patientErrors.hdl.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="triglycerides">Triglycerides (mg/dL)</Label>
                    <Input
                      id="triglycerides"
                      type="number"
                      min="20"
                      max="1000"
                      placeholder="e.g., 150"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("triglycerides", { valueAsNumber: true })}
                    />
                    {patientErrors.triglycerides && (
                      <p className="text-red-500 text-sm">{patientErrors.triglycerides.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="creatinine">Creatinine (mg/dL)</Label>
                    <Input
                      id="creatinine"
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="20"
                      placeholder="e.g., 1.0"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("creatinine", { valueAsNumber: true })}
                    />
                    {patientErrors.creatinine && (
                      <p className="text-red-500 text-sm">{patientErrors.creatinine.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="egfr">eGFR (mL/min)</Label>
                    <Input
                      id="egfr"
                      type="number"
                      step="0.1"
                      min="5"
                      max="200"
                      placeholder="e.g., 90"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("egfr", { valueAsNumber: true })}
                    />
                    {patientErrors.egfr && (
                      <p className="text-red-500 text-sm">{patientErrors.egfr.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="alt">ALT (U/L)</Label>
                    <Input
                      id="alt"
                      type="number"
                      min="0"
                      max="500"
                      placeholder="e.g., 25"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("alt", { valueAsNumber: true })}
                    />
                    {patientErrors.alt && (
                      <p className="text-red-500 text-sm">{patientErrors.alt.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ast">AST (U/L)</Label>
                    <Input
                      id="ast"
                      type="number"
                      min="0"
                      max="500"
                      placeholder="e.g., 25"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("ast", { valueAsNumber: true })}
                    />
                    {patientErrors.ast && (
                      <p className="text-red-500 text-sm">{patientErrors.ast.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wbcCount">WBC Count (K/µL)</Label>
                    <Input
                      id="wbcCount"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 7.5"
                      className="border-emerald-900/20 focus:ring-emerald-500"
                      {...registerPatient("wbcCount", { valueAsNumber: true })}
                    />
                    {patientErrors.wbcCount && (
                      <p className="text-red-500 text-sm">{patientErrors.wbcCount.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Medical History */}
            {patientStep === 6 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medical History
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (If Any)</Label>
                  <Textarea
                    id="allergies"
                    rows={2}
                    placeholder="List any Allergies (Medications, Food, Environmental)"
                    className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                    {...registerPatient("allergies")}
                  />
                  {patientErrors.allergies && (
                    <p className="text-red-500 text-sm">{patientErrors.allergies.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentMedications">Current Medications</Label>
                  <Textarea
                    id="currentMedications"
                    rows={2}
                    placeholder="List all Medications you are Currently Taking"
                    className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                    {...registerPatient("currentMedications")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentConditions">Current Medical Conditions</Label>
                  <Textarea
                    id="currentConditions"
                    rows={2}
                    placeholder="List any Ongoing Medical Conditions (e.g., Diabetes, Hypertension)"
                    className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                    {...registerPatient("currentConditions")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surgery">Previous Surgeries</Label>
                  <Textarea
                    id="surgery"
                    rows={2}
                    placeholder="List any Surgeries you've had"
                    className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                    {...registerPatient("surgery")}
                  />
                  {patientErrors.surgery && (
                    <p className="text-red-500 text-sm">{patientErrors.surgery.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfusion">Blood Transfusions</Label>
                  <Textarea
                    id="transfusion"
                    rows={2}
                    placeholder="Details of any Blood Transfusions"
                    className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                    {...registerPatient("transfusion")}
                  />
                  {patientErrors.transfusion && (
                    <p className="text-red-500 text-sm">{patientErrors.transfusion.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accident">Major Accidents</Label>
                  <Textarea
                    id="accident"
                    rows={2}
                    placeholder="Details of any Major Accidents or Injuries"
                    className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                    {...registerPatient("accident")}
                  />
                  {patientErrors.accident && (
                    <p className="text-red-500 text-sm">{patientErrors.accident.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_history">Other Medical History</Label>
                  <Textarea
                    id="medical_history"
                    rows={3}
                    placeholder="Any Other Relevant Medical History or Notes"
                    className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                    {...registerPatient("medical_history")}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-emerald-900/20">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (patientStep === 0) {
                    setStep("choose-role");
                  } else {
                    prevPatientStep();
                  }
                }}
                className="border-emerald-900/30 hover:bg-emerald-500/10"
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {patientStep < PATIENT_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextPatientStep}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                  onClick={() => setIsSubmitting(true)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Complete Profile
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
}
