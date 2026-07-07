"use client";

import { useEffect, useState } from "react";
import { getAllCompanions } from "@/actions/companion.actions";
import CompanionCard from "@/components/CompanionCard";
import SearchInput from "@/components/SearchInput";
import Link from "next/link";
import { Plus } from "lucide-react";

const CompanionsLibrary = ({ subject, topic, userId }) => {
  const [companions, setCompanions] = useState([]);

  useEffect(() => {
    const fetchCompanions = async () => {
      if (!userId) return;
      const data = await getAllCompanions({ subject, topic, userId });
      setCompanions(data);
    };

    fetchCompanions();
  }, [subject, topic, userId]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold">Companion Library</h1>
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <SearchInput />
          <Link
            href="/companion/create"
            className="bg-emerald-600 hover:bg-emerald-700 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors shrink-0"
          >
            <Plus className="h-5 w-5 lg:h-4" />
            <span className="ml-2 hidden lg:inline">Build a New Companion</span>
          </Link>
        </div>
      </div>

      {companions.length === 0 ? (
        <div className="text-md text-foreground">
          No Companions Found
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {companions.map((companion) => (
            <CompanionCard key={companion.id} {...companion} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanionsLibrary;
