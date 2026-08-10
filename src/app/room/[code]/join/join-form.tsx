"use client";

import { useActionState } from "react";
import { joinRoom, type JoinState } from "./actions";
import { PwaGate } from "@/components/pwa-gate";

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
          <input name="name" required className="border rounded-md px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your phone number</span>
          <input
            name="phoneNumber"
            required
            type="tel"
            className="border rounded-md px-3 py-2"
            placeholder="(555) 123-4567"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Photo (optional)</span>
          <input name="photo" type="file" accept="image/*" className="text-sm" />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
        >
          {pending ? "Joining…" : "Join room"}
        </button>
      </form>
    </PwaGate>
  );
}
