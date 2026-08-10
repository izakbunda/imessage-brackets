"use client";

import { useActionState } from "react";
import { joinRoom, type JoinState } from "./actions";
import { TactileButton } from "@/components/tactile-button";
import { ProfileFields } from "@/components/profile-fields";

const initialState: JoinState = {};

export function JoinForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState(
    joinRoom.bind(null, code),
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ProfileFields />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Photo (optional)</span>
        <input name="photo" type="file" accept="image/*" className="text-sm" />
      </label>

      {state.error && <p className="text-sm error-text">{state.error}</p>}

      <TactileButton type="submit" disabled={pending} className="mt-2">
        {pending ? "Joining…" : "Join room"}
      </TactileButton>
    </form>
  );
}
