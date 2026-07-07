import { Bot } from "lucide-react";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Bot className="h-12 w-12 text-emerald-400 mx-auto animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-48 bg-muted animate-pulse rounded mx-auto"></div>
          <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
