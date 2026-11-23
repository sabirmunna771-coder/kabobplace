/** Resolves `AudioContext` for Safari and other browsers with `webkit` prefix. */
export function getAudioContextConstructor(): typeof AudioContext {
  if (typeof globalThis === "undefined") {
    return AudioContext;
  }
  const w = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  return w.webkitAudioContext ?? AudioContext;
}
