/**
 * mock-overpass.ts — Drop-in replacement for overpass.ts
 *
 * Use this file when the Overpass API is rate-limited (HTTP 429/503).
 * It exports the same `PointOfInterest` type and `searchPois` function,
 * so you can swap the import in your tools without any other changes:
 *
 *   // In tools/poi-tools.ts, change:
 *   import { searchPois } from "../overpass.js";
 *   // to:
 *   import { searchPois } from "../mock-overpass.js";
 *
 * For Paris, Barcelona, Rome, and Tokyo (the cities used in lab prompts)
 * real POI names and coordinates are returned. For all other locations the
 * mock scatters plausible-sounding names around the requested coordinates.
 *
 */

export interface PointOfInterest {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  tags: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Real POI data for cities used in lab prompts
// Format per entry: [name, latitude, longitude]
// ---------------------------------------------------------------------------
type RealPoiEntry = [string, number, number];

const CITY_POIS: Record<string, Partial<Record<string, RealPoiEntry[]>>> = {
  paris: {
    museum: [
      ["Musée du Louvre",              48.8606,  2.3376],
      ["Musée d'Orsay",                48.8600,  2.3266],
      ["Centre Pompidou",              48.8607,  2.3519],
      ["Musée Rodin",                  48.8550,  2.3158],
      ["Musée Picasso",                48.8596,  2.3623],
      ["Musée de l'Orangerie",         48.8638,  2.3222],
      ["Palais de Tokyo",              48.8648,  2.2989],
      ["Musée Carnavalet",             48.8569,  2.3622],
      ["Musée des Arts et Métiers",    48.8662,  2.3553],
      ["Cité des Sciences",            48.8956,  2.3876],
    ],
    attraction: [
      ["Eiffel Tower",                 48.8584,  2.2945],
      ["Arc de Triomphe",              48.8738,  2.2950],
      ["Notre-Dame Cathedral",         48.8530,  2.3499],
      ["Sacré-Cœur Basilica",          48.8867,  2.3431],
      ["Palais Royal",                 48.8638,  2.3370],
      ["Place de la Bastille",         48.8533,  2.3692],
      ["Champs-Élysées",               48.8698,  2.3078],
      ["Moulin Rouge",                 48.8842,  2.3322],
      ["Jardin du Luxembourg",         48.8462,  2.3372],
      ["Place de la Concorde",         48.8656,  2.3212],
    ],
    restaurant: [
      ["Le Jules Verne",               48.8583,  2.2945],
      ["Café de Flore",                48.8540,  2.3330],
      ["Brasserie Lipp",               48.8540,  2.3341],
      ["L'Ami Louis",                  48.8637,  2.3585],
      ["Septime",                      48.8519,  2.3734],
      ["Le Comptoir du Relais",        48.8522,  2.3359],
      ["Chez L'Ami Jean",              48.8621,  2.3069],
      ["Frenchie",                     48.8618,  2.3456],
      ["Au Pied de Cochon",            48.8628,  2.3465],
      ["Le Grand Véfour",              48.8641,  2.3373],
    ],
    cafe: [
      ["Café de la Paix",              48.8718,  2.3314],
      ["Angelina Paris",               48.8651,  2.3299],
      ["Le Procope",                   48.8527,  2.3386],
      ["Café Marly",                   48.8608,  2.3346],
      ["Carette",                      48.8656,  2.2907],
      ["Café Charlot",                 48.8612,  2.3618],
      ["Ten Belles",                   48.8699,  2.3600],
      ["Ob-La-Di",                     48.8581,  2.3635],
      ["Fragments",                    48.8614,  2.3614],
      ["Café Kitsuné",                 48.8638,  2.3375],
    ],
    park: [
      ["Jardin des Tuileries",         48.8634,  2.3274],
      ["Jardin du Luxembourg",         48.8462,  2.3372],
      ["Bois de Boulogne",             48.8695,  2.2473],
      ["Parc des Buttes-Chaumont",     48.8796,  2.3821],
      ["Parc de la Villette",          48.8939,  2.3912],
      ["Parc Monceau",                 48.8797,  2.3094],
      ["Bois de Vincennes",            48.8326,  2.4428],
      ["Parc Montsouris",              48.8208,  2.3377],
      ["Promenade Plantée",            48.8496,  2.3775],
      ["Square du Vert-Galant",        48.8573,  2.3418],
    ],
    monument: [
      ["Arc de Triomphe",              48.8738,  2.2950],
      ["Colonne Vendôme",              48.8671,  2.3296],
      ["Panthéon",                     48.8462,  2.3463],
      ["Sainte-Chapelle",              48.8554,  2.3450],
      ["Statue of Liberty (replica)",  48.8475,  2.2839],
      ["Le Mur pour la Paix",          48.8557,  2.2983],
      ["Monument des Droits de l'Homme", 48.8601, 2.2953],
      ["Mémorial de la Shoah",         48.8558,  2.3573],
      ["Colonne de Juillet",           48.8533,  2.3692],
      ["Fontaine Saint-Michel",        48.8527,  2.3465],
    ],
  },

  barcelona: {
    museum: [
      ["Museu Picasso",                41.3850,  2.1808],
      ["MNAC – Catalan Art Museum",    41.3684,  2.1533],
      ["Fundació Joan Miró",           41.3683,  2.1597],
      ["MACBA – Contemporary Art",     41.3828,  2.1664],
      ["Fundació Antoni Tàpies",       41.3926,  2.1643],
      ["Museu d'Història de Barcelona",41.3839,  2.1768],
      ["CosmoCaixa",                   41.4127,  2.1321],
      ["Museu Marítim",                41.3762,  2.1754],
      ["Museu d'Arqueologia",          41.3688,  2.1575],
      ["Museu de la Música",           41.4010,  2.1791],
    ],
    attraction: [
      ["Sagrada Família",              41.4036,  2.1744],
      ["Park Güell",                   41.4145,  2.1527],
      ["Casa Batlló",                  41.3916,  2.1649],
      ["La Pedrera (Casa Milà)",       41.3954,  2.1619],
      ["Gothic Quarter",               41.3836,  2.1769],
      ["Palau de la Música Catalana",  41.3874,  2.1753],
      ["Tibidabo",                     41.4217,  2.1186],
      ["Montjuïc Castle",              41.3638,  2.1664],
      ["Camp Nou",                     41.3809,  2.1228],
      ["La Barceloneta Beach",         41.3791,  2.1896],
    ],
    restaurant: [
      ["El Xampanyet",                 41.3844,  2.1815],
      ["Bar del Pla",                  41.3843,  2.1770],
      ["Tickets (Albert Adrià)",       41.3743,  2.1546],
      ["Cervecería Catalana",          41.3940,  2.1624],
      ["El Nacional",                  41.3912,  2.1661],
      ["La Cova Fumada",               41.3813,  2.1944],
      ["7 Portes",                     41.3785,  2.1849],
      ["Parking Pizza",                41.3845,  2.1531],
      ["Can Culleretes",               41.3821,  2.1756],
      ["Bodega Sepúlveda",             41.3830,  2.1575],
    ],
    cafe: [
      ["Bar Marsella",                 41.3814,  2.1750],
      ["Federal Café",                 41.3774,  2.1625],
      ["Nomad Coffee",                 41.3885,  2.1830],
      ["Satan's Coffee Corner",        41.3843,  2.1760],
      ["El Café de la Academia",       41.3836,  2.1779],
      ["Café de l'Acadèmia",           41.3836,  2.1779],
      ["Café Zurich",                  41.3810,  2.1728],
      ["Bar Muy Buenas",               41.3820,  2.1717],
      ["Caravelle",                    41.3817,  2.1713],
      ["Syra Coffee",                  41.3931,  2.1638],
    ],
    park: [
      ["Park Güell",                   41.4145,  2.1527],
      ["Ciutadella Park",              41.3874,  2.1858],
      ["Jardins de Laribal",           41.3657,  2.1600],
      ["Parc del Laberint d'Horta",    41.4334,  2.1446],
      ["Jardins de Can Sentmenat",     41.4389,  2.2100],
      ["Parc de la Creueta del Coll",  41.4160,  2.1558],
      ["Parc de les Aigues",           41.4033,  2.1567],
      ["Jardí Botànic de Barcelona",   41.3672,  2.1570],
      ["Parc de Cervantes",            41.3903,  2.1130],
      ["Barceloneta Beach Park",       41.3756,  2.1941],
    ],
  },

  rome: {
    museum: [
      ["Vatican Museums",              41.9065, 12.4534],
      ["Borghese Gallery",             41.9141, 12.4922],
      ["Capitoline Museums",           41.8933, 12.4828],
      ["National Roman Museum",        41.9017, 12.4983],
      ["Castel Sant'Angelo (museum)",  41.9031, 12.4664],
      ["MAXXI Museum",                 41.9287, 12.4654],
      ["Palazzo Doria Pamphilj",       41.8976, 12.4802],
      ["Galleria Nazionale d'Arte",    41.9149, 12.4801],
      ["Palazzo Altemps",              41.9004, 12.4729],
      ["Crypta Balbi",                 41.8948, 12.4759],
    ],
    attraction: [
      ["Colosseum",                    41.8902, 12.4922],
      ["Roman Forum",                  41.8925, 12.4853],
      ["Trevi Fountain",               41.9009, 12.4833],
      ["Pantheon",                     41.8986, 12.4769],
      ["Vatican City",                 41.9065, 12.4534],
      ["Spanish Steps",                41.9058, 12.4823],
      ["Piazza Navona",                41.8992, 12.4731],
      ["Castel Sant'Angelo",           41.9031, 12.4664],
      ["Borghese Gallery",             41.9141, 12.4922],
      ["Circus Maximus",               41.8861, 12.4855],
    ],
    restaurant: [
      // Near Colosseum (< 1 km) — returned for "restaurants near Colosseum" queries
      ["Aroma Restaurant",             41.8898, 12.4939],
      ["Ristorante Il Gladiatore",     41.8904, 12.4924],
      ["Osteria Angelino ai Fori",     41.8921, 12.4876],
      ["Taverna dei Fori Imperiali",   41.8937, 12.4858],
      ["Luzzi",                        41.8882, 12.4944],
      // Wider Rome
      ["Armando al Pantheon",          41.8987, 12.4771],
      ["Da Enzo al 29",                41.8868, 12.4714],
      ["Roscioli",                     41.8941, 12.4742],
      ["Il Sorpasso",                  41.9010, 12.4651],
      ["Tonnarello",                   41.8872, 12.4707],
    ],
    cafe: [
      ["Sant'Eustachio il Caffè",      41.8983, 12.4749],
      ["Caffè Greco",                  41.9056, 12.4817],
      ["Bar San Calisto",              41.8882, 12.4706],
      ["Caffè della Pace",             41.8995, 12.4724],
      ["Tazza d'Oro",                  41.8987, 12.4770],
      ["Sciascia Caffè",               41.9034, 12.4638],
      ["Caffè Capitolino",             41.8936, 12.4822],
      ["Caffè Farnese",                41.8960, 12.4715],
      ["Roscioli Caffè",               41.8941, 12.4742],
      ["Bar del Fico",                 41.8992, 12.4724],
    ],
    monument: [
      ["Vittoriano (Altare della Patria)", 41.8951, 12.4824],
      ["Column of Trajan",             41.8956, 12.4842],
      ["Arch of Constantine",          41.8896, 12.4906],
      ["Arch of Titus",                41.8914, 12.4882],
      ["Column of Marcus Aurelius",    41.8996, 12.4809],
      ["Porta Maggiore",               41.8936, 12.5121],
      ["Pyramid of Cestius",           41.8769, 12.4786],
      ["Arch of Janus",                41.8877, 12.4823],
      ["Mausoleum of Augustus",        41.9033, 12.4749],
      ["Largo di Torre Argentina",     41.8961, 12.4757],
    ],
  },

  tokyo: {
    museum: [
      ["Tokyo National Museum",        35.7188, 139.7765],
      ["Edo-Tokyo Museum",             35.6963, 139.7967],
      ["National Museum of Western Art",35.7155,139.7750],
      ["Mori Art Museum",              35.6606, 139.7292],
      ["Tokyo Metropolitan Art Museum",35.7173, 139.7757],
      ["Ghibli Museum",                35.6963, 139.5703],
      ["teamLab Borderless",           35.6248, 139.7836],
      ["Samurai Museum",               35.6958, 139.7037],
      ["Nezu Museum",                  35.6641, 139.7137],
      ["Tokyo Toy Museum",             35.6870, 139.7181],
    ],
    attraction: [
      ["Senso-ji Temple",              35.7148, 139.7967],
      ["Tokyo Skytree",                35.7101, 139.8107],
      ["Shibuya Crossing",             35.6595, 139.7004],
      ["Meiji Shrine",                 35.6763, 139.6993],
      ["Shinjuku Gyoen",               35.6852, 139.7100],
      ["Tokyo Tower",                  35.6586, 139.7454],
      ["Imperial Palace",              35.6852, 139.7528],
      ["Harajuku Takeshita Street",    35.6700, 139.7044],
      ["Odaiba Island",                35.6252, 139.7752],
      ["Akihabara Electric Town",      35.7023, 139.7745],
    ],
    restaurant: [
      ["Sukiyabashi Jiro",             35.6720, 139.7635],
      ["Narisawa",                     35.6711, 139.7261],
      ["Den",                          35.6730, 139.7333],
      ["Gonpachi Nishi-Azabu",         35.6621, 139.7259],
      ["Tsukiji Outer Market",         35.6654, 139.7706],
      ["Ichiran Shibuya",              35.6591, 139.6987],
      ["Tempura Kondo",                35.6710, 139.7645],
      ["Ramen Ippudo",                 35.6965, 139.7020],
      ["Kyubey",                       35.6720, 139.7650],
      ["Sushi Saito",                  35.6654, 139.7353],
    ],
    cafe: [
      ["% Arabica Kyoto (Roppongi)",   35.6606, 139.7305],
      ["Blue Bottle Coffee Shinjuku",  35.6910, 139.7001],
      ["Streamer Coffee Shibuya",      35.6587, 139.7020],
      ["Bear Pond Espresso",           35.6820, 139.6895],
      ["Fuglen Tokyo",                 35.6826, 139.7019],
      ["Onibus Coffee",                35.6558, 139.7093],
      ["Unlimited Coffee Bar",         35.7100, 139.7940],
      ["Leaves Coffee Apartment",      35.7070, 139.7748],
      ["Cafe de l'Ambre",              35.6710, 139.7640],
      ["Little Nap Coffee Stand",      35.6869, 139.7112],
    ],
    park: [
      ["Ueno Park",                    35.7155, 139.7717],
      ["Shinjuku Gyoen",               35.6852, 139.7100],
      ["Yoyogi Park",                  35.6716, 139.6942],
      ["Hibiya Park",                  35.6745, 139.7582],
      ["Hamarikyu Gardens",            35.6597, 139.7635],
      ["Inokashira Park",              35.6997, 139.5758],
      ["Koganei Park",                 35.7137, 139.5013],
      ["Showa Kinen Park",             35.6999, 139.4099],
      ["Rinshi-no-Mori Park",          35.6066, 139.7115],
      ["Yumenoshima Park",             35.6428, 139.8345],
    ],
  },
};

// Bounding boxes used to detect which city a coordinate falls in
const CITY_BOUNDS = [
  { city: "paris",     latMin: 48.78, latMax: 48.95, lonMin: 2.20, lonMax: 2.55 },
  { city: "barcelona", latMin: 41.32, latMax: 41.47, lonMin: 1.95, lonMax: 2.30 },
  { city: "rome",      latMin: 41.82, latMax: 41.95, lonMin: 12.40, lonMax: 12.58 },
  { city: "tokyo",     latMin: 35.53, latMax: 35.82, lonMin: 139.40, lonMax: 139.95 },
];

function detectCity(lat: number, lon: number): string | null {
  for (const b of CITY_BOUNDS) {
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) {
      return b.city;
    }
  }
  return null;
}

/** Haversine distance between two coordinates, in meters. */
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Fallback name banks — used when city is not recognised
// ---------------------------------------------------------------------------
const NAME_BANKS: Record<string, string[]> = {
  museum: [
    "City History Museum",
    "Natural Science Museum",
    "Contemporary Art Museum",
    "Technology & Innovation Museum",
    "Children's Discovery Museum",
    "Archaeological Museum",
    "Maritime Heritage Museum",
    "Photography Museum",
    "National Gallery of Fine Arts",
    "Folk Culture Museum",
  ],
  attraction: [
    "Central Fountain Plaza",
    "Old Town Square",
    "Scenic Overlook",
    "Heritage Gardens",
    "Historic Waterfront",
    "Landmark Clock Tower",
    "Cultural Arts Center",
    "Grand Promenade",
    "Botanical Terrace",
    "Sunset Viewpoint",
  ],
  restaurant: [
    "The Golden Fork",
    "Harbor Bistro",
    "Uptown Kitchen",
    "La Maison Brasserie",
    "River View Grill",
    "The Copper Pot",
    "Old Quarter Tavern",
    "Saffron Garden",
    "Rosewood Dining Room",
    "The Anchor & Plate",
  ],
  cafe: [
    "Morning Brew Café",
    "The Daily Grind",
    "Rooftop Coffee Bar",
    "Pebble & Bean",
    "Corner Espresso",
    "The Reading Room Café",
    "Blue Door Coffee",
    "Sunrise Patisserie",
    "Harbour Blend",
    "The Little Spoon",
  ],
  hotel: [
    "Grand Plaza Hotel",
    "The Meridian Suites",
    "Bayview Inn",
    "Heritage House Hotel",
    "The Central Lodge",
    "Riverside Boutique Hotel",
    "Skyline Hotel & Spa",
    "The Garden Arms",
    "Premier City Hotel",
    "The Landmark Residence",
  ],
  park: [
    "Riverside Park",
    "Greenfield Commons",
    "Central City Park",
    "Heritage Meadows",
    "Lakeview Gardens",
    "Northgate Park",
    "Hillside Reserve",
    "The Great Lawn",
    "Botanical Garden Park",
    "Freedom Memorial Park",
  ],
  viewpoint: [
    "Summit Overlook",
    "Panorama Point",
    "City Vista Terrace",
    "Hilltop Lookout",
    "Harbor View Platform",
    "Skyline Observation Deck",
    "Eagle Peak Viewpoint",
    "Golden Hour Terrace",
    "Northern Ridge Overlook",
    "Valley Vista Point",
  ],
  monument: [
    "Victory Column",
    "Liberty Monument",
    "War Memorial Obelisk",
    "Founders' Statue",
    "Independence Pillar",
    "National Heroes Monument",
    "The Great Arc",
    "Maritime Memorial",
    "Peace Monument",
    "Cathedral Square Monument",
  ],
  artwork: [
    "Abstract Steel Sculpture",
    "The Weeping Figure",
    "Mosaic Wall Mural",
    "Bronze Horses Installation",
    "The Spiral Tower",
    "Urban Light Array",
    "Glass Garden Sculpture",
    "The Reflecting Arch",
    "Kinetic Wind Sculpture",
    "Community Mosaic",
  ],
  theatre: [
    "Grand Opera House",
    "The Playhouse Theatre",
    "City Concert Hall",
    "Riverside Amphitheatre",
    "National Drama Theatre",
    "The Comedy Club",
    "Open Air Theatre",
    "The Studio Stage",
    "Heritage Performing Arts Centre",
    "The Black Box Theatre",
  ],
};

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helpers (seeded from lat/lon/index)
// Used by the scatter fallback for unrecognised cities
// ---------------------------------------------------------------------------

const FALLBACK_NAMES = [
  "Local Landmark",
  "Heritage Site",
  "Points of Interest",
  "Community Hub",
  "Cultural Center",
  "Neighborhood Gem",
  "Popular Spot",
  "Visitor Attraction",
  "Scenic Location",
  "Notable Place",
];

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helpers (seeded from lat/lon/index)
// ---------------------------------------------------------------------------
function seededRand(seed: number): number {
  // Mulberry32 — fast, good enough for mock offsets
  seed |= 0;
  seed = seed + 0x6d2b79f5 | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function seed(lat: number, lon: number, index: number, salt: number): number {
  // Combine inputs into a stable integer seed
  return Math.round((lat * 1000 + lon * 1000 + index * 31 + salt * 97) * 137) | 0;
}

/**
 * Scatter a coordinate by up to `maxMeters` in a pseudo-random direction.
 * Uses seeded randomness so the same inputs always produce the same output.
 */
function scatter(
  lat: number,
  lon: number,
  index: number,
  maxMeters: number,
): { lat: number; lon: number } {
  const r1 = seededRand(seed(lat, lon, index, 1));
  const r2 = seededRand(seed(lat, lon, index, 2));

  // Convert meters to rough degrees (valid for most latitudes)
  const latDegPerMeter = 1 / 111_320;
  const lonDegPerMeter = 1 / (111_320 * Math.cos((lat * Math.PI) / 180));

  // Random distance within [maxMeters * 0.1, maxMeters * 0.9]
  const distance = maxMeters * (0.1 + r1 * 0.8);
  const angle = r2 * 2 * Math.PI;

  return {
    lat: lat + distance * Math.cos(angle) * latDegPerMeter,
    lon: lon + distance * Math.sin(angle) * lonDegPerMeter,
  };
}

// ---------------------------------------------------------------------------
// Public API — same signature as overpass.ts
// ---------------------------------------------------------------------------

/**
 * Returns mock points of interest near a coordinate.
 * This is a drop-in replacement for the real `searchPois` from overpass.ts.
 *
 * @param latitude  - Center latitude
 * @param longitude - Center longitude
 * @param type      - POI type (e.g. "museum", "restaurant")
 * @param radius    - Search radius in meters (default 5000)
 */
export async function searchPois(
  latitude: number,
  longitude: number,
  type: string,
  radius: number = 5000,
): Promise<PointOfInterest[]> {
  // Simulate a short network delay so the UX feels realistic
  await new Promise((r) => setTimeout(r, 80 + Math.round(seededRand(seed(latitude, longitude, 0, 99)) * 120)));

  const makeTags = (name: string): Record<string, string> => {
    const raw: Record<string, string | undefined> = {
      name,
      tourism: ["museum", "attraction", "hotel", "viewpoint", "artwork", "theatre"].includes(type) ? type : undefined,
      amenity: ["restaurant", "cafe"].includes(type) ? type : undefined,
      leisure: type === "park" ? type : undefined,
      historic: type === "monument" ? type : undefined,
      "mock:data": "true",
    };
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined)) as Record<string, string>;
  };

  // --- City-aware path: real names + real coordinates ---
  const city = detectCity(latitude, longitude);
  if (city) {
    const cityPois = CITY_POIS[city]?.[type];
    if (cityPois) {
      // Filter to those within the requested radius, then sort nearest-first
      const inRadius = cityPois
        .map(([name, lat, lon]) => ({ name, lat, lon, dist: haversineMeters(latitude, longitude, lat, lon) }))
        .filter(({ dist }) => dist <= radius)
        .sort((a, b) => a.dist - b.dist);

      // If there are enough real POIs in range, return them
      if (inRadius.length >= 3) {
        return inRadius.map(({ name, lat, lon }, i) => ({
          id: Math.abs(seed(lat, lon, i, 7)) % 900_000_000 + 100_000_000,
          name,
          latitude: Math.round(lat * 1_000_000) / 1_000_000,
          longitude: Math.round(lon * 1_000_000) / 1_000_000,
          type,
          tags: makeTags(name),
        }));
      }
    }
  }

  // --- Fallback path: scatter generic names around the given coordinates ---
  const names = NAME_BANKS[type] ?? FALLBACK_NAMES;
  return names.map((name, i) => {
    const { lat, lon } = scatter(latitude, longitude, i, radius);
    return {
      id: Math.abs(seed(latitude, longitude, i, 42)) % 900_000_000 + 100_000_000,
      name,
      latitude: Math.round(lat * 1_000_000) / 1_000_000,
      longitude: Math.round(lon * 1_000_000) / 1_000_000,
      type,
      tags: makeTags(name),
    };
  });
}
