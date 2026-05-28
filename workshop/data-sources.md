# Data Sources & Inspiration

- [All available sources](#all-available-sources) — full catalog of 26 sources; look for `Status: recommended` + `Auth: None` for the lowest-friction starting points
- [Ready-made combinations](#ready-made-combinations) — pre-designed multi-source experiments with Cesium visuals

---

## All available sources

**Status key:** `recommended` — works immediately, no setup needed; `free key needed` — requires a free account or API key before use; `rate limited` — no auth but throttling can affect workshop use; `download only` — not an API, files must be downloaded locally.

### API and feed sources

| ID | Source | Domain | Coverage | Auth | Base URL | MCP effort | Status |
|---|---|---|---|---|---|---|---|
| <a id="s01"></a>S01 | Open-Meteo | Weather | Global | None | [api.open-meteo.com/v1/forecast](https://api.open-meteo.com/v1/forecast) | Low | recommended |
| S02 | NOAA NWS API | Weather alerts/forecast | US | None (`User-Agent` + `Accept: application/geo+json` headers required) | [api.weather.gov](https://api.weather.gov/) | Low | recommended |
| <a id="s03"></a>S03 | NOAA CO-OPS | Tides/currents/met | US coasts | None | [api.tidesandcurrents.noaa.gov/api/prod/datagetter](https://api.tidesandcurrents.noaa.gov/api/prod/datagetter) | Low | recommended |
| S04 | NOAA CDO API v2 | Climate summaries | Global/US | `token` header — free key at [ncei.noaa.gov/cdo-web/token](https://www.ncei.noaa.gov/cdo-web/token) | [ncei.noaa.gov/cdo-web/api/v2](https://www.ncei.noaa.gov/cdo-web/api/v2/) | Medium | free key needed |
| S05 | NOAA Access Data Service | Climate/ocean datasets | Varies | None (mostly) | [ncei.noaa.gov/access/services/data/v1](https://www.ncei.noaa.gov/access/services/data/v1) | Medium | rate limited |
| <a id="s06"></a>S06 | USGS Earthquake FDSN | Hazards | Global | None | [earthquake.usgs.gov/fdsnws/event/1/query](https://earthquake.usgs.gov/fdsnws/event/1/query) | Low | recommended |
| <a id="s07"></a>S07 | USGS Earthquake Feeds | Hazards real-time | Global | None | [earthquake.usgs.gov/earthquakes/feed/v1.0/summary](https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/) | Low | recommended |
| S08 | USGS Water Services | Hydro/streamflow | US | None | [waterservices.usgs.gov/nwis](https://waterservices.usgs.gov/nwis/) | Medium | recommended |
| S09 | USGS TNM Access API | Elevation/topo products | US | None | [tnmaccess.nationalmap.gov/api/v1](https://tnmaccess.nationalmap.gov/api/v1/) | Medium | rate limited |
| <a id="s10"></a>S10 | NASA EONET v3 | Natural events | Global | None | [eonet.gsfc.nasa.gov/api/v3](https://eonet.gsfc.nasa.gov/api/v3/) | Low | recommended |
| <a id="s11"></a>S11 | NASA FIRMS | Wildfire hotspots | Global | MAP key — free, instant at [firms.modaps.eosdis.nasa.gov/api/map_key](https://firms.modaps.eosdis.nasa.gov/api/map_key/) | [firms.modaps.eosdis.nasa.gov/api](https://firms.modaps.eosdis.nasa.gov/api/) | Medium | free key needed |
| <a id="s12"></a>S12 | OpenAQ v3 | Air quality | Global | None | [api.openaq.org/v3](https://api.openaq.org/v3/) | Medium | recommended |
| <a id="s13"></a>S13 | GBIF | Biodiversity | Global | Mostly none | [api.gbif.org/v1](https://api.gbif.org/v1/) | Medium | recommended |
| <a id="s14"></a>S14 | World Bank Indicators | Socioeconomic | Global | None | [api.worldbank.org/v2](https://api.worldbank.org/v2/) | Low | recommended |
| S15 | GeoNames | Gazetteer/geocoding | Global | `username` query param — register at [geonames.org/login](https://www.geonames.org/login) then enable "Free Web Services" at [geonames.org/manageaccount](https://www.geonames.org/manageaccount) | [api.geonames.org](http://api.geonames.org) (HTTP only, no HTTPS) | Low | free key needed |
| <a id="s16"></a>S16 | Overpass API (OSM) | POI/transport/features | Global | None | [overpass-api.de/api/interpreter](https://overpass-api.de/api/interpreter) | Medium | rate limited |
| <a id="s17"></a>S17 | US Census Data API | Demographics | US | Key optional | [api.census.gov/data](https://api.census.gov/data/) | Medium | recommended |
| S18 | Wikidata Query + APIs | Knowledge graph | Global | None (`User-Agent` header required by ToS) | [query.wikidata.org/sparql](https://query.wikidata.org/sparql) | Medium | recommended |
| <a id="s19"></a>S19 | GDELT DOC 2.0 | News/media signals | Global | None | [api.gdeltproject.org/api/v2/doc/doc](https://api.gdeltproject.org/api/v2/doc/doc) | Medium | rate limited |
| S20 | HDX APIs | Humanitarian data | Global | Account (some) | [data.humdata.org/api/3](https://data.humdata.org/api/3/) | Medium | free key needed |

### Cloud-native, bulk, and static sources

| ID | Source | Domain | Coverage | Auth | Download / Catalog URL | MCP effort | Status |
|---|---|---|---|---|---|---|---|
| <a id="s21"></a>S21 | Overture Maps | Buildings/places/transport | Global | None | [overturemaps.org/download](https://overturemaps.org/download/) | Medium | download only |
| <a id="s22"></a>S22 | Natural Earth | Boundaries/physical | Global | None | [naturalearthdata.com/downloads](https://www.naturalearthdata.com/downloads/) | Low | download only |
| <a id="s23"></a>S23 | OpenAddresses | Address points | Global | Bearer token — free, register at [openaddresses.io](https://openaddresses.io/) | [openaddresses.io](https://openaddresses.io/) | Medium | free key needed; download only |
| <a id="s24"></a>S24 | MS Global Buildings | Building footprints | Global | None | [github.com/microsoft/GlobalMLBuildingFootprints](https://github.com/microsoft/GlobalMLBuildingFootprints) | Medium | download only |
| <a id="s25"></a>S25 | TIGER/Line | Admin boundaries/roads | US | None | [census.gov/geographies/mapping-files](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) | Low | download only |
| S26 | Planetary Computer STAC | Earth observation/climate | Global | None | [planetarycomputer.microsoft.com/api/stac/v1](https://planetarycomputer.microsoft.com/api/stac/v1) | Medium | download only |

---

## Ready-made combinations

Pick a pattern as a starting point, or mix pieces across patterns.

| Pattern | Sources | Insight produced | Cesium visual |
|---|---|---|---|
| [**Coastal Flood Readiness**](#p01) | [S01](#s01) + [S03](#s03) + [S25](#s25) | Flood watch score: tide anomaly + forecast rain + wind | Station billboards, county polygons colored by risk tier, time slider |
| [**Earthquake Exposure**](#p02) | [S06](#s06)/[S07](#s07) + [S24](#s24) (or [S21](#s21)) | Estimated exposed structure count by distance band | Epicenter pulse, concentric impact rings, extruded building highlights |
| [**Wildfire Smoke Impact**](#p03) | [S11](#s11) + [S12](#s12) + [S17](#s17) | Smoke impact index weighted by PM readings + population | Heatmap overlays, AQ station glyphs, county choropleth |
| [**Natural Event Context**](#p04) | [S10](#s10) + [S22](#s22) + [S21](#s21) | Event context card: nearest settlements, admin region, category history | Event track/layer toggle, contextual labels, event timeline |
| [**Biodiversity Pressure**](#p05) | [S13](#s13) + [S24](#s24) + [S14](#s14) | Habitat pressure proxy: species occurrence persistence vs built-density trend | Species points, building-density surface, country indicator side panel |
| [**Service Accessibility**](#p06) | [S16](#s16) + [S17](#s17) + [S25](#s25) | POIs per 10k residents by category and geography | Polygon choropleth + clickable POI clusters |
| [**News vs Hazard Signal**](#p07) | [S19](#s19) + [S10](#s10) + [S06](#s06) | Divergence between media tone and measured hazard activity | Dual timeline charts + map event layer toggle |

---

### <a id="p01"></a>P01 — Coastal Flood Readiness

- **Sources:** [S01 Open-Meteo](#s01) + [S03 NOAA CO-OPS](#s03) + [S25 TIGER/Line](#s25)
- **Join key:** spatial join by station proximity to coastal census geographies + aligned hourly timestamps
- **Derived insight:** flood watch score based on tide anomaly + forecast precipitation + wind
- **Cesium visual:** station billboards, county/tract polygons colored by risk tier, time slider playback
- **MCP tools needed:** `get_weather_forecast`, `get_tides`, `list_geometries_by_bbox`, `compute_flood_watch_score`

### <a id="p02"></a>P02 — Earthquake Exposure

- **Sources:** [S06 USGS FDSN](#s06) + [S07 USGS Feeds](#s07) + [S24 MS Global Buildings](#s24) (or [S21 Overture](#s21))
- **Join key:** event epicenter buffer intersecting building polygons
- **Derived insight:** estimated exposed structure count and proximity-weighted impact band
- **Cesium visual:** quake epicenter pulse, concentric impact rings, extruded building highlights
- **MCP tools needed:** `get_earthquakes`, `get_recent_quake_feed`, `query_buildings_in_radius`, `compute_exposure_metrics`

### <a id="p03"></a>P03 — Wildfire Smoke Impact

- **Sources:** [S11 NASA FIRMS](#s11) + [S12 OpenAQ](#s12) + [S17 US Census](#s17)
- **Join key:** fire hotspot buffers joined with nearby AQ stations and census geographies
- **Derived insight:** smoke impact index weighted by PM observations and exposed population
- **Cesium visual:** heatmap overlays, AQ station glyphs, county choropleth for impacted population
- **MCP tools needed:** `get_fire_hotspots`, `get_air_quality_measurements`, `get_census_population`, `compute_smoke_impact_index`

### <a id="p04"></a>P04 — Natural Event Context

- **Sources:** [S10 NASA EONET](#s10) + [S22 Natural Earth](#s22) + [S21 Overture Maps](#s21)
- **Join key:** event geometry mapped to nearby admin/settlement features
- **Derived insight:** event context card — nearest settlements, admin region, category history
- **Cesium visual:** event track/layer toggle, contextual labels, event timeline
- **MCP tools needed:** `get_eonet_events`, `lookup_admin_context`, `lookup_nearby_places`, `build_event_context_summary`

### <a id="p05"></a>P05 — Biodiversity Pressure

- **Sources:** [S13 GBIF](#s13) + [S24 MS Global Buildings](#s24) + [S14 World Bank Indicators](#s14)
- **Join key:** biodiversity occurrence points joined to building density grids and country-level pressure indicators
- **Derived insight:** habitat pressure proxy — occurrence persistence vs built-density trend
- **Cesium visual:** species points, building-density surface, country indicator side panel
- **MCP tools needed:** `get_occurrences`, `get_building_density`, `get_country_indicator`, `compute_habitat_pressure`

### <a id="p06"></a>P06 — Service Accessibility

- **Sources:** [S16 Overpass API](#s16) + [S17 US Census](#s17) + [S25 TIGER/Line](#s25)
- **Join key:** POI coordinates aggregated within census polygons and normalized by population
- **Derived insight:** service access ratio — POIs per 10k residents by category
- **Cesium visual:** polygon choropleth plus clickable POI clusters
- **MCP tools needed:** `query_osm_pois`, `get_population_by_geoid`, `aggregate_pois_by_polygon`, `compute_access_ratio`

### <a id="p07"></a>P07 — News vs Hazard Signal

- **Sources:** [S19 GDELT DOC 2.0](#s19) + [S10 NASA EONET](#s10) + [S06 USGS Earthquake FDSN](#s06)
- **Join key:** temporal join by day/hour and spatial join by affected area keywords or coordinates
- **Derived insight:** divergence between media intensity/tone and measured hazard activity
- **Cesium visual:** dual timeline charts + map event layer toggle
- **MCP tools needed:** `query_news_signal`, `get_hazard_events`, `align_series`, `compute_signal_gap`

---

## Insight-generation scenarios

These are tighter, workshop-ready prompts derived from the patterns above. Each one is scoped to produce a single concrete output and includes a note on why it's a good teaching case.

### Scenario A — Dynamic Flood Watch Score

- **Sources:** [S01 Open-Meteo](#s01) + [S03 NOAA CO-OPS](#s03) + [S25 TIGER/Line](#s25)
- **Tool output:** `flood_watch_score` in `[0, 100]` with explanation fields (`tide_component`, `rain_component`, `wind_component`)
- **Cesium view:** animated coastal polygons and station markers with threshold-based styling
- **Why it teaches well:** clear math pipeline, transparent derived field, visible time evolution

### Scenario B — Seismic Exposure Estimate

- **Sources:** [S06 USGS FDSN](#s06) / [S07 USGS Feeds](#s07) + [S24 MS Global Buildings](#s24) (or [S21 Overture](#s21))
- **Tool output:** exposed-building estimate by distance band and optional confidence bucket
- **Cesium view:** quake epicenter pulse + highlighted building subsets by exposure class
- **Why it teaches well:** direct API ingestion + external static geometry + derived aggregation

### Scenario C — Service Access Inequality Surface

- **Sources:** [S16 Overpass API](#s16) + [S17 US Census](#s17) + [S25 TIGER/Line](#s25)
- **Tool output:** POI-per-capita accessibility score by census geography
- **Cesium view:** choropleth polygons with drill-down to contributing POIs
- **Why it teaches well:** demonstrates spatial join, normalization, and interpretable policy-style metric

### Scenario D — Wildfire Smoke Impact Nowcast

- **Sources:** [S11 NASA FIRMS](#s11) + [S12 OpenAQ](#s12) + [S17 US Census](#s17)
- **Tool output:** smoke-impact severity category and exposed-population estimate
- **Cesium view:** hotspot and AQ overlays with impacted geographies emphasized
- **Why it teaches well:** multi-source event + sensor + demographics integration
