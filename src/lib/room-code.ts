const ADJECTIVES = [
  "swift",
  "brave",
  "lucky",
  "quiet",
  "bold",
  "sunny",
  "clever",
  "sharp",
  "cool",
  "wild",
  "quick",
  "calm",
];

const NOUNS = [
  "tiger",
  "falcon",
  "otter",
  "comet",
  "maple",
  "cobra",
  "eagle",
  "panda",
  "rocket",
  "shark",
  "wolf",
  "hawk",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRoomCode(): string {
  const adjective = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const number = Math.floor(Math.random() * 100);
  return `${adjective}-${noun}-${number}`;
}
