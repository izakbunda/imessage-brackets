"use client";

import { useActionState } from "react";
import { joinRoom, type JoinState } from "./actions";
import { PwaGate } from "@/components/pwa-gate";
import { TactileButton } from "@/components/tactile-button";

const initialState: JoinState = {};

export function JoinForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState(
    joinRoom.bind(null, code),
    initialState
  );

  return (
    <PwaGate>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your name</span>
          <input name="name" required className="tactile-input px-3 py-2.5" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your phone number</span>
          <input
            name="phoneNumber"
            required
            type="tel"
            className="tactile-input px-3 py-2.5"
            placeholder="(555) 123-4567"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Photo (optional)</span>
          <input name="photo" type="file" accept="image/*" className="text-sm" />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <TactileButton type="submit" disabled={pending} className="mt-2">
          {pending ? "Joining…" : "Join room"}
        </TactileButton>
      </form>
    </PwaGate>
  );
}
