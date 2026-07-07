import { MessageCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-6rem)] w-full mx-auto relative bg-background">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-64 transition-all duration-300 bg-card border-r border-emerald-600/30 flex-col h-full">
        <div className="p-3 border-b border-emerald-900/20">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="flex-1 p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>

      {/* Main Chat Area Skeleton */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center px-4 py-2.5 border-b border-emerald-900/20 justify-between bg-card">
          <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          <div className="flex justify-start">
            <div className="bg-card border border-emerald-900/20 rounded-lg p-3 w-3/4">
              <div className="flex items-center space-x-2 mb-2">
                <MessageCircle className="h-5 w-5 text-emerald-400 animate-pulse" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted animate-pulse rounded"></div>
                <div className="h-3 w-5/6 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-emerald-900/20 bg-card">
          <div className="h-10 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  );
}
