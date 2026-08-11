export type BracketMatchSkeleton = {
  roundNumber: number;
  slotInRound: number;
  roomPlayer1Id: string | null;
  roomPlayer2Id: string | null;
};

// Smallest power of 2 that fits playerCount — non-power-of-2 fields (e.g. 5
// players) pad up to this with byes rather than needing an exact count.
export function totalRounds(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

// Builds the full single-elimination match tree for a room: round 1 is
// seeded from orderedRoomPlayerIds (in order), every later round is an
// empty skeleton filled in as matches resolve (see nextSlot).
//
// When playerCount isn't a power of 2, the shortfall becomes byes: the
// last `byes` round-1 slots each get a single player (no opponent) instead
// of a real pairing — those players skip round 1 and advance straight to
// round 2 (see resolveByeMatches in actions.ts, which auto-confirms them
// right after this skeleton is inserted).
export function generateBracketSkeleton(
  orderedRoomPlayerIds: string[]
): BracketMatchSkeleton[] {
  const playerCount = orderedRoomPlayerIds.length;
  if (playerCount < 2) {
    throw new Error("Need at least 2 players.");
  }

  const rounds = totalRounds(playerCount);
  const nextPow2 = 2 ** rounds;
  const pairs = nextPow2 / 2;
  const byes = nextPow2 - playerCount;
  const fullPairs = pairs - byes;

  const matches: BracketMatchSkeleton[] = [];

  let idx = 0;
  for (let slot = 0; slot < pairs; slot++) {
    if (slot < fullPairs) {
      matches.push({
        roundNumber: 1,
        slotInRound: slot,
        roomPlayer1Id: orderedRoomPlayerIds[idx++],
        roomPlayer2Id: orderedRoomPlayerIds[idx++],
      });
    } else {
      matches.push({
        roundNumber: 1,
        slotInRound: slot,
        roomPlayer1Id: orderedRoomPlayerIds[idx++],
        roomPlayer2Id: null,
      });
    }
  }

  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = nextPow2 / Math.pow(2, round);
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
