import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-md p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">iMessage Brackets</h1>
      <p className="text-neutral-500">
        Bracket-style tournaments for iMessage games. Create a room to start one, or join with a
        link someone sent you.
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href="/create"
          className="bg-blue-500 text-white rounded-md px-4 py-2 font-medium text-center"
        >
          Create a room
        </Link>
        <Link href="/leaderboard" className="border rounded-md px-4 py-2 font-medium text-center">
          Leaderboard
        </Link>
      </div>
    </main>
  );
}
