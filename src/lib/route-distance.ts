/**
 * Route Distance Utility
 *
 * Provides estimated road distances (km) between Korean logistics hubs.
 * Uses a lookup table for major corridors and a province-centroid fallback
 * for unknown pairs.
 */

// ── Province centroid coordinates (lat, lng) ─────────────────────
// Used for fallback Haversine estimation when exact route is unknown.

const PROVINCE_COORDS: Record<string, [number, number]> = {
  Seoul: [37.5665, 126.978],
  Incheon: [37.4563, 126.7052],
  Gyeonggi: [37.4138, 127.5183],
  Gangwon: [37.8228, 128.1555],
  Chungbuk: [36.6357, 127.4917],
  Chungnam: [36.5184, 126.8],
  Daejeon: [36.3504, 127.3845],
  Sejong: [36.48, 127.0],
  Jeonbuk: [35.8203, 127.1089],
  Jeonnam: [34.8161, 126.4629],
  Gwangju: [35.1595, 126.8526],
  Gyeongbuk: [36.576, 128.5056],
  Gyeongnam: [35.4606, 128.2132],
  Daegu: [35.8714, 128.6014],
  Busan: [35.1796, 129.0756],
  Ulsan: [35.5384, 129.3114],
  Jeju: [33.4996, 126.5312],
};

// ── Known road distances (km) for major corridors ────────────────
// Key format: "Province1→Province2" (sorted alphabetically to ensure
// a single entry per pair).

const ROAD_DISTANCES: Record<string, number> = {
  "Busan→Seoul": 325,
  "Daegu→Seoul": 237,
  "Daejeon→Seoul": 140,
  "Gwangju→Seoul": 268,
  "Incheon→Seoul": 28,
  "Gyeonggi→Seoul": 40,
  "Gangwon→Seoul": 133,
  "Chungbuk→Seoul": 120,
  "Chungnam→Seoul": 130,
  "Gyeongbuk→Seoul": 200,
  "Gyeongnam→Seoul": 300,
  "Jeonbuk→Seoul": 200,
  "Jeonnam→Seoul": 290,
  "Ulsan→Seoul": 307,
  "Sejong→Seoul": 120,
  "Busan→Daegu": 88,
  "Busan→Ulsan": 52,
  "Busan→Gyeongnam": 70,
  "Daegu→Gyeongbuk": 50,
  "Daegu→Ulsan": 75,
  "Daejeon→Chungbuk": 60,
  "Daejeon→Chungnam": 40,
  "Daejeon→Sejong": 25,
  "Gwangju→Jeonnam": 45,
  "Gwangju→Jeonbuk": 85,
  "Gyeonggi→Incheon": 30,
  "Gyeonggi→Gangwon": 110,
  "Gyeonggi→Chungbuk": 100,
  "Gyeonggi→Chungnam": 90,
  "Gyeongnam→Jeonnam": 180,
  "Jeonbuk→Jeonnam": 100,
  "Jeonbuk→Chungnam": 90,
  "Busan→Gwangju": 260,
  "Busan→Daejeon": 200,
  "Busan→Jeonbuk": 230,
  "Daegu→Daejeon": 120,
  "Daegu→Gwangju": 185,
  "Incheon→Busan": 350,
  "Busan→Jeju": 450, // includes ferry/logistics estimate
  "Seoul→Jeju": 480, // includes ferry/logistics estimate
};

/**
 * Extract province from "City/District" format.
 */
function extractProvince(location: string): string {
  return location.split("/")[0].trim();
}

/**
 * Haversine distance between two lat/lng points (km).
 * Used as absolute last resort when no road distance is known.
 * Multiplied by 1.3 to approximate road distance from straight-line.
 */
function haversineKm(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalise a pair of provinces into a canonical lookup key.
 * Tries both "A→B" and "B→A".
 */
function lookupDistance(prov1: string, prov2: string): number | null {
  const key1 = `${prov1}→${prov2}`;
  const key2 = `${prov2}→${prov1}`;
  return ROAD_DISTANCES[key1] ?? ROAD_DISTANCES[key2] ?? null;
}

export interface RouteDistanceResult {
  distanceKm: number;
  source: "lookup" | "haversine";
}

/**
 * Get estimated road distance between two locations.
 *
 * Strategy:
 *   1. Try exact province pair lookup from the known corridors table.
 *   2. Fallback to Haversine × 1.3 road factor using province centroids.
 *   3. If province is unknown, default to 200 km.
 */
export function getRouteDistance(
  origin: string,
  destination: string
): RouteDistanceResult {
  const prov1 = extractProvince(origin);
  const prov2 = extractProvince(destination);

  // Same province → short intra-province distance
  if (prov1 === prov2) {
    return { distanceKm: 30, source: "lookup" };
  }

  // Try lookup table
  const known = lookupDistance(prov1, prov2);
  if (known !== null) {
    return { distanceKm: known, source: "lookup" };
  }

  // Haversine fallback
  const coord1 = PROVINCE_COORDS[prov1];
  const coord2 = PROVINCE_COORDS[prov2];

  if (coord1 && coord2) {
    const straight = haversineKm(coord1, coord2);
    const roadEstimate = Math.round(straight * 1.3);
    return { distanceKm: roadEstimate, source: "haversine" };
  }

  // Ultimate fallback
  return { distanceKm: 200, source: "haversine" };
}
