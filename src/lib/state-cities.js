// Top cities per US state, curated. Values are city populations in thousands
// (rounded). Order doesn't matter — the distributor normalizes by total pop.
// Keys match the state names returned by ipwho.is / ip-api.com `region` field.
export const STATE_CITIES = {
  Alabama: [['Huntsville', 215], ['Montgomery', 198], ['Birmingham', 197], ['Mobile', 187], ['Tuscaloosa', 110]],
  Alaska: [['Anchorage', 288], ['Fairbanks', 32], ['Juneau', 32], ['Wasilla', 11]],
  Arizona: [['Phoenix', 1640], ['Tucson', 543], ['Mesa', 509], ['Chandler', 278], ['Scottsdale', 244], ['Gilbert', 273]],
  Arkansas: [['Little Rock', 202], ['Fayetteville', 94], ['Fort Smith', 89], ['Springdale', 85], ['Jonesboro', 80]],
  California: [['Los Angeles', 3820], ['San Diego', 1410], ['San Jose', 970], ['San Francisco', 810], ['Fresno', 546], ['Sacramento', 525], ['Long Beach', 450], ['Oakland', 430]],
  Colorado: [['Denver', 715], ['Colorado Springs', 486], ['Aurora', 391], ['Fort Collins', 170], ['Lakewood', 156]],
  Connecticut: [['Bridgeport', 148], ['Stamford', 135], ['New Haven', 134], ['Hartford', 121], ['Waterbury', 114]],
  Delaware: [['Wilmington', 70], ['Dover', 39], ['Newark', 31], ['Middletown', 23]],
  Florida: [['Jacksonville', 971], ['Miami', 442], ['Tampa', 403], ['Orlando', 317], ['St. Petersburg', 258], ['Hialeah', 224], ['Fort Lauderdale', 184]],
  Georgia: [['Atlanta', 499], ['Columbus', 206], ['Augusta', 200], ['Macon', 157], ['Savannah', 147], ['Athens', 128]],
  Hawaii: [['Honolulu', 345], ['East Honolulu', 50], ['Pearl City', 47], ['Hilo', 44], ['Waipahu', 43]],
  Idaho: [['Boise', 235], ['Meridian', 135], ['Nampa', 112], ['Idaho Falls', 67], ['Caldwell', 63]],
  Illinois: [['Chicago', 2695], ['Aurora', 180], ['Joliet', 150], ['Naperville', 149], ['Rockford', 147], ['Springfield', 114]],
  Indiana: [['Indianapolis', 880], ['Fort Wayne', 270], ['Evansville', 115], ['South Bend', 103], ['Carmel', 101]],
  Iowa: [['Des Moines', 214], ['Cedar Rapids', 137], ['Davenport', 101], ['Sioux City', 85], ['Iowa City', 75]],
  Kansas: [['Wichita', 395], ['Overland Park', 197], ['Kansas City', 156], ['Olathe', 142], ['Topeka', 126]],
  Kentucky: [['Louisville', 626], ['Lexington', 322], ['Bowling Green', 74], ['Owensboro', 60], ['Covington', 41]],
  Louisiana: [['New Orleans', 384], ['Baton Rouge', 225], ['Shreveport', 180], ['Lafayette', 122], ['Lake Charles', 84]],
  Maine: [['Portland', 68], ['Lewiston', 38], ['Bangor', 31], ['South Portland', 26], ['Auburn', 24]],
  Maryland: [['Baltimore', 570], ['Columbia', 104], ['Frederick', 78], ['Gaithersburg', 69], ['Rockville', 68]],
  Massachusetts: [['Boston', 675], ['Worcester', 206], ['Springfield', 155], ['Cambridge', 118], ['Lowell', 115], ['Brockton', 105]],
  Michigan: [['Detroit', 633], ['Grand Rapids', 198], ['Warren', 139], ['Sterling Heights', 134], ['Ann Arbor', 123], ['Lansing', 112]],
  Minnesota: [['Minneapolis', 430], ['St. Paul', 311], ['Rochester', 121], ['Duluth', 86], ['Bloomington', 89]],
  Mississippi: [['Jackson', 150], ['Gulfport', 72], ['Southaven', 57], ['Hattiesburg', 46], ['Biloxi', 49]],
  Missouri: [['Kansas City', 508], ['St. Louis', 301], ['Springfield', 169], ['Columbia', 128], ['Independence', 123]],
  Montana: [['Billings', 117], ['Missoula', 74], ['Great Falls', 60], ['Bozeman', 53], ['Butte', 35]],
  Nebraska: [['Omaha', 486], ['Lincoln', 292], ['Bellevue', 64], ['Grand Island', 53], ['Kearney', 34]],
  Nevada: [['Las Vegas', 660], ['Henderson', 320], ['North Las Vegas', 275], ['Reno', 265], ['Sparks', 110]],
  'New Hampshire': [['Manchester', 115], ['Nashua', 91], ['Concord', 44], ['Dover', 32], ['Rochester', 33]],
  'New Jersey': [['Newark', 311], ['Jersey City', 292], ['Paterson', 159], ['Elizabeth', 137], ['Lakewood', 106], ['Edison', 107]],
  'New Mexico': [['Albuquerque', 564], ['Las Cruces', 112], ['Rio Rancho', 104], ['Santa Fe', 88], ['Roswell', 48]],
  'New York': [['New York City', 8335], ['Buffalo', 278], ['Yonkers', 211], ['Rochester', 211], ['Syracuse', 148], ['Albany', 99]],
  'North Carolina': [['Charlotte', 875], ['Raleigh', 470], ['Greensboro', 300], ['Durham', 283], ['Winston-Salem', 250], ['Fayetteville', 209]],
  'North Dakota': [['Fargo', 125], ['Bismarck', 74], ['Grand Forks', 60], ['Minot', 48], ['West Fargo', 38]],
  Ohio: [['Columbus', 906], ['Cleveland', 372], ['Cincinnati', 309], ['Toledo', 272], ['Akron', 190], ['Dayton', 137]],
  Oklahoma: [['Oklahoma City', 681], ['Tulsa', 411], ['Norman', 128], ['Broken Arrow', 119], ['Edmond', 95]],
  Oregon: [['Portland', 652], ['Eugene', 176], ['Salem', 175], ['Gresham', 114], ['Hillsboro', 106], ['Bend', 100]],
  Pennsylvania: [['Philadelphia', 1580], ['Pittsburgh', 302], ['Allentown', 125], ['Reading', 95], ['Erie', 94], ['Scranton', 76]],
  'Rhode Island': [['Providence', 190], ['Warwick', 82], ['Cranston', 82], ['Pawtucket', 75], ['East Providence', 47]],
  'South Carolina': [['Charleston', 150], ['Columbia', 137], ['North Charleston', 115], ['Mount Pleasant', 95], ['Greenville', 72]],
  'South Dakota': [['Sioux Falls', 202], ['Rapid City', 77], ['Aberdeen', 28], ['Brookings', 25], ['Watertown', 22]],
  Tennessee: [['Nashville', 693], ['Memphis', 628], ['Knoxville', 192], ['Chattanooga', 184], ['Clarksville', 166]],
  Texas: [['Houston', 2320], ['San Antonio', 1545], ['Dallas', 1305], ['Austin', 975], ['Fort Worth', 960], ['El Paso', 679], ['Arlington', 394]],
  Utah: [['Salt Lake City', 200], ['West Valley City', 136], ['West Jordan', 117], ['Provo', 115], ['Orem', 98], ['Sandy', 95]],
  Vermont: [['Burlington', 44], ['Essex', 22], ['South Burlington', 20], ['Colchester', 18], ['Rutland', 15]],
  Virginia: [['Virginia Beach', 458], ['Chesapeake', 252], ['Norfolk', 240], ['Arlington', 238], ['Richmond', 226], ['Newport News', 186]],
  Washington: [['Seattle', 755], ['Spokane', 230], ['Tacoma', 220], ['Vancouver', 190], ['Bellevue', 150], ['Kent', 136]],
  'West Virginia': [['Charleston', 47], ['Huntington', 44], ['Morgantown', 31], ['Parkersburg', 29], ['Wheeling', 27]],
  Wisconsin: [['Milwaukee', 576], ['Madison', 272], ['Green Bay', 107], ['Kenosha', 99], ['Racine', 77], ['Appleton', 75]],
  Wyoming: [['Cheyenne', 65], ['Casper', 58], ['Gillette', 33], ['Laramie', 32], ['Rock Springs', 23]],
  'District of Columbia': [['Washington', 705]],
};

// Ten recurring approved-applicant names, same across every state so visitors
// see consistent "people" regardless of where they are.
export const TICKER_NAMES = [
  'Marcus W.',
  'Amy T.',
  'James R.',
  'Linda P.',
  'Maria L.',
  'David K.',
  'Sarah M.',
  'Michael B.',
  'Jennifer C.',
  'Brittany N.',
];

// Ten varied loan amounts, paired to names in order.
export const TICKER_AMOUNTS = [
  '$12,500', '$8,000', '$22,000', '$18,500', '$30,000',
  '$15,000', '$25,500', '$9,500', '$35,000', '$40,000',
];

// Ten monotonically increasing times so the top of the ticker reads "most recent".
export const TICKER_TIMES = [
  '2 min ago', '4 min ago', '7 min ago', '10 min ago', '13 min ago',
  '17 min ago', '21 min ago', '24 min ago', '28 min ago', '32 min ago',
];

// Largest-remainder apportionment, with a population-dampening exponent so
// dominant cities (Seattle, LA, NYC) don't eat half the slots. We weight by
// `pop ** POP_EXPONENT` instead of raw population — exponent < 1 compresses
// the spread. 0.6 is tuned so Seattle drops from ~5/10 slots to ~3/10 while
// keeping the order correct (biggest city still wins most slots).
const POP_EXPONENT = 0.6;

function distributeByPopulation(cities, totalSlots) {
  const weighted = cities.map(([city, pop]) => [city, pop, Math.pow(pop, POP_EXPONENT)]);
  const totalWeight = weighted.reduce((s, [, , w]) => s + w, 0);
  const rows = weighted.map(([city, pop, weight]) => {
    const exact = (weight / totalWeight) * totalSlots;
    const floor = Math.floor(exact);
    return { city, pop, floor, frac: exact - floor };
  });
  let assigned = rows.reduce((s, r) => s + r.floor, 0);
  const remainders = [...rows].sort((a, b) => b.frac - a.frac);
  let i = 0;
  while (assigned < totalSlots) {
    remainders[i % remainders.length].floor += 1;
    assigned += 1;
    i += 1;
  }
  return rows.map((r) => ({ city: r.city, count: r.floor }));
}

// Round-robin through the allocated counts so repeats are spaced out instead
// of clumped (Las Vegas / Henderson / Reno / NLV / Las Vegas / ... rather
// than Las Vegas / Las Vegas / Las Vegas / Las Vegas / Henderson / ...).
function interleaveByCount(allocations, totalSlots) {
  const pool = allocations
    .filter((a) => a.count > 0)
    .map((a) => ({ ...a }))
    .sort((a, b) => b.count - a.count);
  const out = [];
  while (out.length < totalSlots) {
    let pushedThisRound = false;
    for (const a of pool) {
      if (a.count > 0) {
        out.push(a.city);
        a.count -= 1;
        pushedThisRound = true;
        if (out.length >= totalSlots) break;
      }
    }
    if (!pushedThisRound) break; // safety
  }
  return out;
}

// Build the ticker payload for a given state name. Returns an array of 10
// items ({name, city, amount, time}) or null if we don't have city data for
// the state (non-US visitor or unknown state string).
export function buildStateTicker(stateName) {
  const cities = STATE_CITIES[stateName];
  if (!cities || cities.length === 0) return null;
  const totalSlots = TICKER_NAMES.length;
  const allocations = distributeByPopulation(cities, totalSlots);
  const cityList = interleaveByCount(allocations, totalSlots);
  return cityList.map((city, i) => ({
    name: TICKER_NAMES[i],
    city,
    amount: TICKER_AMOUNTS[i],
    time: TICKER_TIMES[i],
  }));
}

// Fallback ticker for non-US visitors or when state lookup fails — uses
// a mix of major US cities so the ticker still has content to scroll.
export const FALLBACK_TICKER = [
  { name: 'Marcus W.',   city: 'Atlanta',       amount: '$12,500', time: '2 min ago' },
  { name: 'Amy T.',      city: 'Phoenix',       amount: '$8,000',  time: '4 min ago' },
  { name: 'James R.',    city: 'Jacksonville',  amount: '$22,000', time: '7 min ago' },
  { name: 'Linda P.',    city: 'Columbus',      amount: '$18,500', time: '10 min ago' },
  { name: 'Maria L.',    city: 'Los Angeles',   amount: '$30,000', time: '13 min ago' },
  { name: 'David K.',    city: 'Houston',       amount: '$15,000', time: '17 min ago' },
  { name: 'Sarah M.',    city: 'Dallas',        amount: '$25,500', time: '21 min ago' },
  { name: 'Michael B.',  city: 'Indianapolis',  amount: '$9,500',  time: '24 min ago' },
  { name: 'Jennifer C.', city: 'Seattle',       amount: '$35,000', time: '28 min ago' },
  { name: 'Brittany N.', city: 'Chicago',       amount: '$40,000', time: '32 min ago' },
];
