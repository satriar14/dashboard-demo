/**
 * Look-up table for Kecamatan and Kabupaten coordinates in Central Kalimantan.
 * These are approximate centroids for visualization purposes.
 */

export const COORDINATES: Record<string, { lat: number; lng: number }> = {
  // --- KABUPATEN / KOTA CENTROIDS ---
  'PALANGKA RAYA': { lat: -2.21, lng: 113.91 },
  'KOTA PALANGKA RAYA': { lat: -2.21, lng: 113.91 },
  'KOTAWARINGIN TIMUR': { lat: -2.15, lng: 112.85 },
  'KOTAWARINGIN BARAT': { lat: -2.68, lng: 111.62 },
  'KAPUAS': { lat: -2.1, lng: 114.45 },
  'SERUYAN': { lat: -2.4, lng: 112.25 },
  'KATINGAN': { lat: -1.9, lng: 113.3 },
  'LAMANDAU': { lat: -1.75, lng: 111.3 },
  'BARITO UTARA': { lat: -1.0, lng: 115.0 },
  'GUNUNG MAS': { lat: -1.15, lng: 113.85 },
  'PULANG PISAU': { lat: -2.95, lng: 114.15 },
  'BARITO TIMUR': { lat: -2.15, lng: 115.05 },
  'SUKAMARA': { lat: -2.7, lng: 111.25 },
  'BARITO SELATAN': { lat: -2.1, lng: 114.85 },
  'MURUNG RAYA': { lat: -0.25, lng: 114.25 },

  // --- KECAMATAN PALANGKA RAYA ---
  'PAHANDUT': { lat: -2.2215, lng: 113.9168 },
  'JEKAN RAYA': { lat: -2.1852, lng: 113.8824 },
  'SABANGAU': { lat: -2.3567, lng: 113.8890 },
  'BUKIT BATU': { lat: -1.9867, lng: 113.7890 },
  'RAKUMPIT': { lat: -1.8267, lng: 113.6820 },

  // --- KECAMATAN KOTAWARINGIN BARAT ---
  'ARUT SELATAN': { lat: -2.7314, lng: 111.6234 },
  'ARUT UTARA': { lat: -1.9567, lng: 111.5890 },
  'KOTAWARINGIN LAMA': { lat: -2.3578, lng: 111.4589 },
  'KUMAI': { lat: -2.8567, lng: 111.7589 },
  'PANGKALAN LADA': { lat: -2.4567, lng: 111.7589 },
  'PANGKALAN BANTENG': { lat: -2.3567, lng: 111.8890 },

  // --- KECAMATAN KOTAWARINGIN TIMUR ---
  'MENTAWA BARU KETAPANG': { lat: -2.5367, lng: 112.9589 },
  'BAAMANG': { lat: -2.5167, lng: 112.9289 },
  'SERANIYAN': { lat: -2.4567, lng: 112.8589 },
  'PARENGGEAN': { lat: -1.9567, lng: 112.7589 },

  // Add more as needed based on data

  // --- SAMSAT / UPT PAYMENT OFFICES ---
  'SAMSAT PANGKALAN BUN': { lat: -2.6979, lng: 111.6240 },
  'SAMKEL 2 PANGKALAN BUN': { lat: -2.7100, lng: 111.6180 },
  'MPP PANGKALAN BUN': { lat: -2.6950, lng: 111.6300 },
  'PALANGKA RAYA': { lat: -2.2139, lng: 113.9136 },
  'KUALA KAPUAS': { lat: -3.0061, lng: 114.3600 },
  'SAMSAT KUALA KAPUAS': { lat: -3.0061, lng: 114.3600 },
  'SAMSAT PALANGKA RAYA': { lat: -2.2139, lng: 113.9136 },
  'SAMSAT SAMPIT': { lat: -2.5303, lng: 112.9517 },
  'SAMSAT MUARA TEWEH': { lat: -0.952, lng: 114.8952 },
  'SAMSAT BUNTOK': { lat: -1.7528, lng: 115.0000 },
  'SAMSAT PURUK CAHU': { lat: -0.0803, lng: 114.3530 },
};

/**
 * Gets coordinates for a location name with fuzzy matching.
 */
export function getCoords(name: string, parentName?: string): { lat: number; lng: number } {
  const normalized = name.toUpperCase().replace('KOTA ', '').replace('KABUPATEN ', '');
  
  if (COORDINATES[normalized]) return COORDINATES[normalized];
  if (COORDINATES[name.toUpperCase()]) return COORDINATES[name.toUpperCase()];

  // Fallback if not found: try jittering the parent coordinates if available
  if (parentName && COORDINATES[parentName.toUpperCase()]) {
    const parent = COORDINATES[parentName.toUpperCase()];
    return {
      lat: parent.lat + (Math.random() - 0.5) * 0.15,
      lng: parent.lng + (Math.random() - 0.5) * 0.15
    };
  }

  // Final fallback (Palangka Raya center)
  return { lat: -2.21, lng: 113.91 };
}
