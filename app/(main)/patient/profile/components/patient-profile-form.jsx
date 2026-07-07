"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  MapPin,
  User,
  Heart,
  Activity,
  Pill,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientProfileUpdateSchema } from "@/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { updatePatientProfile } from "@/actions/onboarding";
import { toast } from "sonner";
import { LabReportUpload } from "@/components/lab-report-upload";

const PROFILE_STEPS = [
  { id: "basic", title: "Basic Info", icon: User },
  { id: "location", title: "Location", icon: MapPin },
  { id: "body", title: "Body Measurements", icon: Activity },
  { id: "lifestyle", title: "Lifestyle", icon: Heart },
  { id: "vitals", title: "Vital Signs", icon: Activity },
  { id: "labs", title: "Lab Values", icon: FileText },
  { id: "history", title: "Medical History", icon: Pill },
];

export function PatientProfileForm({ user }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const {
    loading,
    data,
    fn: submitProfileUpdate,
  } = useFetch(updatePatientProfile);

  // Format date for input
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Extract medications text from JSON
  const getMedicationsText = (medications) => {
    if (!medications) return "";
    if (Array.isArray(medications) && medications[0]?.text) {
      return medications[0].text;
    }
    return "";
  };

  // Extract conditions text from JSON
  const getConditionsText = (conditions) => {
    if (!conditions) return "";
    if (Array.isArray(conditions) && conditions[0]?.text) {
      return conditions[0].text;
    }
    return "";
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    control,
  } = useForm({
    resolver: zodResolver(patientProfileUpdateSchema),
    mode: "onTouched",
    defaultValues: {
      age: user?.age || undefined,
      gender: user?.gender || "",
      dateOfBirth: formatDateForInput(user?.dateOfBirth),
      ethnicity: user?.ethnicity || "",
      occupation: user?.occupation || "",
      address: user?.address || "",
      height: user?.height || undefined,
      weight: user?.weight || undefined,
      waistCircumference: user?.waistCircumference || undefined,
      bodyFat: user?.bodyFat || undefined,
      smokingStatus: user?.smokingStatus || "",
      cigarettesPerDay: user?.cigarettesPerDay || undefined,
      alcoholConsumption: user?.alcoholConsumption || "",
      exerciseFrequency: user?.exerciseFrequency || "",
      sleepHours: user?.sleepHours || undefined,
      stressLevel: user?.stressLevel || undefined,
      food_habit: user?.food_habit || "",
      allergies: user?.allergies || "",
      bp_sys: user?.bp_sys || undefined,
      bp_dia: user?.bp_dia || undefined,
      heartRate: user?.heartRate || undefined,
      hrv: user?.hrv || undefined,
      spo2: user?.spo2 || undefined,
      temperature: user?.temperature || undefined,
      respiratoryRate: user?.respiratoryRate || undefined,
      sugar_fasting: user?.sugar_fasting || undefined,
      sugar_pp: user?.sugar_pp || undefined,
      hemoglobin: user?.hemoglobin || undefined,
      hba1c: user?.hba1c || undefined,
      cholesterolTotal: user?.cholesterolTotal || undefined,
      ldl: user?.ldl || undefined,
      hdl: user?.hdl || undefined,
      triglycerides: user?.triglycerides || undefined,
      creatinine: user?.creatinine || undefined,
      egfr: user?.egfr || undefined,
      alt: user?.alt || undefined,
      ast: user?.ast || undefined,
      wbcCount: user?.wbcCount || undefined,
      surgery: user?.surgery || "",
      transfusion: user?.transfusion || "",
      accident: user?.accident || "",
      medical_history: user?.medical_history || "",
      currentMedications: getMedicationsText(user?.currentMedications),
      currentConditions: getConditionsText(user?.currentConditions),
      pregnancyStatus: user?.pregnancyStatus || "",
      cycleLength: user?.cycleLength || undefined,
    },
  });

  const genderValue = watch("gender");
  const smokingStatusValue = watch("smokingStatus");
  const height = watch("height");
  const weight = watch("weight");

  useEffect(() => {
    if (data?.success) {
      toast.success("Profile Updated Successfully!");
      router.refresh();
    }
  }, [data, router]);

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
            setValue("address", data.display_name);
          } else {
            setValue(
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
            setLocationError("Location Permission Denied.");
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

  const onSubmit = async (data) => {
    if (loading) return;

    const formData = new FormData();

    // Basic Info
    formData.append("age", data.age?.toString() || "");
    formData.append("gender", data.gender || "");
    formData.append("dateOfBirth", data.dateOfBirth || "");
    formData.append("ethnicity", data.ethnicity || "");
    formData.append("occupation", data.occupation || "");
    formData.append("address", data.address || "");
    formData.append("food_habit", data.food_habit || "");

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

    // Vital Signs
    formData.append("bp_sys", data.bp_sys?.toString() || "");
    formData.append("bp_dia", data.bp_dia?.toString() || "");
    formData.append("heartRate", data.heartRate?.toString() || "");
    formData.append("hrv", data.hrv?.toString() || "");
    formData.append("spo2", data.spo2?.toString() || "");
    formData.append("temperature", data.temperature?.toString() || "");
    formData.append("respiratoryRate", data.respiratoryRate?.toString() || "");
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
    formData.append("allergies", data.allergies || "");
    formData.append("surgery", data.surgery || "");
    formData.append("transfusion", data.transfusion || "");
    formData.append("accident", data.accident || "");
    formData.append("medical_history", data.medical_history || "");
    formData.append("currentMedications", data.currentMedications || "");
    formData.append("currentConditions", data.currentConditions || "");
    formData.append("pregnancyStatus", data.pregnancyStatus || "");
    formData.append("cycleLength", data.cycleLength?.toString() || "");

    try {
      await submitProfileUpdate(formData);
    } catch (error) {
      console.error("Form Submission Error:", error);
    }
  };

  const nextStep = async () => {
    const stepFields = {
      0: ["age", "gender", "food_habit"],
      1: ["address"],
      2: ["height", "weight"],
      3: [],
      4: [],
      5: [],
      6: [],
    };

    const fieldsToValidate = stepFields[currentStep];
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    if (currentStep < PROFILE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {PROFILE_STEPS.map((s, index) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={`flex flex-col items-center cursor-pointer ${
                  index <= currentStep ? "text-emerald-500" : "text-muted-foreground"
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    index < currentStep
                      ? "bg-emerald-600 text-white"
                      : index === currentStep
                      ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
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
            style={{ width: `${((currentStep + 1) / PROFILE_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 0: Basic Info */}
        {currentStep === 0 && (
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
                  {...register("age", { valueAsNumber: true })}
                />
                {errors.age && (
                  <p className="text-red-500 text-sm">{errors.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="border-emerald-900/20 focus:ring-emerald-500">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && (
                  <p className="text-red-500 text-sm">{errors.gender.message}</p>
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
                  {...register("dateOfBirth")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ethnicity">Ethnicity</Label>
                <Input
                  id="ethnicity"
                  placeholder="e.g., Asian, Caucasian"
                  className="border-emerald-900/20 focus:ring-emerald-500"
                  {...register("ethnicity")}
                />
                {errors.ethnicity && (
                  <p className="text-red-500 text-sm">{errors.ethnicity.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="Your Profession or Job"
                className="border-emerald-900/20 focus:ring-emerald-500"
                {...register("occupation")}
              />
              {errors.occupation && (
                <p className="text-red-500 text-sm">{errors.occupation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="food_habit">Food Preference *</Label>
              <Controller
                name="food_habit"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="border-emerald-900/20 focus:ring-emerald-500">
                      <SelectValue placeholder="Select Food Preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VEG">Vegetarian</SelectItem>
                      <SelectItem value="NON_VEG">Non-Vegetarian</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.food_habit && (
                <p className="text-red-500 text-sm">{errors.food_habit.message}</p>
              )}
            </div>

            {genderValue === "Female" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pregnancyStatus">Pregnancy Status</Label>
                    <Controller
                      name="pregnancyStatus"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="border-emerald-900/20 focus:ring-emerald-500">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_PREGNANT">Not Pregnant</SelectItem>
                            <SelectItem value="PREGNANT">Pregnant</SelectItem>
                            <SelectItem value="POSTPARTUM">Postpartum</SelectItem>
                            <SelectItem value="UNKNOWN">Prefer Not to Say</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
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
                      {...register("cycleLength", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 1: Location */}
        {currentStep === 1 && (
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
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Body Measurements */}
        {currentStep === 2 && (
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
                  {...register("height", { valueAsNumber: true })}
                />
                {errors.height && (
                  <p className="text-red-500 text-sm">{errors.height.message}</p>
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
                  {...register("weight", { valueAsNumber: true })}
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm">{errors.weight.message}</p>
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
                  {...register("waistCircumference", { valueAsNumber: true })}
                />
                {errors.waistCircumference && (
                  <p className="text-red-500 text-sm">{errors.waistCircumference.message}</p>
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
                  {...register("bodyFat", { valueAsNumber: true })}
                />
                {errors.bodyFat && (
                  <p className="text-red-500 text-sm">{errors.bodyFat.message}</p>
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
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Lifestyle Factors
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="smokingStatus">Smoking Status</Label>
                <Controller
                  name="smokingStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                  )}
                />
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
                    {...register("cigarettesPerDay", { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="alcoholConsumption">Alcohol Consumption</Label>
                <Controller
                  name="alcoholConsumption"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exerciseFrequency">Exercise Frequency</Label>
                <Controller
                  name="exerciseFrequency"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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
                  )}
                />
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
                  {...register("sleepHours", { valueAsNumber: true })}
                />
                {errors.sleepHours && (
                  <p className="text-red-500 text-sm">{errors.sleepHours.message}</p>
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
                  {...register("stressLevel", { valueAsNumber: true })}
                />
                {errors.stressLevel && (
                  <p className="text-red-500 text-sm">{errors.stressLevel.message}</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Step 4: Vital Signs */}
        {currentStep === 4 && (
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
                  {...register("bp_sys", { valueAsNumber: true })}
                />
                {errors.bp_sys && (
                  <p className="text-red-500 text-sm">{errors.bp_sys.message}</p>
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
                  {...register("bp_dia", { valueAsNumber: true })}
                />
                {errors.bp_dia && (
                  <p className="text-red-500 text-sm">{errors.bp_dia.message}</p>
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
                  {...register("heartRate", { valueAsNumber: true })}
                />
                {errors.heartRate && (
                  <p className="text-red-500 text-sm">{errors.heartRate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hrv">Heart Rate Variability - HRV (ms)</Label>
                <Input
                  id="hrv"
                  type="number"
                  min="0"
                  max="300"
                  placeholder="e.g., 50"
                  className="border-emerald-900/20 focus:ring-emerald-500"
                  {...register("hrv", { valueAsNumber: true })}
                />
                {errors.hrv && (
                  <p className="text-red-500 text-sm">{errors.hrv.message}</p>
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
                  {...register("spo2", { valueAsNumber: true })}
                />
                {errors.spo2 && (
                  <p className="text-red-500 text-sm">{errors.spo2.message}</p>
                )}
              </div>

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
                  {...register("temperature", { valueAsNumber: true })}
                />
                {errors.temperature && (
                  <p className="text-red-500 text-sm">{errors.temperature.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  min="5"
                  max="60"
                  placeholder="e.g., 16"
                  className="border-emerald-900/20 focus:ring-emerald-500"
                  {...register("respiratoryRate", { valueAsNumber: true })}
                />
                {errors.respiratoryRate && (
                  <p className="text-red-500 text-sm">{errors.respiratoryRate.message}</p>
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
                  {...register("sugar_fasting", { valueAsNumber: true })}
                />
                {errors.sugar_fasting && (
                  <p className="text-red-500 text-sm">{errors.sugar_fasting.message}</p>
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
                  {...register("sugar_pp", { valueAsNumber: true })}
                />
                {errors.sugar_pp && (
                  <p className="text-red-500 text-sm">{errors.sugar_pp.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Lab Values */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lab Values (Optional - Enter if Available)
            </h3>

            <LabReportUpload
              disabled={loading}
              onLabValuesExtracted={(values) => {
                if (values.hemoglobin) setValue("hemoglobin", values.hemoglobin);
                if (values.hba1c) setValue("hba1c", values.hba1c);
                if (values.cholesterolTotal) setValue("cholesterolTotal", values.cholesterolTotal);
                if (values.ldl) setValue("ldl", values.ldl);
                if (values.hdl) setValue("hdl", values.hdl);
                if (values.triglycerides) setValue("triglycerides", values.triglycerides);
                if (values.creatinine) setValue("creatinine", values.creatinine);
                if (values.egfr) setValue("egfr", values.egfr);
                if (values.alt) setValue("alt", values.alt);
                if (values.ast) setValue("ast", values.ast);
                if (values.wbcCount) setValue("wbcCount", values.wbcCount);
                if (values.sugar_fasting) setValue("sugar_fasting", values.sugar_fasting);
                if (values.sugar_pp) setValue("sugar_pp", values.sugar_pp);
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
                  {...register("hemoglobin", { valueAsNumber: true })}
                />
                {errors.hemoglobin && (
                  <p className="text-red-500 text-sm">{errors.hemoglobin.message}</p>
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
                  {...register("hba1c", { valueAsNumber: true })}
                />
                {errors.hba1c && (
                  <p className="text-red-500 text-sm">{errors.hba1c.message}</p>
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
                  {...register("cholesterolTotal", { valueAsNumber: true })}
                />
                {errors.cholesterolTotal && (
                  <p className="text-red-500 text-sm">{errors.cholesterolTotal.message}</p>
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
                  {...register("ldl", { valueAsNumber: true })}
                />
                {errors.ldl && (
                  <p className="text-red-500 text-sm">{errors.ldl.message}</p>
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
                  {...register("hdl", { valueAsNumber: true })}
                />
                {errors.hdl && (
                  <p className="text-red-500 text-sm">{errors.hdl.message}</p>
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
                  {...register("triglycerides", { valueAsNumber: true })}
                />
                {errors.triglycerides && (
                  <p className="text-red-500 text-sm">{errors.triglycerides.message}</p>
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
                  {...register("creatinine", { valueAsNumber: true })}
                />
                {errors.creatinine && (
                  <p className="text-red-500 text-sm">{errors.creatinine.message}</p>
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
                  {...register("egfr", { valueAsNumber: true })}
                />
                {errors.egfr && (
                  <p className="text-red-500 text-sm">{errors.egfr.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="alt">ALT (U/L)</Label>
                <Input
                  id="alt"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="e.g., 25"
                  className="border-emerald-900/20 focus:ring-emerald-500"
                  {...register("alt", { valueAsNumber: true })}
                />
                {errors.alt && (
                  <p className="text-red-500 text-sm">{errors.alt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ast">AST (U/L)</Label>
                <Input
                  id="ast"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="e.g., 20"
                  className="border-emerald-900/20 focus:ring-emerald-500"
                  {...register("ast", { valueAsNumber: true })}
                />
                {errors.ast && (
                  <p className="text-red-500 text-sm">{errors.ast.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="wbcCount">WBC Count (×10³/µL)</Label>
                <Input
                  id="wbcCount"
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  placeholder="e.g., 7.5"
                  className="border-emerald-900/20 focus:ring-emerald-500"
                  {...register("wbcCount", { valueAsNumber: true })}
                />
                {errors.wbcCount && (
                  <p className="text-red-500 text-sm">{errors.wbcCount.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Medical History */}
        {currentStep === 6 && (
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
                {...register("allergies")}
              />
              {errors.allergies && (
                <p className="text-red-500 text-sm">{errors.allergies.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                rows={2}
                placeholder="List all Medications you are Currently Taking"
                className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                {...register("currentMedications")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentConditions">Current Medical Conditions</Label>
              <Textarea
                id="currentConditions"
                rows={2}
                placeholder="List any Ongoing Medical Conditions (e.g., Diabetes, Hypertension)"
                className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                {...register("currentConditions")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surgery">Previous Surgeries</Label>
              <Textarea
                id="surgery"
                rows={2}
                placeholder="List any Surgeries you've had"
                className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                {...register("surgery")}
              />
              {errors.surgery && (
                <p className="text-red-500 text-sm">{errors.surgery.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfusion">Blood Transfusions</Label>
              <Textarea
                id="transfusion"
                rows={2}
                placeholder="Details of any Blood Transfusions"
                className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                {...register("transfusion")}
              />
              {errors.transfusion && (
                <p className="text-red-500 text-sm">{errors.transfusion.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accident">Major Accidents</Label>
              <Textarea
                id="accident"
                rows={2}
                placeholder="Details of any Major Accidents or Injuries"
                className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                {...register("accident")}
              />
              {errors.accident && (
                <p className="text-red-500 text-sm">{errors.accident.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_history">Other Medical History</Label>
              <Textarea
                id="medical_history"
                rows={3}
                placeholder="Any Other Relevant Medical History or Notes"
                className="bg-background border border-emerald-900/20 text-sm focus:ring-emerald-500"
                {...register("medical_history")}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4 flex items-center justify-between border-t border-emerald-900/20">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="border-emerald-900/30 hover:bg-emerald-500/10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < PROFILE_STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
              onClick={handleSubmit(onSubmit)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Update Profile
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
