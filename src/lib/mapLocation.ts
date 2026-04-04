import type { Report } from '@/app/components/mapTypes';

/** Decode PostGIS EWKB point hex to [lng, lat]. */
function parseEwkbPointHex(hex: string): [number, number] | null {
  const clean = hex.replace(/^\\x/i, '').replace(/\s/g, '');
  if (!/^[0-9a-fA-F]+$/i.test(clean) || clean.length < 18) return null;
  const len = clean.length / 2;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const littleEndian = view.getUint8(0) === 1;
  let o = 1;
  const wkbType = view.getUint32(o, littleEndian);
  o += 4;
  const hasSrid = (wkbType & 0x20000000) !== 0;
  const type = wkbType & 0xffff;
  if (type !== 1) return null;
  if (hasSrid) o += 4;
  if (o + 16 > buf.length) return null;
  const x = view.getFloat64(o, littleEndian);
  const y = view.getFloat64(o + 8, littleEndian);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [x, y];
}

function coordsFromArray(coordinates: unknown): [number, number] | null {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

/**
 * Normalize Supabase/PostGIS values to GeoJSON Point for the map.
 */
export function locationToGeoJSON(
  location: unknown
): Report['location_geojson'] {
  if (location == null) return null;

  if (typeof location === 'string') {
    const trimmed = location.trim();
    if (trimmed.startsWith('{')) {
      try {
        return locationToGeoJSON(JSON.parse(trimmed) as unknown);
      } catch {
        /* fall through */
      }
    }
    const ewkb = parseEwkbPointHex(trimmed);
    if (ewkb) return { type: 'Point', coordinates: ewkb };
    const m = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) {
      const lng = parseFloat(m[1]);
      const lat = parseFloat(m[2]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return { type: 'Point', coordinates: [lng, lat] };
      }
    }
    return null;
  }

  if (typeof location === 'object' && location !== null) {
    const o = location as {
      type?: string;
      coordinates?: unknown;
      geometry?: unknown;
    };
    if (typeof o.type === 'string' && o.type.toLowerCase() === 'point') {
      const pair = coordsFromArray(o.coordinates);
      if (pair) return { type: 'Point', coordinates: pair };
    }
    if (
      typeof o.type === 'string' &&
      o.type.toLowerCase() === 'feature' &&
      o.geometry != null
    ) {
      return locationToGeoJSON(o.geometry);
    }
  }

  return null;
}
