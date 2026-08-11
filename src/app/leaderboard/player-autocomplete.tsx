"use client";

import { useEffect, useRef, useState } from "react";
import { searchPlayers } from "./head-to-head-actions";

export function PlayerAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<{ name: string; phone: string }[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlayers(value);
      setSuggestions(results);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="tactile-input px-3 py-2.5 w-full"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul
          className="absolute inset-x-0 top-full mt-1 z-10 overflow-hidden"
          style={{
            background: "var(--card)",
            border: "var(--pixel-border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          {suggestions.map((s) => (
            <li key={s.phone}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s.phone);
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm flex justify-between gap-2"
              >
                <span>{s.name}</span>
                <span className="muted">{s.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
