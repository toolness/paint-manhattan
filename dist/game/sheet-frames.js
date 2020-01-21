export const TERRAIN_FRAME = "Land and water";
export const STREETS_FRAME = "Streets";
export const IGNORE_FRAMES = [
    "Reference image",
];
export const NON_HIGHLIGHT_FRAMES = [
    TERRAIN_FRAME,
    STREETS_FRAME,
    ...IGNORE_FRAMES
];
export function getStreetFrames(sheet) {
    const ignoreFrames = new Set(NON_HIGHLIGHT_FRAMES);
    return Object.keys(sheet.metadata.frames).filter(name => !ignoreFrames.has(name));
}
