type AmplitudeInterface = typeof import("../vendor/amplitude");

export function getAmplitude(): AmplitudeInterface|null {
  if (window.amplitude) {
    return window.amplitude;
  }
  return null;
}
