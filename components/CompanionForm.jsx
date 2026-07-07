"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SPECIALITIES } from "@/lib/specialities";
import { createCompanion } from "@/actions/companion.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(1, { message: "AI Doctor Name is Required." }),
  subject: z
    .string()
    .min(1, { message: "Medical Specialization is Required." }),
  topic: z.string().min(1, { message: "Symptoms is Required." }),
  voice: z.string().min(1, { message: "Voice is Required." }),
  style: z.string().min(1, { message: "Style is Required." }),
  duration: z.coerce.number().min(1, { message: "Duration is Required." }),
});

const CompanionForm = ({ userId }) => {
  const router = useRouter();
  const [userCredits, setUserCredits] = useState(0);
  const [showCreditDialog, setShowCreditDialog] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      topic: "",
      voice: "",
      style: "",
      duration: 15,
    },
  });

  useEffect(() => {
    if (userId) {
      fetchUserCredits();
    }
  }, [userId]);

  async function fetchUserCredits() {
    try {
      const response = await fetch("/api/user/credits");
      const data = await response.json();
      if (data.credits !== undefined) {
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error("Error Fetching User Credits:", error);
    }
  }

  const onSubmit = async (values) => {
    if (userCredits < 500) {
      setShowCreditDialog(true);
      return;
    }

    try {
      const creditResponse = await fetch("/api/chat/deduct-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 500 }),
      });

      const creditData = await creditResponse.json();

      if (!creditData.success) {
        console.error("Failed to Deduct Credits:", creditData.error);
        setShowCreditDialog(true);
        return;
      }

      const companion = await createCompanion({ ...values }, "");

      if (companion) {
        fetchUserCredits();
        router.push(`/companion/${companion.id}`);
      } else {
        console.error("Failed to Create Companion");
        router.push("/companion");
      }
    } catch (err) {
      console.error("Error Submitting Form:", err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Card className="mt-2 mb-4 w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="mt-2 text-center text-3xl font-bold">
            Create Your AI Medical Companion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary -mt-2.5 flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-4 rounded-lg p-4">
            {/* Info Icon + Text */}
            <div className="flex items-start sm:items-center gap-3 flex-1">
              <InfoIcon className="h-5 w-5 shrink-0 text-emerald-500 sm:h-6 sm:w-6" />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Build your Own AI-Powered Healthcare Assistant. Customize its
                Specialization, Tone, and Approach to Provide Medical Guidance,
                Symptom Checking, or Patient Education - All with Empathy and
                Precision.
              </p>
            </div>

            {/* Credits Badge */}
            <div className="flex items-center self-end sm:self-auto gap-2 bg-emerald-500/10 border border-emerald-700/30 text-emerald-400 rounded-full px-3 py-1 shadow-sm transition-all hover:scale-[1.03]">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium whitespace-nowrap">
                {userCredits ?? 0} Credits
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full max-w-3xl">
        <Card>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md font-medium">
                        AI Doctor Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Dr. Heal, MedAssist, CareMate, etc."
                          {...field}
                          className="focus:border-primary focus:ring-primary/20 h-12 rounded-lg border-2 bg-white/50 px-4 text-sm placeholder:text-sm focus:ring-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md font-medium">
                        Medical Specialization
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="focus:border-emerald-500 focus:ring-emerald-200 h-12 w-full rounded-lg border-2 bg-white/50 px-4 text-sm focus:ring-2">
                            <SelectValue placeholder="Select Medical Specialization" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECIALITIES.map((spec) => (
                              <SelectItem key={spec.name} value={spec.name}>
                                <div className="flex items-center gap-2">
                                  {spec.icon}
                                  <span>{spec.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md font-medium">
                        Patient Problem / Symptoms
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Chest Pain, Persistent Cough, Skin Rash, Anxiety, etc."
                          {...field}
                          className="focus:border-emerald-500 focus:ring-emerald-200 min-h-20 rounded-lg border-2 bg-white/50 px-4 py-3 text-sm placeholder:text-sm focus:ring-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md font-medium">
                        Voice Preference
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="focus:border-primary focus:ring-primary/20 h-12 w-full rounded-lg border-2 bg-white/50 px-4 text-sm focus:ring-2">
                            <SelectValue placeholder="Select Voice Tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md font-medium">
                        Consultation Style
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="focus:border-primary focus:ring-primary/20 h-12 w-full rounded-lg border-2 bg-white/50 px-4 text-sm focus:ring-2">
                            <SelectValue placeholder="Select Consultation Style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="empathetic">
                              Empathetic
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md font-medium">
                        Estimated Consultation Duration (Minutes)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15"
                          {...field}
                          className="focus:border-primary focus:ring-primary/20 h-12 rounded-lg border-2 bg-white/50 px-4 text-sm placeholder:text-sm focus:ring-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 mt-2 h-10 w-full font-medium transition-colors hover:cursor-pointer"
                >
                  Create Medical AI Companion
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="bg-black border border-emerald-900/20 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl">Insufficient Credits</DialogTitle>
            <DialogDescription className="text-gray-300">
              You Need 500 Credits to Create an AI Medical Companion. Please
              Purchase More Credits to Continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-500 mb-2">
                500
              </div>
              <div className="text-sm text-gray-400">Credits Required</div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-emerald-600 hover:bg-emerald-700 w-full"
            >
              Purchase Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanionForm;
