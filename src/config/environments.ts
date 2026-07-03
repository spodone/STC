export interface EnvironmentDefinition {
  id: string;
  name: string;
  textureKey: string;
  imagePath: string;
  /** Flip to true once the file exists in public/ — PreloadScene loads it. */
  hasArt: boolean;
  /**
   * A single full-bleed painting can't scroll convincingly (no layers to
   * parallax), so it's not usable as the live gameplay backdrop until it's
   * split into a static sky/distant layer + separately tileable roadside
   * scenery. Until then, gameplay always falls back to the procedural
   * scrolling road (which now includes baked-in trees/rocks/crowd on the
   * margins). Art with hasArt=true can still be used elsewhere (e.g. Menu).
   */
  useForGameplayBackground: boolean;
}

/** How many meters each environment stays active before cycling to the next. */
export const SEGMENT_LENGTH_METERS = 600;

/** Cycles endlessly in this order — matches the 5 named environments from the concept art. */
export const ENVIRONMENTS: readonly EnvironmentDefinition[] = [
  {
    id: "mountains",
    name: "Mountains",
    textureKey: "env-mountains",
    imagePath: "art/environments/mountains.png",
    hasArt: true,
    useForGameplayBackground: false,
  },
  {
    id: "city",
    name: "City",
    textureKey: "env-city",
    imagePath: "art/environments/city.png",
    hasArt: false,
    useForGameplayBackground: false,
  },
  {
    id: "crosswind",
    name: "Crosswind",
    textureKey: "env-crosswind",
    imagePath: "art/environments/crosswind.png",
    hasArt: false,
    useForGameplayBackground: false,
  },
  {
    id: "cobbled-climb",
    name: "Cobbled Climb",
    textureKey: "env-cobbled-climb",
    imagePath: "art/environments/cobbled-climb.png",
    hasArt: false,
    useForGameplayBackground: false,
  },
  {
    id: "finish-circuit",
    name: "Finish Circuit",
    textureKey: "env-finish-circuit",
    imagePath: "art/environments/finish-circuit.png",
    hasArt: false,
    useForGameplayBackground: false,
  },
];
