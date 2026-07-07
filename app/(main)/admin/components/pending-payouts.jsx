"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  User,
  Mail,
  Stethoscope,
  Loader2,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { approvePayout } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

export function PendingPayouts({ payouts }) {
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { loading, data, fn: submitApproval } = useFetch(approvePayout);

  const handleViewDetails = (payout) => {
    setSelectedPayout(payout);
  };

  const handleApprovePayout = (payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedPayout || loading) return;

    const formData = new FormData();
    formData.append("payoutId", selectedPayout.id);

    await submitApproval(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowApproveDialog(false);
      setSelectedPayout(null);
      toast.success("Payout Approved Successfully!");
    }
  }, [data]);

  const closeDialogs = () => {
    setSelectedPayout(null);
    setShowApproveDialog(false);
  };

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Pending Payouts
          </CardTitle>
          <CardDescription>
            Review and Approve Doctor Payout Requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No Pending Payout Requests At this Time.
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted/20 rounded-full p-2 mt-1">
                          <User className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            Dr. {payout.doctor.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {payout.doctor.specialty}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <span>
                                {payout.credits} Credits • ₹
                                {payout.netAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-emerald-400" />
                              {payout.paypalEmail}
                            </div>
                          </div>
                          <p className="text-muted-foreground mt-2 text-sm">
                            Requested{" "}
                            {format(
                              new Date(payout.createdAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 self-end lg:self-center">
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 dark:bg-amber-900/20 border-amber-500/30 text-amber-600 dark:text-amber-400 text-[13px]"
                        >
                          Pending
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payout)}
                            className="border-emerald-900/30 hover:bg-muted/80"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprovePayout(payout)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Details Dialog */}
      {selectedPayout && !showApproveDialog && (
        <Dialog open={!!selectedPayout} onOpenChange={closeDialogs}>
          <DialogContent className="w-[90vw]! max-w-4xl! max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Payout Request Details
              </DialogTitle>
              <DialogDescription>
                Review the Payout Request Information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Doctor Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-foreground font-medium">
                    Doctor Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-foreground">
                      Dr. {selectedPayout.doctor.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-foreground">
                      {selectedPayout.doctor.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Specialty
                    </p>
                    <p className="text-foreground">
                      {selectedPayout.doctor.specialty}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Current Credits
                    </p>
                    <p className="text-foreground">
                      {selectedPayout.doctor.credits}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-foreground font-medium">
                    Payout Details
                  </h3>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Credits to Pay Out:
                    </span>
                    <span className="text-foreground font-medium">
                      {selectedPayout.credits}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gross Amount (Rs. 1 Per Credit):
                    </span>
                    <span className="text-foreground">
                      ₹{selectedPayout.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Platform Fee (Rs. 0.1 Per Credit):
                    </span>
                    <span className="text-foreground">
                      -₹{selectedPayout.platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-emerald-900/20 pt-3 flex justify-between font-medium">
                    <span className="text-foreground">Net Payout:</span>
                    <span className="text-emerald-400">
                      ₹{selectedPayout.netAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-emerald-900/20 pt-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      PayPal Email
                    </p>
                    <p className="text-foreground">
                      {selectedPayout.paypalEmail}
                    </p>
                  </div>
                </div>
              </div>

              {selectedPayout.doctor.credits < selectedPayout.credits && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Doctor Currently has only{" "}
                    {selectedPayout.doctor.credits} Credits but this Payout
                    Requires {selectedPayout.credits} Credits. The Payout Cannot
                    be Processed.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeDialogs}
                className="border-emerald-900/30"
              >
                Close
              </Button>
              <Button
                onClick={() => handleApprovePayout(selectedPayout)}
                disabled={
                  selectedPayout.doctor.credits < selectedPayout.credits
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Confirmation Dialog */}
      {showApproveDialog && selectedPayout && (
        <Dialog
          open={showApproveDialog}
          onOpenChange={() => setShowApproveDialog(false)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Confirm Payout Approval
              </DialogTitle>
              <DialogDescription>
                Are You Sure You Want To Approve This Payout?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This Action will:
                  <ul className="mt-2 space-y-1 list-disc pl-4">
                    <li>
                      Deduct {selectedPayout.credits} Credits from Dr.{" "}
                      {selectedPayout.doctor.name}'s Account
                    </li>
                    <li>Mark the Payout as PROCESSED</li>
                    <li>This Action Cannot be Undone</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="text-foreground">
                    Dr. {selectedPayout.doctor.name}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount to Pay:</span>
                  <span className="text-emerald-400 font-medium">
                    ${selectedPayout.netAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PayPal:</span>
                  <span className="text-foreground text-sm">
                    {selectedPayout.paypalEmail}
                  </span>
                </div>
              </div>
            </div>

            {loading && <BarLoader width={"100%"} color="#36d7b7" />}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={loading}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Approval
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
