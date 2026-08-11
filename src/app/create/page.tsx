import { createRoom } from "./actions";
import { GAMES } from "@/lib/games";
import { TactileButton } from "@/components/tactile-button";
import { ProfileFields } from "@/components/profile-fields";
import { RoomSizePicker } from "@/components/room-size-picker";
import { SeedingModePicker } from "@/components/seeding-mode-picker";

export default function CreateRoomPage() {
  return (
    <main className="w-full mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-6">Create a bracket</h1>
      <form action={createRoom} className="flex flex-col gap-4">
        <ProfileFields />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Game</span>
          <select name="game" required defaultValue="Word Hunt" className="tactile-input px-3 py-2.5">
            {GAMES.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </label>

        <RoomSizePicker />

        <SeedingModePicker />

        <TactileButton type="submit" className="mt-2">
          Create room
        </TactileButton>
      </form>
    </main>
  );
}
