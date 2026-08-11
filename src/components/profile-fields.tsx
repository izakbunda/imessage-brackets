"use client";

import { useEffect, useState } from "react";
import { getProfile, saveProfile } from "@/lib/remembered-profile";

// Remembers name/phone on this device (no accounts, so this is just
// convenience — not identity). Once a profile is known, collapses down to
// a "continue as X" row instead of making returning players retype it.
export function ProfileFields() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [knownProfile, setKnownProfile] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setKnownProfile(true);
    } else {
      setEditing(true);
    }
  }, []);

  if (knownProfile && !editing) {
    return (
      <div className="tactile-card px-3 py-2.5 flex items-center justify-between gap-2 text-sm">
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="phoneNumber" value={phone} />
        <span>
          Continue as <strong>{name}</strong>
          <span className="muted"> — {phone}</span>
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="muted text-sm underline shrink-0"
        >
          Not you?
        </button>
      </div>
    );
  }

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
          placeholder="e.g. Jordan"
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
