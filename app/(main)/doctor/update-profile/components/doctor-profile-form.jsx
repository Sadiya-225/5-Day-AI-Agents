"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, ExternalLink } from "lucide-react";
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
import { doctorProfileUpdateSchema } from "@/lib/schema";
import { SPECIALITIES } from "@/lib/specialities";
import useFetch from "@/hooks/use-fetch";
import { updateDoctorProfile } from "@/actions/doctor";
import { toast } from "sonner";

export function DoctorProfileForm({ user }) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    loading,
    data,
    fn: submitProfileUpdate,
  } = useFetch(updateDoctorProfile);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(doctorProfileUpdateSchema),
    mode: "onTouched",
    defaultValues: {
      specialty: user?.specialty || "",
      experience: user?.experience || undefined,
      description: user?.description || "",
    },
  });

  const specialtyValue = watch("specialty");

  useEffect(() => {
    if (data?.success) {
      toast.success("Profile Updated Successfully!");
      router.refresh();
    }
  }, [data, router]);

  const onSubmit = async (data) => {
    if (loading) return;

    setError("");

    const formData = new FormData();
    formData.append("specialty", data.specialty);
    formData.append("experience", data.experience.toString());
    formData.append("description", data.description);

    await submitProfileUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4 mb-6">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="specialty">Medical Specialty</Label>
        <Select
          value={specialtyValue}
          onValueChange={(value) => setValue("specialty", value, { shouldValidate: true })}
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
        {errors.specialty && (
          <p className="text-red-500 text-sm mt-1">
            {errors.specialty.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Years of Experience</Label>
        <Input
          id="experience"
          type="number"
          min="1"
          max="70"
          className="text-sm border-emerald-900/20 focus:ring-emerald-500"
          {...register("experience", { valueAsNumber: true })}
        />
        {errors.experience && (
          <p className="text-red-500 text-sm mt-1">
            {errors.experience.message}
          </p>
        )}
      </div>

      {/* Credential URL - Read Only */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="credentialUrl">Credential Document</Label>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            <Lock className="h-3 w-3" />
            <span>Cannot be Changed</span>
          </div>
        </div>
        <div className="relative">
          <Input
            id="credentialUrl"
            type="url"
            value={user?.credentialUrl || ""}
            disabled
            className="text-sm bg-muted border-emerald-900/20 pr-10 cursor-not-allowed opacity-75"
          />
          {user?.credentialUrl && (
            <a
              href={user.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description of Your Services</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Describe your Expertise, Services, and Approach to Patient Care..."
          className="text-sm bg-background border border-emerald-900/20 focus:ring-emerald-500"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Profile"
        )}
      </Button>
    </form>
  );
}
