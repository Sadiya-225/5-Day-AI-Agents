"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import type { UrgencyLevel } from "@/lib/schemas/video-triage";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLabel?: boolean;
  pulse?: boolean;
  className?: string;
}

const urgencyConfig: Record<
  UrgencyLevel,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: typeof AlertTriangle;
  }
> = {
  low: {
    label: "Low",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-300",
    borderClass: "border-green-300 dark:border-green-700",
    icon: CheckCircle,
  },
  medium: {
    label: "Medium",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
    textClass: "text-yellow-700 dark:text-yellow-300",
    borderClass: "border-yellow-300 dark:border-yellow-700",
    icon: AlertCircle,
  },
  high: {
    label: "Urgent",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    textClass: "text-red-700 dark:text-red-300",
    borderClass: "border-red-300 dark:border-red-700",
    icon: AlertTriangle,
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-0.5 text-xs gap-1",
    icon: "h-3 w-3",
  },
  md: {
    container: "px-2.5 py-1 text-sm gap-1.5",
    icon: "h-4 w-4",
  },
  lg: {
    container: "px-3 py-1.5 text-base gap-2",
    icon: "h-5 w-5",
  },
};

export function UrgencyBadge({
  urgency,
  size = "md",
  showIcon = true,
  showLabel = true,
  pulse = false,
  className,
}: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizes.container,
        pulse && urgency === "high" && "animate-pulse",
        className
      )}
    >
      {showIcon && <Icon className={sizes.icon} />}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

// Large prominent urgency indicator for session overview
export function UrgencyIndicator({
  urgency,
  className,
}: {
  urgency: UrgencyLevel;
  className?: string;
}) {
  const config = urgencyConfig[urgency];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 p-4",
        config.bgClass,
        config.borderClass,
        urgency === "high" && "animate-pulse",
        className
      )}
    >
      <Icon className={cn("h-8 w-8", config.textClass)} />
      <span className={cn("text-lg font-semibold", config.textClass)}>
        {config.label} Priority
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {urgency === "low" && "Patient appears stable"}
        {urgency === "medium" && "Monitor patient closely"}
        {urgency === "high" && "Immediate attention may be needed"}
      </span>
    </div>
  );
}

export default UrgencyBadge;
