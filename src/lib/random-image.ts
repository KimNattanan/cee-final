const tags = [
  "angry",
  "baka",
  "bite",
  "bleh",
  "blowkiss",
  "blush",
  "bonk",
  "bored",
  "carry",
  "clap",
  "confused",
  "cry",
  "cuddle",
  "dance",
  "facepalm",
  "feed",
  "handhold",
  "handshake",
  "happy",
  "highfive",
  "hug",
  "kabedon",
  "kick",
  "kiss",
  "lappillow",
  "laugh",
  "lurk",
  "nod",
  "nom",
  "nope",
  "nya",
  "pat",
  "peck",
  "poke",
  "pout",
  "punch",
  "run",
  "salute",
  "shake",
  "shoot",
  "shocked",
  "shrug",
  "sip",
  "slap",
  "sleep",
  "smile",
  "smug",
  "spin",
  "stare",
  "tableflip",
  "teehee",
  "think",
  "thumbsup",
  "tickle",
  "wag",
  "wave",
  "wink", 
  "yawn",
  "yeet",
]

/** Stable non-negative integer from a string (same input ⇒ same output on every client). */
export function predictionHashSeed(prediction: string): number {
  let h = 0;
  for (let i = 0; i < prediction.length; i++) {
    h = Math.imul(31, h) + prediction.charCodeAt(i);
  }
  return Math.abs(h);
}

export async function randomImageUrl(prediction: string) {
  const tag =
    tags.find((t) => t === prediction) ??
    tags[predictionHashSeed(prediction) % tags.length];
  try {
    const response = await fetch(`https://nekos.best/api/v2/${tag}`);
    const data = await response.json();
    return data.results[0].url;
  } catch (error) {
    return "/img/note_pc_error.png";
  }
}