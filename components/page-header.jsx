import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";

export function PageHeader({
  icon,
  title,
  backLink = "/",
  backLabel = "Back to Home",
}) {
  return (
    <div className="flex flex-col justify-between gap-6 mb-8">
      {/* Back Button */}
      <Link href={backLink} className="self-start">
        <Button
          variant="outline"
          size="sm"
          className="mb-2 sm:mb-0 border-emerald-900/30 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {backLabel}
        </Button>
      </Link>

      {/* Title and Icon */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        {icon && (
          <div className="text-emerald-400 shrink-0">
            {React.cloneElement(icon, {
              className: "h-8 w-8 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0",
            })}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold gradient-title wrap-break-word">
          {title}
        </h1>
      </div>
    </div>
  );
}
