import fs from 'fs/promises';
import fetch from 'node-fetch';

const OUT = './src/scripts/hv-events.json';
const ONE_DAY = 24 * 60 * 60 * 1000;

async function fetchHvEvents(start, end) {
  const types = {};

  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + ONE_DAY)) {
    const day = d.toISOString().slice(0, 10);
    const url = `https://api.helioviewer.org/v2/events/?startTime=${day}T00:00:00Z&endTime=${day}T23:59:59Z`;

    console.log(`🔍 Fetching ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ✖  ${day}: HTTP ${res.status}`);
      continue;
    }

    const payload = /** @type {any[]} */ (await res.json());
    console.log(`  → got ${payload.length} type(s) on ${day}`);

    for (const typeObj of payload) {
      const pin = typeObj.pin;
      const name = typeObj.name;
      // match by pin *or* by name
      const isSunspot = pin === 'SS' || name === 'Sunspot';
      const isFil = pin === 'FE' || name === 'Filament Eruption';
      if (!isSunspot && !isFil) continue;

      // choose a stable key
      const key = isSunspot ? 'SS' : 'FE';
      if (!types[key]) {
        types[key] = { name, pin: key, groups: [] };
      }

      for (const grp of typeObj.groups) {
        const tidyData = grp.data.map(ev => {
          // base fields
          const id = ev.id;
          const start = ev.event_starttime || ev.start;
          const end = ev.event_endtime || ev.end;
          const x = Number(ev.hgc_x ?? ev.hpc_x);
          const y = Number(ev.hgc_y ?? ev.hpc_y);
          const label = ev.event_title ?? ev.label ?? '';
          const version = ev.frm_versionnumber?.toString() ?? ev.version ?? '';

          const base = {
            id,
            type: key,
            start,
            end,
            hv_hpc_x: x,
            hv_hpc_y: y,
            label,
            version,
          };

          if (key === 'SS') {
            return {
              ...base,
              pin: 'SS',
              area_km2: ev.area_atdiskcenter ?? null,
            };
          } else {
            return {
              ...base,
              pin: 'FE',
              title: ev.event_title,
              description: ev.event_description,
              peaktime: ev.event_peaktime || null,
              thumbUrl: ev.gs_imageurl || null,
            };
          }
        });

        types[key].groups.push({
          name: grp.name,
          contact: grp.contact,
          url: grp.url,
          data: tidyData,
        });
      }
    }

    // be kind to the API
    await new Promise(r => setTimeout(r, 200));
  }

  return Object.values(types);
}

(async () => {
  const start = new Date('2025-01-01');
  const end = new Date('2025-07-08');

  console.log(
    `🚀 Fetching from ${start.toISOString()} to ${end.toISOString()}`,
  );
  const hv = await fetchHvEvents(start, end);

  console.log(
    `➡️  Got ${hv.length} type(s):`,
    hv.map(t => `${t.pin} (${t.name})`),
  );
  if (hv.length === 0) {
    console.warn('⚠️  No SS/FE events found in that range.');
  }

  await fs.writeFile(OUT, JSON.stringify(hv, null, 2), 'utf-8');
  console.log(`✅ Wrote ${hv.length} type(s) to`, OUT);
})();
