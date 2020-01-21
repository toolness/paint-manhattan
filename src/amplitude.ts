type AmplitudeInterface = typeof import("../vendor/amplitude");

type AmplitudeEvent = {
  name: 'Game started',
  showStreetSkeleton: boolean,
  showStreetsInNarrativeOrder: boolean,
} | {
  name: 'Street painted',
  streetName: string,
  missedAtLeastOnce: boolean,
} | {
  name: 'Game won',
  streetsPainted: number,
  finalScore: number,
} | {
  name: 'Home page viewed',
} | {
  name: 'Debug page viewed',
};

function getAmplitude(): AmplitudeInterface|null {
  if (window.amplitude) {
    return window.amplitude;
  }
  return null;
}

export function logAmplitudeEvent(event: AmplitudeEvent) {
  const {name, ...data} = event;
  const amplitude = getAmplitude();

  if (amplitude) {
    const identify = new amplitude.Identify();
    const instance = amplitude.getInstance();

    instance.logEvent(name, data);

    if (event.name === 'Street painted') {
      identify.add('Streets painted', 1);
      if (!event.missedAtLeastOnce) {
        identify.add('Flawless streets painted', 1);
      }
    } else if (event.name === 'Game started') {
      identify.add('Games started', 1);
    } else if (event.name === 'Game won') {
      identify.add('Games won', 1);
    }

    instance.identify(identify);
  }
}
