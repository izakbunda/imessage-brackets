"use client";

import { useEffect, useState } from "react";
import { getProfile, saveProfile } from "@/lib/remembered-profile";

// Remembers name/phone on this device (no accounts, so this is just
// convenience — not identity) so returning players don't retype it every
// time they start or join a bracket.
export function ProfileFields() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
    }
  }, []);

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your name</span>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            saveProfile({ name: e.target.value, phone });
          }}
          className="tactile-input px-3 py-2.5"
          placeholder="Izak"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your phone number</span>
        <input
          name="phoneNumber"
          required
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            saveProfile({ name, phone: e.target.value });
          }}
          className="tactile-input px-3 py-2.5"
          placeholder="(555) 123-4567"
        />
      </label>
    </>
  );
}
