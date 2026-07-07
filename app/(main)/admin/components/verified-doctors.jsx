"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Check, Ban, Loader2, User, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateDoctorActiveStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function VerifiedDoctors({ doctors }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [targetDoctor, setTargetDoctor] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [doctorToUpdate, setDoctorToUpdate] = useState(null);
  const [suspendAction, setSuspendAction] = useState(false);

  const {
    loading,
    data,
    fn: submitStatusUpdate,
  } = useFetch(updateDoctorActiveStatus);

  const filteredDoctors = doctors.filter((doctor) => {
    const query = searchTerm.toLowerCase();
    return (
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialty.toLowerCase().includes(query) ||
      doctor.email.toLowerCase().includes(query)
    );
  });

  const handleConfirm = async () => {
    if (!doctorToUpdate) return;

    const formData = new FormData();
    formData.append("doctorId", doctorToUpdate.id);
    formData.append("suspend", suspendAction ? "true" : "false");

    setTargetDoctor(doctorToUpdate);
    setActionType(suspendAction ? "SUSPEND" : "REINSTATE");

    await submitStatusUpdate(formData);

    setDoctorToUpdate(null);
  };

  useEffect(() => {
    if (data?.success && targetDoctor && actionType) {
      const actionVerb = actionType === "SUSPEND" ? "Suspended" : "Reinstated";
      toast.success(`${actionVerb} ${targetDoctor.name} Successfully!`);
      setTargetDoctor(null);
      setActionType(null);
    }
  }, [data]);

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Manage Doctors
              </CardTitle>
              <CardDescription>
                View and Manage All Verified Doctors
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Doctors..."
                className="pl-8 bg-background border-emerald-900/20 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No Doctors Match your Search Criteria."
                : "No Verified Doctors Available."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => {
                const isSuspended = doctor.verificationStatus === "REJECTED";
                return (
                  <Card
                    key={doctor.id}
                    className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted/20 rounded-full p-2">
                            <User className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {doctor.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.specialty} • {doctor.experience} Years
                              Experience
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 break-all">
                              {doctor.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {isSuspended ? (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-red-500/10 dark:bg-red-900/20 border-red-500/30 text-red-600 dark:text-red-400"
                              >
                                Suspended
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDoctorToUpdate(doctor);
                                  setSuspendAction(false);
                                }}
                                disabled={loading}
                                className="border-emerald-900/30 hover:bg-muted/80"
                              >
                                {loading && targetDoctor?.id === doctor.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Reinstate
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 dark:bg-emerald-900/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[13px]"
                              >
                                Active
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDoctorToUpdate(doctor);
                                  setSuspendAction(true);
                                }}
                                disabled={loading}
                                className="border-red-900/30 hover:bg-red-900/10 text-red-400"
                              >
                                {loading && targetDoctor?.id === doctor.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Ban className="h-4 w-4 mr-1" />
                                )}
                                Suspend
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={!!doctorToUpdate}
        onOpenChange={() => setDoctorToUpdate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspendAction ? "Suspend Doctor?" : "Reinstate Doctor?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are You Sure You Want to {suspendAction ? "Suspend" : "Reinstate"}{" "}
              <span className="font-medium text-foreground">
                {doctorToUpdate?.name}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDoctorToUpdate(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={suspendAction ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {suspendAction ? "Suspend" : "Reinstate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
