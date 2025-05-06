// top-level “Type” object
interface HvType<T> {
  name: string; // e.g. “Sunspot” or “Filament Eruption”
  pin: string; // e.g. “SS” or “FE”
  groups: HvGroup<T>[];
}

// per-group
interface HvGroup<T> {
  name: string; // recognition method or human annotator name
  contact: string; // contact info
  url: string; // source URL
  data: T[]; // your trimmed events
}

// base event coords + timing
interface HvBaseEvent {
  id: string;
  type: string; // “SS” | “FE” | …
  start: string; // ISO UTC
  end: string; // ISO UTC
  hv_hpc_x: number; // in arcsec or deg
  hv_hpc_y: number;
  label: string; // short human label
  version: string; // source version tag
}

// sunspot-specific
export interface SunspotEvent extends HvBaseEvent {
  pin: 'SS';
  area_km2: number | null;
  // … any other fields you care about
}

// filament-specific
export interface FilamentEvent extends HvBaseEvent {
  pin: 'FE';
  title: string;
  description: string;
  peaktime: string | null;
  thumbUrl: string | null;
}

// the full fetcher will return:
export type HelioviewerEvents = Array<
  HvType<SunspotEvent> | HvType<FilamentEvent>
>;
