"use client";

import { useActionState } from "react";
import { findRoomByCode, type JoinLookupState } from "./actions";

const initialState: JoinLookupState = {};

export function JoinCodeForm() {
  const [state, formAction, pending] = useActionState(findRoomByCode, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="code"
        required
        placeholder="e.g. swift-tiger-44"
        className="border rounded-md px-3 py-2"
        autoCapitalize="off"
        autoCorrect="off"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium disabled:opacity-50"
      >
        {pending ? "Looking up…" : "Join room"}
      </button>
    </form>
  );
}
