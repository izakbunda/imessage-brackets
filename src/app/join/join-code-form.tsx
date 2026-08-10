"use client";

import { useActionState } from "react";
import { findRoomByCode, type JoinLookupState } from "./actions";
import { TactileButton } from "@/components/tactile-button";

const initialState: JoinLookupState = {};

export function JoinCodeForm() {
  const [state, formAction, pending] = useActionState(findRoomByCode, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="code"
        required
        placeholder="e.g. swift-tiger-44"
        className="tactile-input px-3 py-2.5"
        autoCapitalize="off"
        autoCorrect="off"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <TactileButton type="submit" disabled={pending}>
        {pending ? "Looking up…" : "Join room"}
      </TactileButton>
    </form>
  );
}
