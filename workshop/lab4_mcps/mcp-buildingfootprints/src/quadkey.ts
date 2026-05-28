export interface Bbox {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

export function quadkeyToBbox(quadkey: string): Bbox {
  let tileX = 0;
  let tileY = 0;
  const zoom = quadkey.length;
  for (let i = zoom; i > 0; i--) {
    const mask = 1 << (i - 1);
    const digit = parseInt(quadkey[zoom - i], 10);
    if (digit & 1) tileX |= mask;
    if (digit & 2) tileY |= mask;
  }
  const n = Math.pow(2, zoom);
  const minLon = (tileX / n) * 360 - 180;
  const maxLon = ((tileX + 1) / n) * 360 - 180;
  const maxLat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / n))) * 180) / Math.PI;
  const minLat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (tileY + 1)) / n))) * 180) / Math.PI;
  return { minLon, maxLon, minLat, maxLat };
}

export function bboxesOverlap(a: Bbox, b: Bbox): boolean {
  return (
    a.minLon <= b.maxLon &&
    a.maxLon >= b.minLon &&
    a.minLat <= b.maxLat &&
    a.maxLat >= b.minLat
  );
}
