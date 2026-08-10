import { JoinCodeForm } from "./join-code-form";

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Join a bracket</h1>
      <p className="text-neutral-500 mb-6">
        Enter the room code someone gave you.
      </p>
      <JoinCodeForm />
    </main>
  );
}
