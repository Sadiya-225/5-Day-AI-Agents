"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CreditCard,
  Loader2,
  AlertCircle,
  Coins,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { requestPayout } from "@/actions/payout";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function DoctorEarnings({ earnings, payouts = [] }) {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");

  const {
    thisMonthEarnings = 0,
    completedAppointments = 0,
    averageEarningsPerMonth = 0,
    availableCredits = 0,
    availablePayout = 0,
  } = earnings;

  const { loading, data, fn: submitPayoutRequest } = useFetch(requestPayout);

  const pendingPayout = payouts.find(
    (payout) => payout.status === "PROCESSING"
  );

  const handlePayoutRequest = async (e) => {
    e.preventDefault();

    if (!paypalEmail) {
      toast.error("PayPal Email is Required");
      return;
    }

    const formData = new FormData();
    formData.append("paypalEmail", paypalEmail);

    await submitPayoutRequest(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowPayoutDialog(false);
      setPaypalEmail("");
      toast.success("Payout Request Submitted Successfully!");
    }
  }, [data]);

  const platformFee = availableCredits * 0.1; // Rs. 0.1 Per Credit

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Available Credits
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {availableCredits}
                </p>
                <p className="text-xs text-muted-foreground">
                  ₹{availablePayout.toFixed(2)} Available for Payout
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <Coins className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold text-foreground">
                  ₹{thisMonthEarnings.toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Appointments
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {completedAppointments}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg/Month</p>
                <p className="text-3xl font-bold text-foreground">
                  ₹{averageEarningsPerMonth.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  From the Start of {new Date().getFullYear()}
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Section */}
      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-emerald-400" />
            Payout Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className={"-mt-3.75"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Payout Structure:</strong> You Earn ₹1.00 Per Credit.
              Platform Fee is ₹0.10 Per Credit. Payouts Include All Your
              Available Credits and are Processed via PayPal.
            </AlertDescription>
          </Alert>
          <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-foreground">
                Available for Payout
              </h3>
              {pendingPayout ? (
                <Badge
                  variant="outline"
                  className="bg-amber-900/20 border-amber-900/30 text-amber-400"
                >
                  Processing
                </Badge>
              ) : availableCredits === 0 ? (
                <Badge
                  variant="outline"
                  className="bg-gray-800/30 border-gray-700/30 text-gray-400"
                >
                  No Credits
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 border-emerald-900/30 text-emerald-400 text-[13px]"
                >
                  Available
                </Badge>
              )}
            </div>

            {pendingPayout ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Credits</p>
                    <p className="text-foreground font-medium">
                      {pendingPayout.credits}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pending Amount</p>
                    <p className="text-foreground font-medium">
                      ₹{pendingPayout.netAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PayPal Email</p>
                    <p className="text-foreground font-medium">
                      {pendingPayout.paypalEmail}
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your Payout Request is Being Processed. You'll Receive the
                    Payment Once an Admin Approves it. Your Credits will be
                    Deducted After Processing.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Available Credits</p>
                  <p className="text-foreground font-medium">
                    {availableCredits}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payout Amount</p>
                  <p className="text-foreground font-medium">
                    ₹{availablePayout.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Platform Fee</p>
                  <p className="text-foreground font-medium">
                    ₹{platformFee.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {!pendingPayout && availableCredits > 0 && (
              <Button
                onClick={() => setShowPayoutDialog(true)}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                Request Payout for All Credits
              </Button>
            )}

            {availableCredits === 0 && !pendingPayout && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No Credits Available for Payout. Complete More Appointments to
                  Earn Credits.
                </p>
              </div>
            )}
          </div>
          {/* Payout History */}
          {payouts.length > 0 && (
            <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 w-full">
              <div className="mb-3">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Payout History
                </h3>
                <div className="flex flex-col space-y-2">
                  {payouts.slice(0, 5).map((payout) => (
                    <div
                      key={payout.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md bg-muted/10 border border-emerald-900/10 w-full"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <p className="text-foreground font-medium text-sm">
                          {format(new Date(payout.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payout.credits} Credits • ₹
                          {payout.netAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payout.paypalEmail}
                        </p>
                      </div>

                      <div className="mt-2 sm:mt-0 sm:ml-4 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            payout.status === "PROCESSED"
                              ? "bg-emerald-500/10 border-emerald-900/30 text-emerald-400"
                              : "bg-amber-900/20 border-amber-900/30 text-amber-400"
                          }
                        >
                          {payout.status.charAt(0) +
                            payout.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Request Payout
            </DialogTitle>
            <DialogDescription>
              Request Payout for All Your Available Credits
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="bg-muted/20 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Available Credits:
                </span>
                <span className="text-foreground">{availableCredits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Amount:</span>
                <span className="text-foreground">
                  ₹{(availableCredits * 1).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Platform Fee (10%):
                </span>
                <span className="text-foreground">
                  -₹{platformFee.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-emerald-900/20 pt-2 flex justify-between font-medium">
                <span className="text-foreground">Net Payout:</span>
                <span className="text-emerald-400">
                  ₹{availablePayout.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your-email@paypal.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="bg-background border-emerald-900/20 text-sm"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the PayPal Email Where You Want to Receive the Payout.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Once Processed by Admin, {availableCredits} Credits Will be
                Deducted from Your Account and ₹{availablePayout.toFixed(2)}{" "}
                Will be Sent to Your PayPal.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayoutDialog(false)}
                disabled={loading}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Request Payout"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
