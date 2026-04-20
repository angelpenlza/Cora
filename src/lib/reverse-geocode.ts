import { unstable_cache } from 'next/cache';

type NominatimReverseResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    county?: string;
    state?: string;
  };
};

function pickCityLike(address: NominatimReverseResponse['address']): string | null {
  if (!address) return null;
  const v =
    address.city ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.county ??
    null;
  return v?.trim() ? v.trim() : null;
}

async function reverseGeocodeCityUncached(
  lat: number,
  lon: number,
): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2&lat=${encodeURIComponent(String(lat))}` +
    `&lon=${encodeURIComponent(String(lon))}` +
    `&zoom=10&addressdetails=1`;

  const res = await fetch(url, {
    // Nominatim usage policy requires a valid User-Agent.
    headers: {
      'User-Agent': 'Cora (https://github.com/Davidc45/Cora)',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimReverseResponse;
  return pickCityLike(data.address);
}

/**
 * Reverse-geocode coordinates to a city-like label (city/town/village/county).
 * Cached on the server to avoid repeated calls + rate limits.
 */
export const reverseGeocodeCity = unstable_cache(
  async (lat: number, lon: number) => reverseGeocodeCityUncached(lat, lon),
  ['reverse-geocode-city'],
  { revalidate: 60 * 60 * 24 * 30 } // 30 days
);

