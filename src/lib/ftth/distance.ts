/**
 * Menghitung jarak lurus (Great Circle Distance) antara dua titik koordinat GPS
 * menggunakan formula Haversine dalam satuan Meter.
 */
export function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Radius bumi dalam meter
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

/**
 * Format representasi jarak yang ramah teknisi:
 * Jika < 1000m -> contoh: "350 m"
 * Jika >= 1000m -> contoh: "2.4 km"
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${meters} m`;
    }
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
}

/**
 * URL Scheme universal untuk membuka rute di Google Maps
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * URL Scheme universal untuk membuka rute di Waze
 */
export function getWazeUrl(lat: number, lng: number): string {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}
