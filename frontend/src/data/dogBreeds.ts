// Dog breeds — each drives a portrait (adult + puppy) and a job aptitude.
// Painterly dog art lives on R2 (like the adventurer/building portraits), not
// bundled locally. Source files go in frontend/public/images/dogs/ and are
// pushed up via scripts/upload-to-r2.mjs.
//
// `adult`/`puppy` are POOLS so a breed can have several variants; a new dog
// picks an unused one first, so no two dogs share a face until the pool is
// exhausted. To add a variant, drop e.g. mastiff_3.png + mastiff_3_puppy.png
// and bump that breed's `variants` count below.

export type DogBreed =
  | "bull_terrier"
  | "stray_dog"
  | "mongrel"
  | "lurcher"
  | "flushing_spaniel"
  | "scent_hound"
  | "flock_guardian"
  | "mastiff"
  | "herding_collie"
  | "cattle_drover";

export type BreedAptitude = "guard" | "hunt" | "either";

export interface BreedInfo {
  name: string;
  aptitude: BreedAptitude;
  adult: string[];
  puppy: string[];
}

const R2 = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/dogs";
const P = (f: string) => `${R2}/${f}.png`;

/** Build the variant pools for a breed. n = how many portrait variants exist
 *  (files: `<key>.png`, `<key>_2.png`, … and `<key>_puppy.png`, `<key>_2_puppy.png`, …). */
function pools(key: string, n: number): { adult: string[]; puppy: string[] } {
  const adult = [P(key)];
  const puppy = [P(`${key}_puppy`)];
  for (let i = 2; i <= n; i++) { adult.push(P(`${key}_${i}`)); puppy.push(P(`${key}_${i}_puppy`)); }
  return { adult, puppy };
}

const CFG: Record<DogBreed, { name: string; aptitude: BreedAptitude; variants: number }> = {
  // Guard-leaning — flock guardians, drovers, the heavy yard dog.
  mastiff:          { name: "Mastiff",          aptitude: "guard",  variants: 2 },
  flock_guardian:   { name: "Flock Guardian",   aptitude: "guard",  variants: 2 },
  cattle_drover:    { name: "Cattle Drover",    aptitude: "guard",  variants: 2 },
  herding_collie:   { name: "Herding Collie",   aptitude: "guard",  variants: 2 },
  // Hunt-leaning — coursers, flushers, scent-trackers, ratters.
  lurcher:          { name: "Lurcher",          aptitude: "hunt",   variants: 2 },
  flushing_spaniel: { name: "Flushing Spaniel", aptitude: "hunt",   variants: 2 },
  scent_hound:      { name: "Scent Hound",      aptitude: "hunt",   variants: 2 },
  bull_terrier:     { name: "Bull Terrier",     aptitude: "hunt",   variants: 2 },
  // No strong lean — the strays and mixes.
  mongrel:          { name: "Mongrel",          aptitude: "either", variants: 2 },
  stray_dog:        { name: "Stray",            aptitude: "either", variants: 2 },
};

export const DOG_BREEDS: Record<DogBreed, BreedInfo> = Object.fromEntries(
  (Object.entries(CFG) as [DogBreed, (typeof CFG)[DogBreed]][]).map(([key, c]) => [
    key,
    { name: c.name, aptitude: c.aptitude, ...pools(key, c.variants) },
  ]),
) as Record<DogBreed, BreedInfo>;

export const DOG_BREED_KEYS = Object.keys(DOG_BREEDS) as DogBreed[];

export function breedName(breed: string): string {
  return DOG_BREEDS[breed as DogBreed]?.name ?? "Dog";
}
export function breedAptitude(breed: string): BreedAptitude {
  return DOG_BREEDS[breed as DogBreed]?.aptitude ?? "either";
}

// Parked name ideas (not in rotation yet — the pool below stays rustic/serious
// so random strays don't break the tone). Promote any of these when we want a
// funnier or cuter batch, or reuse them for special/gift dogs:
//   Cute:  Biscuit, Barley, Pudding, Clover, Turnip, Noodle, Marrow, Nutmeg
//   Funny: Sir Sniffsalot, Barkimedes, Houndini, Lord Waggington, Chaucer,
//          Duke, Baron, Beowoof
// (Truffle was pulled from this batch for the Thornwoods' gift hound.)

// Rustic dog names for strays and pups (avoids founder/adventurer names).
export const DOG_NAMES = [
  "Bracken", "Fen", "Scout", "Nib", "Tansy", "Rook", "Bramble", "Juno",
  "Barley", "Comet", "Fern", "Gorse", "Hazel", "Ash", "Willow", "Flint",
  "Moss", "Pepper", "Reed", "Thistle", "Vesper", "Wren", "Yarrow", "Bodkin",
  "Clover", "Gale", "Hob", "Rue", "Marrow", "Cinder",
];

/** Pick an adult portrait for a new dog of `breed`, preferring one not already
 *  worn by another dog (so faces stay unique until a breed's pool is exhausted). */
export function pickAdultPortrait(breed: string, used: Set<string>): string {
  const pool = DOG_BREEDS[breed as DogBreed]?.adult ?? DOG_BREEDS.mongrel.adult;
  return pool.find((p) => !used.has(p)) ?? pool[0];
}
/** Same for a puppy portrait (used when a litter is born). */
export function pickPuppyPortrait(breed: string, used: Set<string>): string {
  const pool = DOG_BREEDS[breed as DogBreed]?.puppy ?? DOG_BREEDS.mongrel.puppy;
  return pool.find((p) => !used.has(p)) ?? pool[0];
}
