"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SlotPicker({ days, onSelectSlot }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const timeZone = "Asia/Kolkata";

  const firstDayWithSlots =
    days.find((day) => day.slots.length > 0)?.date || days[0]?.date;
  const [activeTab, setActiveTab] = useState(firstDayWithSlots);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const confirmSelection = () => {
    if (selectedSlot) {
      onSelectSlot(selectedSlot);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="w-full overflow-x-auto scrollbar-hide">
          <TabsList className="flex gap-2 whitespace-nowrap min-w-max p-1 h-16">
            {days.map((day) => (
              <TabsTrigger
                key={day.date}
                value={day.date}
                disabled={day.slots.length === 0}
                className={`flex-shrink-0 min-w-[100px] px-3 py-2 rounded text-center ${
                  day.slots.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:gap-2 items-center">
                  <div className="text-xs sm:text-[15px]">
                    {format(new Date(day.date), "MMM d")}
                  </div>
                  <div className="text-xs sm:text-[15px]">
                    ({format(new Date(day.date), "EEE")})
                  </div>
                </div>
                {day.slots.length > 0 && (
                  <div className="bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1 rounded">
                    {day.slots.length}
                  </div>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {days.map((day) => (
          <TabsContent key={day.date} value={day.date} className="pt-4">
            {day.slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No Available Slots For This Day.
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {day.displayDate}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {day.slots.map((slot) => {
                    const localStart = toZonedTime(slot.startTime, timeZone);

                    return (
                      <Card
                        key={slot.startTime}
                        className={`border-emerald-900/20 cursor-pointer transition-all ${
                          selectedSlot?.startTime === slot.startTime
                            ? "bg-emerald-500/10 dark:bg-emerald-900/30 border-emerald-500/50 dark:border-emerald-600"
                            : "hover:border-emerald-700/40"
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <CardContent className="p-3 flex items-center justify-center">
                          <Clock
                            className={`h-4 w-4 mr-2 ${
                              selectedSlot?.startTime === slot.startTime
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={
                              selectedSlot?.startTime === slot.startTime
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {format(localStart, "h:mm a")}{" "}
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={confirmSelection}
          disabled={!selectedSlot}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
