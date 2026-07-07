"use client";

import { cn } from "@/lib/utils";
import { UrgencyBadge } from "./UrgencyBadge";
import type { SymptomCard as SymptomCardType } from "@/lib/schemas/video-triage";
import { Activity, Wind, User, Battery, Eye, Clock } from "lucide-react";

interface SymptomCardProps {
  card: SymptomCardType;
  isNew?: boolean;
  className?: string;
}

const categoryConfig: Record<
  SymptomCardType["category"],
  {
    icon: typeof Activity;
    label: string;
    color: string;
  }
> = {
  distress: {
    icon: Activity,
    label: "Distress Level",
    color: "text-red-500",
  },
  breathing: {
    icon: Wind,
    label: "Breathing",
    color: "text-blue-500",
  },
  posture: {
    icon: User,
    label: "Posture",
    color: "text-purple-500",
  },
  fatigue: {
    icon: Battery,
    label: "Fatigue",
    color: "text-orange-500",
  },
  finding: {
    icon: Eye,
    label: "Finding",
    color: "text-emerald-500",
  },
};

export function SymptomCard({
  card,
  isNew = false,
  className,
}: SymptomCardProps) {
  const config = categoryConfig[card.category];
  const Icon = config.icon;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-3 shadow-sm transition-all dark:bg-gray-800",
        "border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700",
              config.color,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {card.value}
            </p>
          </div>
        </div>
        <UrgencyBadge urgency={card.urgency} size="sm" showLabel={false} />
      </div>
      <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
        <Clock className="h-3 w-3" />
        <span>{formatTime(card.timestamp)}</span>
      </div>
    </div>
  );
}

interface SymptomCardsGridProps {
  cards: SymptomCardType[];
  className?: string;
  maxCards?: number;
}

export function SymptomCardsGrid({
  cards,
  className,
  maxCards = 6,
}: SymptomCardsGridProps) {
  const displayCards = cards.slice(0, maxCards);
  const latestTimestamp = cards[0]?.timestamp || 0;

  if (cards.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50",
          className,
        )}
      >
        <Eye className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Visual Analysis Will Appear Here
        </p>
        <p className="mt-1 text-center text-sm text-gray-400 dark:text-gray-500">
          Start the Video Consultation to Begin
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {displayCards.map((card) => (
        <SymptomCard
          key={card.id}
          card={card}
          isNew={card.timestamp === latestTimestamp}
        />
      ))}
      {cards.length > maxCards && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          +{cards.length - maxCards} More Observations
        </p>
      )}
    </div>
  );
}

export default SymptomCard;
