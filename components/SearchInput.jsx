"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";

const SearchInput = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicQuery = searchParams.get("topic") || "";
  const [searchQuery, setSearchQuery] = useState(topicQuery);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      let newUrl;

      if (searchQuery.trim()) {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: "topic",
          value: searchQuery.trim(),
        });
      } else {
        newUrl = removeKeysFromUrlQuery({
          params: searchParams.toString(),
          keysToRemove: ["topic"],
        });
      }

      router.push(newUrl, { scroll: false });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, router, searchParams]);

  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-black px-4 py-2 dark:border-white">
      <Image
        src="/icons/search.svg"
        alt="search"
        width={15}
        height={15}
        className="dark:invert"
      />
      <input
        placeholder="Search Companions..."
        className="w-40 text-sm text-black outline-none placeholder:text-gray-500 dark:text-foreground dark:placeholder:text-gray-400"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
