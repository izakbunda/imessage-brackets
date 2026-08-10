export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 64;
const COLUMN_WIDTH = 240;
const ROW_UNIT = NODE_HEIGHT + 24;

export type NodePosition = { x: number; y: number };

// Builds x/y for every (round, slot) in a single-elimination tree, working
// bottom-up: round 1 nodes are evenly spaced, every later round's node sits
// at the vertical midpoint of the two matches that feed into it — that's
// what makes the bracket connector lines read as a proper tree.
export function computeBracketLayout(
  rounds: number
): { positions: Map<string, NodePosition>; width: number; height: number } {
  const positions = new Map<string, NodePosition>();
  const round1Count = 2 ** (rounds - 1);

  for (let slot = 0; slot < round1Count; slot++) {
    positions.set(`1-${slot}`, { x: 0, y: slot * ROW_UNIT });
  }

  for (let round = 2; round <= rounds; round++) {
    const count = 2 ** (rounds - round);
    for (let slot = 0; slot < count; slot++) {
      const a = positions.get(`${round - 1}-${slot * 2}`)!;
      const b = positions.get(`${round - 1}-${slot * 2 + 1}`)!;
      positions.set(`${round}-${slot}`, {
        x: (round - 1) * COLUMN_WIDTH,
        y: (a.y + b.y) / 2,
      });
    }
  }

  const width = (rounds - 1) * COLUMN_WIDTH + NODE_WIDTH;
  const height = round1Count * ROW_UNIT;

  return { positions, width, height };
}

export type ConnectorPath = { d: string; key: string };

// Elbow connectors: two children's right edges run horizontally to a
// midpoint column, join with a vertical segment, then one horizontal run
// into the parent's left edge.
export function computeConnectors(
  rounds: number,
  positions: Map<string, NodePosition>
): ConnectorPath[] {
  const connectors: ConnectorPath[] = [];

  for (let round = 2; round <= rounds; round++) {
    const count = 2 ** (rounds - round);
    for (let slot = 0; slot < count; slot++) {
      const a = positions.get(`${round - 1}-${slot * 2}`)!;
      const b = positions.get(`${round - 1}-${slot * 2 + 1}`)!;
      const parent = positions.get(`${round}-${slot}`)!;

      const childRightX = a.x + NODE_WIDTH;
      const midX = childRightX + (parent.x - childRightX) / 2;
      const aY = a.y + NODE_HEIGHT / 2;
      const bY = b.y + NODE_HEIGHT / 2;
      const parentY = parent.y + NODE_HEIGHT / 2;

      connectors.push({
        key: `${round}-${slot}`,
        d: `M ${childRightX} ${aY} H ${midX} V ${bY} H ${childRightX} M ${midX} ${parentY} H ${parent.x}`,
      });
    }
  }

  return connectors;
}
