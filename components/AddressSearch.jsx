"use client";
import { MapPin, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export default function AddressSearch({ onSelectAddress, placeholder = "Search Address" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (value) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://us1.locationiq.com/v1/search?key=${
          process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY
        }&q=${encodeURIComponent(value)}&format=json&limit=5`
      );
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("LocationIQ Error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.display_name);
    setResults([]);
    onSelectAddress({
      address: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      boundingBox: item.boundingbox,
    });
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex w-full rounded-xl border border-emerald-900/30 bg-background overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/40">
        <div className="bg-emerald-500/10 px-3 flex items-center justify-center">
          <MapPin className="h-4 w-4 text-emerald-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="px-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-background border border-emerald-900/20 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((item, index) => (
            <li
              key={index}
              className="px-4 py-2.5 text-sm text-foreground hover:bg-emerald-500/5 hover:text-emerald-400 cursor-pointer transition-colors border-b border-emerald-900/10 last:border-0"
              onClick={() => handleSelect(item)}
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}

      {isLoading && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
