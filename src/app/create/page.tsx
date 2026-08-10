import { createRoom } from "./actions";
import { GAMES } from "@/lib/games";
import { TactileButton } from "@/components/tactile-button";
import { ProfileFields } from "@/components/profile-fields";

const PLAYER_COUNT_OPTIONS = [2, 4, 8, 16, 32];

export default function CreateRoomPage() {
  return (
    <main className="w-full mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-6">Create a bracket</h1>
      <form action={createRoom} className="flex flex-col gap-4">
        <ProfileFields />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Game</span>
          <select name="game" required className="tactile-input px-3 py-2.5">
            {GAMES.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Number of players</span>
          <select name="playerCount" required defaultValue={4} className="tactile-input px-3 py-2.5">
            {PLAYER_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium mb-1">Seeding</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="seedingMode" value="auto" defaultChecked />
            Automatic (random)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="seedingMode" value="manual" />
            Manual (I&apos;ll set it myself)
          </label>
        </fieldset>

        <TactileButton type="submit" className="mt-2">
          Create room
        </TactileButton>
      </form>
    </main>
  );
}
