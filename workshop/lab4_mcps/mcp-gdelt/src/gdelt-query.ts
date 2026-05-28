export const FIPS_COUNTRY_CODES = [
  "TH", "VM", "RP", "ID", "MY", "BM", "CB", "LA", "SN",
  "IN", "PK", "BG", "CH", "JA", "KS", "AF",
  "IZ", "SY", "SA", "IR", "IS", "JO", "YM", "EG", "TU",
  "UK", "FR", "GM", "IT", "SP", "PL", "RS", "UP",
  "US", "CA", "MX", "BR", "AR", "CO",
  "NI", "KE", "ET", "SO", "SF", "SU", "LY",
  "AS", "NZ",
] as const;

export const GDELT_THEMES = [
  "ENV_FLOOD", "ENV_EARTHQUAKE", "ENV_TORNADO", "ENV_HURRICANE",
  "ENV_DROUGHT", "ENV_WILDFIRE", "ENV_SEA_LEVEL_RISE",
  "DISASTER",
  "HEALTH_PANDEMIC", "HEALTH_DISEASE", "HEALTH_VACCINATION",
  "TERROR", "CONFLICT_INSURGENCY", "CONFLICT_COUP", "MILITARY", "WMD",
  "ECON_BANKRUPTCY", "ECON_STOCKMARKET", "ECON_DEBT", "ECON_TRADE",
  "ELECTION", "CORRUPTION", "SANCTIONS", "UNGP_HUMAN_RIGHTS",
] as const;

export function buildQuery(
  countries: readonly string[],
  themes: readonly string[],
  language: string | undefined,
): string {
  const parts: string[] = [];
  if (themes.length === 1) {
    parts.push(`theme:${themes[0]}`);
  } else if (themes.length > 1) {
    parts.push(`(${themes.map((t) => `theme:${t}`).join(" OR ")})`);
  }
  if (countries.length === 1) {
    parts.push(`sourcecountry:${countries[0]}`);
  } else if (countries.length > 1) {
    parts.push(`(${countries.map((c) => `sourcecountry:${c}`).join(" OR ")})`);
  }
  if (language) parts.push(`sourcelang:${language}`);
  return parts.join(" ");
}
