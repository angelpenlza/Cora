import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let mapsReady: Promise<void> | null = null;

function mapsAlreadyReady(): boolean {
  if (typeof window === 'undefined') return true;
  const g = window.google;
  return Boolean(g?.maps?.Map && g?.maps?.Geocoder);
}

export function ensureGoogleMapsReady(
  apiKey: string,
  mapId?: string
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (mapsAlreadyReady()) return Promise.resolve();

  if (!mapsReady) {
    setOptions({
      key: apiKey,
      v: 'weekly',
      ...(mapId ? { mapIds: [mapId] } : {}),
    });
    mapsReady = importLibrary('maps')
      .then(() => undefined)
      .catch((err) => {
        mapsReady = null;
        throw err;
      });
  }
  return mapsReady;
}
