export const SOLAR_RADIUS_KM = 695_700;

/**
 * Given a sunspot area in km² returns the *angular radius* in radians,
 * i.e. φ = asin( r_spot_km / R_sun_km ).
 */
export function computeAngularRadiusRadians(area_km2: number, materialRequiresScaling?: boolean): number {
  const r_km = Math.sqrt(area_km2 * (materialRequiresScaling ? 1.1 : 1) / Math.PI);
  return Math.asin(Math.min(r_km / SOLAR_RADIUS_KM, 1));
}
