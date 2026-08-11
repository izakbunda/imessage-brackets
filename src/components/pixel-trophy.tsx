const PX = 8;

// 15x16 pixel-art trophy: R = cup rim/body, H = handle, S = stem, B = base.
const TROPHY_GRID = [
  "...RRRRRRRRR...",
  "..RRRRRRRRRRR..",
  ".RRRRRRRRRRRRR.",
  "HRRRRRRRRRRRRRH",
  "HRRRRRRRRRRRRRH",
  ".HRRRRRRRRRRRH.",
  "..RRRRRRRRRRR..",
  "...RRRRRRRRR...",
  ".....RRRRR.....",
  "......SSS......",
  "......SSS......",
  ".....BBBBB.....",
  "....BBBBBBB....",
  "....BBBBBBB....",
  "...BBBBBBBBB...",
  "...BBBBBBBBB...",
];

export function PixelTrophy({ variant }: { variant: "champion" | "runnerup" }) {
  const gold = variant === "champion";
  const colors: Record<string, string> = gold
    ? { R: "#e0b84a", H: "#b8791f", S: "#b8791f", B: "#8a5a16" }
    : { R: "#8b8794", H: "#5c5865", S: "#5c5865", B: "#46424f" };
  const highlightRows = new Set([0, 1]);

  return (
    <svg
      width={TROPHY_GRID[0].length * PX}
      height={TROPHY_GRID.length * PX}
      viewBox={`0 0 ${TROPHY_GRID[0].length * PX} ${TROPHY_GRID.length * PX}`}
      style={{ imageRendering: "pixelated" }}
    >
      {TROPHY_GRID.map((row, y) =>
        [...row].map((cell, x) => {
          if (cell === ".") return null;
          const fill = highlightRows.has(y) && cell === "R" ? lighten(colors.R) : colors[cell];
          return (
            <rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX} height={PX} fill={fill} />
          );
        })
      )}
    </svg>
  );
}

function lighten(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 45);
  const g = Math.min(255, ((n >> 8) & 255) + 45);
  const b = Math.min(255, (n & 255) + 45);
  return `rgb(${r},${g},${b})`;
}
