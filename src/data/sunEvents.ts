import hvEvents from '../scripts/hv-events.json';
import { computeAngularRadiusRadians } from '../utils/computeAngularRadius';

export const sunEvents: Ev[] = (() => {
  // find the Sunspot type
  const ssType = (hvEvents as any[]).find(
    t => t.pin === 'SS' || t.name === 'Sunspot',
  );
  if (!ssType) return [];

  // flatten all groups → data[]
  return ssType.groups
    .flatMap((grp: any) => grp.data as any[])
    .map((ev: any) => {
      const date = (ev.start as string).slice(0, 10);
      // hv_hpc_x / hv_hpc_y in your JSON are actually either hgc coords (°) or hpc coords (arcsec)
      // here we assume they are in degrees already; if arcsec, divide by 3600
      const lon =
        typeof ev.hv_hpc_x === 'number' ? ev.hv_hpc_x : Number(ev.hv_hpc_x);
      const lat =
        typeof ev.hv_hpc_y === 'number' ? ev.hv_hpc_y : Number(ev.hv_hpc_y);

      const area = ev.area_km2 != null ? Number(ev.area_km2) : 0;

      return {
        date,
        lon,
        lat,
        sizeRad: computeAngularRadiusRadians(area, true),
      };
    });
})();
