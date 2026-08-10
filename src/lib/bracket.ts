export type BracketMatchSkeleton = {
  roundNumber: number;
  slotInRound: number;
  roomPlayer1Id: string | null;
  roomPlayer2Id: string | null;
};

export function totalRounds(playerCount: number): number {
  return Math.log2(playerCount);
}

function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0;
}

// Builds the full single-elimination match tree for a room: round 1 is
// seeded from orderedRoomPlayerIds (slot i = seeds 2i vs 2i+1), every later
// round is an empty skeleton filled in as matches resolve (see nextSlot).
export function generateBracketSkeleton(
  orderedRoomPlayerIds: string[]
): BracketMatchSkeleton[] {
  const playerCount = orderedRoomPlayerIds.length;
  if (!isPowerOfTwo(playerCount)) {
    throw new Error("player count must be a power of 2, at least 2");
  }

  const rounds = totalRounds(playerCount);
  const matches: BracketMatchSkeleton[] = [];

  const round1Matches = playerCount / 2;
  for (let slot = 0; slot < round1Matches; slot++) {
    matches.push({
      roundNumber: 1,
      slotInRound: slot,
      roomPlayer1Id: orderedRoomPlayerIds[slot * 2],
      roomPlayer2Id: orderedRoomPlayerIds[slot * 2 + 1],
    });
  }

  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = playerCount / Math.pow(2, round);
    for (let slot = 0; slot < matchesInRound; slot++) {
      matches.push({
        roundNumber: round,
        slotInRound: slot,
        roomPlayer1Id: null,
        roomPlayer2Id: null,
      });
    }
  }

  return matches;
}

// Per schema.md: winner of round r slot s feeds into round r+1 slot
// floor(s/2), as player 1 if s is even, player 2 if s is odd.
export function nextSlot(slotInRound: number): {
  nextSlotInRound: number;
  isPlayer1: boolean;
} {
  return {
    nextSlotInRound: Math.floor(slotInRound / 2),
    isPlayer1: slotInRound % 2 === 0,
  };
}
