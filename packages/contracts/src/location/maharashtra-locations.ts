export interface TalukaEntry {
  name: string;
  places: string[];
}

export interface DistrictHierarchy {
  district: string;
  city: string;
  talukas: TalukaEntry[];
}

export interface PinCodeMapping {
  pin?: string;
  city: string;
  district: string;
  taluka: string;
  locality: string;
}

export interface PinLocationDetails {
  district: string;
  taluka: string;
  place: string;
  city: string;
  pincode: string;
  state: string;
  availablePlaces?: string[];
}

export const MAHARASHTRA_LOCATION_DATA: DistrictHierarchy[] = [
  {
    district: 'Kolhapur',
    city: 'Kolhapur',
    talukas: [
      {
        name: 'Karveer',
        places: ['Rajarampuri', 'Shahupuri', 'Tarabai Park', 'Rankala', 'Laxmipuri', 'Mangaon', 'Kadamwadi', 'Kasba Bawada'],
      },
      {
        name: 'Kagal',
        places: ['Kagal Town', 'MIDC Kagal', 'Five Star MIDC', 'Kapshi'],
      },
      {
        name: 'Hatkanangle',
        places: ['Ichalkaranji', 'Shiroli', 'Hupari', 'Vadgaon'],
      },
      {
        name: 'Shirol',
        places: ['Jaysingpur', 'Kurundwad', 'Shirol Town'],
      },
      {
        name: 'Radhanagari',
        places: ['Radhanagari Town', 'Dajipur', 'Rashivade'],
      },
      {
        name: 'Shahuwadi',
        places: ['Malkapur', 'Amba', 'Bambavade'],
      },
      {
        name: 'Bhudargad',
        places: ['Gargoti', 'Kadgaon'],
      },
      {
        name: 'Ajara',
        places: ['Ajara Town'],
      },
      {
        name: 'Chandgad',
        places: ['Chandgad Town'],
      },
      {
        name: 'Gaganbawada',
        places: ['Gaganbawada Town'],
      },
    ],
  },
  {
    district: 'Pune',
    city: 'Pune',
    talukas: [
      {
        name: 'Haveli',
        places: ['Kothrud', 'Hinjewadi', 'Wakad', 'Baner', 'Hadapsar', 'Aundh', 'Katraj', 'Kalyani Nagar', 'Magarpatta', 'Pimpri', 'Chinchwad'],
      },
      {
        name: 'Pune City',
        places: ['Shivaji Nagar', 'Koregaon Park', 'Deccan Gymkhana', 'Camp', 'Sadashiv Peth', 'Narayan Peth', 'Kasba Peth'],
      },
      {
        name: 'Mulshi',
        places: ['Pashan', 'Bavdhan', 'Pirangut', 'Hinjewadi Phase 3'],
      },
      {
        name: 'Maval',
        places: ['Lonavala', 'Khandala', 'Talegaon Dabhade', 'Kamshet'],
      },
      {
        name: 'Khed',
        places: ['Chakan', 'Rajgurunagar', 'Alandi'],
      },
      {
        name: 'Shirur',
        places: ['Ranjangaon', 'Shirur Town', 'Shikrapur'],
      },
      {
        name: 'Baramati',
        places: ['Baramati Town', 'MIDC Baramati'],
      },
      {
        name: 'Purandar',
        places: ['Saswad', 'Jejuri'],
      },
      {
        name: 'Junnar',
        places: ['Junnar Town', 'Narayangaon'],
      },
    ],
  },
  {
    district: 'Mumbai Suburban',
    city: 'Mumbai',
    talukas: [
      {
        name: 'Andheri',
        places: ['Andheri West', 'Andheri East', 'Juhu', 'Versova', 'Vile Parle West', 'Vile Parle East', 'Powai', 'Marol', 'Seven Bungalows'],
      },
      {
        name: 'Borivali',
        places: ['Borivali West', 'Borivali East', 'Kandivali West', 'Kandivali East', 'Malad West', 'Malad East', 'Goregaon West', 'Goregaon East', 'Dahisar'],
      },
      {
        name: 'Kurla',
        places: ['Bandra West', 'Bandra East', 'Kurla West', 'Kurla East', 'Ghatkopar West', 'Ghatkopar East', 'Chembur', 'Santacruz West', 'Santacruz East', 'Vidyavihar'],
      },
    ],
  },
  {
    district: 'Mumbai City',
    city: 'Mumbai',
    talukas: [
      {
        name: 'Mumbai City',
        places: ['Colaba', 'Dadar West', 'Dadar East', 'Worli', 'Lower Parel', 'Fort', 'Prabhadevi', 'Marine Lines', 'Mahalaxmi', 'Byculla', 'Parel', 'Girgaon', 'Malabar Hill'],
      },
    ],
  },
  {
    district: 'Thane',
    city: 'Thane',
    talukas: [
      {
        name: 'Thane',
        places: ['Thane West', 'Thane East', 'Ghodbunder Road', 'Majiwada', 'Naupada', 'Vartak Nagar', 'Wagle Estate'],
      },
      {
        name: 'Kalyan',
        places: ['Kalyan West', 'Kalyan East', 'Dombivli West', 'Dombivli East', 'Titwala'],
      },
      {
        name: 'Bhiwandi',
        places: ['Bhiwandi Town', 'Anjur Phata'],
      },
      {
        name: 'Ulhasnagar',
        places: ['Ulhasnagar Town'],
      },
      {
        name: 'Ambernath',
        places: ['Ambernath West', 'Ambernath East', 'Badlapur West', 'Badlapur East'],
      },
    ],
  },
  {
    district: 'Navi Mumbai',
    city: 'Navi Mumbai',
    talukas: [
      {
        name: 'Navi Mumbai',
        places: ['Vashi', 'Nerul', 'Belapur', 'Kharghar', 'Panvel', 'Airoli', 'Sanpada', 'Ghansoli', 'Koparkhairane', 'Kamothe', 'Seawoods', 'Ulwe'],
      },
    ],
  },
  {
    district: 'Nagpur',
    city: 'Nagpur',
    talukas: [
      {
        name: 'Nagpur Urban',
        places: ['Dharampeth', 'Sadar', 'Sitabuldi', 'Laxmi Nagar', 'Trimurti Nagar', 'Civil Lines', 'Manewada', 'Pratap Nagar', 'Wardha Road'],
      },
      {
        name: 'Nagpur Rural',
        places: ['Hingna', 'Kamptee', 'Wadi', 'Kalameshwar'],
      },
      {
        name: 'Umred',
        places: ['Umred Town'],
      },
      {
        name: 'Ramtek',
        places: ['Ramtek Town'],
      },
    ],
  },
  {
    district: 'Nashik',
    city: 'Nashik',
    talukas: [
      {
        name: 'Nashik',
        places: ['College Road', 'Gangapur Road', 'Panchavati', 'Indira Nagar', 'CIDCO Nashik', 'Satpur', 'Nashik Road', 'Govind Nagar'],
      },
      {
        name: 'Malegaon',
        places: ['Malegaon Town', 'Camp Malegaon'],
      },
      {
        name: 'Sinnar',
        places: ['Sinnar MIDC', 'Musalgav'],
      },
      {
        name: 'Igatpuri',
        places: ['Igatpuri Town', 'Ghoti'],
      },
    ],
  },
  {
    district: 'Chhatrapati Sambhajinagar',
    city: 'Chhatrapati Sambhajinagar',
    talukas: [
      {
        name: 'Chhatrapati Sambhajinagar',
        places: ['CIDCO Aurangabad', 'Nirala Bazar', 'Garkheda', 'Samarth Nagar', 'Cantonment', 'Railway Station Area', 'Beed By-Pass'],
      },
      {
        name: 'Paithan',
        places: ['Paithan Town'],
      },
      {
        name: 'Gangapur',
        places: ['Gangapur Town', 'Waluj MIDC'],
      },
    ],
  },
  {
    district: 'Satara',
    city: 'Satara',
    talukas: [
      {
        name: 'Satara',
        places: ['Powai Naka', 'Sadashiv Peth', 'Radhika Road', 'Camp Satara'],
      },
      {
        name: 'Karad',
        places: ['Karad Town', 'Saidapur', 'Malkapur Karad'],
      },
      {
        name: 'Wai',
        places: ['Wai Town', 'Panchgani Road'],
      },
      {
        name: 'Mahabaleshwar',
        places: ['Mahabaleshwar Market', 'Panchgani Town'],
      },
    ],
  },
  {
    district: 'Solapur',
    city: 'Solapur',
    talukas: [
      {
        name: 'Solapur North',
        places: ['Juma Peth', 'Ashok Chowk', 'Old Pune Naka', 'Navi Peth'],
      },
      {
        name: 'Solapur South',
        places: ['Saiful', 'Hotgi Road', 'Kegaon'],
      },
      {
        name: 'Pandharpur',
        places: ['Pandharpur Town', 'Wakhari'],
      },
    ],
  },
  {
    district: 'Sangli',
    city: 'Sangli',
    talukas: [
      {
        name: 'Miraj',
        places: ['Vishrambag', 'Miraj Town', 'Madhavnagar', 'Kupwad'],
      },
      {
        name: 'Sangli',
        places: ['Gaon Bhag', 'Haripur'],
      },
      {
        name: 'Walwa',
        places: ['Islampur', 'Ashta'],
      },
    ],
  },
  {
    district: 'Raigad',
    city: 'Raigad',
    talukas: [
      {
        name: 'Alibag',
        places: ['Alibag Town', 'Versoli', 'Nagaon'],
      },
      {
        name: 'Panvel',
        places: ['Panvel Town', 'Kharghar', 'New Panvel', 'Kamothe', 'Kalamboli'],
      },
      {
        name: 'Karjat',
        places: ['Karjat Town', 'Neral', 'Matheran'],
      },
      {
        name: 'Pen',
        places: ['Pen Town'],
      },
      {
        name: 'Roha',
        places: ['Roha Town'],
      },
    ],
  },
  {
    district: 'Palghar',
    city: 'Palghar',
    talukas: [
      {
        name: 'Vasai',
        places: ['Vasai West', 'Vasai East', 'Nallasopara West', 'Nallasopara East', 'Virar West', 'Virar East', 'Naigaon'],
      },
      {
        name: 'Palghar',
        places: ['Palghar Town', 'Boisar', 'Manor'],
      },
      {
        name: 'Dahanu',
        places: ['Dahanu Town', 'Bordi'],
      },
    ],
  },
  {
    district: 'Ahilyanagar',
    city: 'Ahilyanagar',
    talukas: [
      {
        name: 'Ahilyanagar',
        places: ['Savedi', 'Market Yard', 'Pipeline Road', 'Delhi Gate'],
      },
      {
        name: 'Rahata',
        places: ['Shirdi', 'Rahata Town'],
      },
      {
        name: 'Sangamner',
        places: ['Sangamner Town', 'Ghulewadi'],
      },
    ],
  },
  {
    district: 'Ratnagiri',
    city: 'Ratnagiri',
    talukas: [
      {
        name: 'Ratnagiri',
        places: ['Maruti Mandir', 'Ratnagiri Town', 'Nachane', 'Kuwarbav'],
      },
      {
        name: 'Chiplun',
        places: ['Chiplun Town', 'Khed Road'],
      },
    ],
  },
  {
    district: 'Sindhudurg',
    city: 'Sindhudurg',
    talukas: [
      {
        name: 'Kudal',
        places: ['Kudal Town', 'Pinguli'],
      },
      {
        name: 'Sawantwadi',
        places: ['Sawantwadi Town', 'Amboli'],
      },
      {
        name: 'Kankavli',
        places: ['Kankavli Town'],
      },
      {
        name: 'Malvan',
        places: ['Malvan Town', 'Tarkarli'],
      },
    ],
  },
  {
    district: 'Amravati',
    city: 'Amravati',
    talukas: [
      {
        name: 'Amravati',
        places: ['Rajapeth', 'Camp Area', 'Badnera', 'Navathe'],
      },
      {
        name: 'Achalpur',
        places: ['Achalpur Town', 'Paratwada'],
      },
    ],
  },
  {
    district: 'Jalgaon',
    city: 'Jalgaon',
    talukas: [
      {
        name: 'Jalgaon',
        places: ['MJI College Area', 'Mehrun', 'Ring Road'],
      },
      {
        name: 'Bhusawal',
        places: ['Bhusawal Town', 'Jamner Road'],
      },
    ],
  },
  {
    district: 'Nanded',
    city: 'Nanded',
    talukas: [
      {
        name: 'Nanded',
        places: ['VIP Road', 'Taroda Naka', 'Workad Road', 'CIDCO Nanded'],
      },
    ],
  },
  {
    district: 'Latur',
    city: 'Latur',
    talukas: [
      {
        name: 'Latur',
        places: ['Ausa Road', 'Gandhi Nagar', 'Moti Nagar', 'MIDC Latur'],
      },
    ],
  },
  {
    district: 'Dhule',
    city: 'Dhule',
    talukas: [
      {
        name: 'Dhule',
        places: ['Deopur', 'Agra Road', 'Chittod Road'],
      },
    ],
  },
  {
    district: 'Akola',
    city: 'Akola',
    talukas: [
      {
        name: 'Akola',
        places: ['Civil Lines', 'Jowahar Nagar', 'Kaulkhed'],
      },
    ],
  },
  {
    district: 'Chandrapur',
    city: 'Chandrapur',
    talukas: [
      {
        name: 'Chandrapur',
        places: ['Civil Lines', 'Ballarpur Road', 'Babu Peth'],
      },
    ],
  },
  {
    district: 'Yavatmal',
    city: 'Yavatmal',
    talukas: [
      {
        name: 'Yavatmal',
        places: ['Dhamangaon Road', 'Darwha Road'],
      },
    ],
  },
  {
    district: 'Parbhani',
    city: 'Parbhani',
    talukas: [
      {
        name: 'Parbhani',
        places: ['Station Road', 'Basmat Road'],
      },
    ],
  },
  {
    district: 'Beed',
    city: 'Beed',
    talukas: [
      {
        name: 'Beed',
        places: ['Subhash Road', 'Barshi Road'],
      },
    ],
  },
  {
    district: 'Buldhana',
    city: 'Buldhana',
    talukas: [
      {
        name: 'Buldhana',
        places: ['Sundarkhed', 'Chikhli Road', 'Khamgaon'],
      },
    ],
  },
  {
    district: 'Gondia',
    city: 'Gondia',
    talukas: [
      {
        name: 'Gondia',
        places: ['Kudwa', 'Rail Toly'],
      },
    ],
  },
  {
    district: 'Bhandara',
    city: 'Bhandara',
    talukas: [
      {
        name: 'Bhandara',
        places: ['Khat Road', 'Bhilgaon'],
      },
    ],
  },
  {
    district: 'Gadchiroli',
    city: 'Gadchiroli',
    talukas: [
      {
        name: 'Gadchiroli',
        places: ['Complex Area', 'Chandrapur Road'],
      },
    ],
  },
  {
    district: 'Hingoli',
    city: 'Hingoli',
    talukas: [
      {
        name: 'Hingoli',
        places: ['Nanded Bypass', 'Risod Road'],
      },
    ],
  },
  {
    district: 'Jalna',
    city: 'Jalna',
    talukas: [
      {
        name: 'Jalna',
        places: ['Deewan Devdi', 'Old Jalna'],
      },
    ],
  },
  {
    district: 'Nandurbar',
    city: 'Nandurbar',
    talukas: [
      {
        name: 'Nandurbar',
        places: ['Karanji Chowk', 'Dhule Road'],
      },
    ],
  },
  {
    district: 'Dharashiv',
    city: 'Dharashiv',
    talukas: [
      {
        name: 'Dharashiv',
        places: ['Sanja Road', 'Nehru Chowk'],
      },
    ],
  },
  {
    district: 'Wardha',
    city: 'Wardha',
    talukas: [
      {
        name: 'Wardha',
        places: ['Sewagram', 'Bachelor Road', 'Hinganghat'],
      },
    ],
  },
  {
    district: 'Washim',
    city: 'Washim',
    talukas: [
      {
        name: 'Washim',
        places: ['Pusad Naka', 'Civil Lines'],
      },
    ],
  },
];

export const MAHARASHTRA_DISTRICTS = MAHARASHTRA_LOCATION_DATA.map((item) => ({
  district: item.district,
  city: item.city,
  localities: item.talukas.flatMap((t) => t.places),
}));

export const PIN_CODE_MAPPINGS: Record<string, PinCodeMapping> = {
  '416008': { city: 'Kolhapur', district: 'Kolhapur', taluka: 'Karveer', locality: 'Rajarampuri' },
  '416001': { city: 'Kolhapur', district: 'Kolhapur', taluka: 'Karveer', locality: 'Shahupuri' },
  '416003': { city: 'Kolhapur', district: 'Kolhapur', taluka: 'Karveer', locality: 'Laxmipuri' },
  '416234': { city: 'Kolhapur', district: 'Kolhapur', taluka: 'Kagal', locality: 'Kagal Town' },
  '416115': { city: 'Kolhapur', district: 'Kolhapur', taluka: 'Hatkanangle', locality: 'Ichalkaranji' },
  '400050': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Kurla', locality: 'Bandra West' },
  '400051': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Kurla', locality: 'Bandra East' },
  '400053': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Andheri', locality: 'Andheri West' },
  '400069': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Andheri', locality: 'Andheri East' },
  '400076': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Andheri', locality: 'Powai' },
  '400092': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Borivali', locality: 'Borivali West' },
  '400049': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Andheri', locality: 'Juhu' },
  '400064': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Borivali', locality: 'Malad West' },
  '400071': { city: 'Mumbai', district: 'Mumbai Suburban', taluka: 'Kurla', locality: 'Chembur' },
  '400005': { city: 'Mumbai', district: 'Mumbai City', taluka: 'Mumbai City', locality: 'Colaba' },
  '400028': { city: 'Mumbai', district: 'Mumbai City', taluka: 'Mumbai City', locality: 'Dadar West' },
  '400018': { city: 'Mumbai', district: 'Mumbai City', taluka: 'Mumbai City', locality: 'Worli' },
  '400013': { city: 'Mumbai', district: 'Mumbai City', taluka: 'Mumbai City', locality: 'Lower Parel' },
  '400601': { city: 'Thane', district: 'Thane', taluka: 'Thane', locality: 'Thane West' },
  '400607': { city: 'Thane', district: 'Thane', taluka: 'Thane', locality: 'Ghodbunder Road' },
  '400703': { city: 'Navi Mumbai', district: 'Navi Mumbai', taluka: 'Navi Mumbai', locality: 'Vashi' },
  '400706': { city: 'Navi Mumbai', district: 'Navi Mumbai', taluka: 'Navi Mumbai', locality: 'Nerul' },
  '400710': { city: 'Navi Mumbai', district: 'Navi Mumbai', taluka: 'Navi Mumbai', locality: 'Kharghar' },
  '411038': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Kothrud' },
  '411057': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Hinjewadi' },
  '411014': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Viman Nagar' },
  '411045': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Baner' },
  '411033': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Wakad' },
  '411028': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Hadapsar' },
  '411007': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Aundh' },
  '411005': { city: 'Pune', district: 'Pune', taluka: 'Pune City', locality: 'Shivaji Nagar' },
  '411001': { city: 'Pune', district: 'Pune', taluka: 'Pune City', locality: 'Koregaon Park' },
  '411018': { city: 'Pune', district: 'Pune', taluka: 'Haveli', locality: 'Pimpri' },
  '440010': { city: 'Nagpur', district: 'Nagpur', taluka: 'Nagpur Urban', locality: 'Dharampeth' },
  '440001': { city: 'Nagpur', district: 'Nagpur', taluka: 'Nagpur Urban', locality: 'Sitabuldi' },
  '440022': { city: 'Nagpur', district: 'Nagpur', taluka: 'Nagpur Urban', locality: 'Laxmi Nagar' },
  '422005': { city: 'Nashik', district: 'Nashik', taluka: 'Nashik', locality: 'College Road' },
  '422013': { city: 'Nashik', district: 'Nashik', taluka: 'Nashik', locality: 'Gangapur Road' },
  '422003': { city: 'Nashik', district: 'Nashik', taluka: 'Nashik', locality: 'Panchavati' },
  '431001': { city: 'Chhatrapati Sambhajinagar', district: 'Chhatrapati Sambhajinagar', taluka: 'Chhatrapati Sambhajinagar', locality: 'CIDCO Aurangabad' },
  '431005': { city: 'Chhatrapati Sambhajinagar', district: 'Chhatrapati Sambhajinagar', taluka: 'Chhatrapati Sambhajinagar', locality: 'Garkheda' },
};

export function getAllDistricts(): string[] {
  return MAHARASHTRA_LOCATION_DATA.map((d) => d.district);
}

export function getCityForDistrict(districtName: string): string {
  const found = MAHARASHTRA_LOCATION_DATA.find((d) => d.district.toLowerCase() === districtName.toLowerCase());
  return found ? found.city : districtName;
}

export function getTalukasForDistrict(districtName: string): string[] {
  if (!districtName) return [];
  const found = MAHARASHTRA_LOCATION_DATA.find(
    (d) => d.district.toLowerCase() === districtName.toLowerCase()
  );
  return found ? found.talukas.map((t) => t.name) : [];
}

export function getPlacesForTaluka(districtName: string, talukaName: string): string[] {
  if (!districtName || !talukaName) return [];
  const dist = MAHARASHTRA_LOCATION_DATA.find(
    (d) => d.district.toLowerCase() === districtName.toLowerCase()
  );
  if (!dist) return [];

  const tal = dist.talukas.find(
    (t) => t.name.toLowerCase() === talukaName.toLowerCase()
  );
  return tal ? tal.places : [];
}

export function lookupPinCode(pin: string): PinLocationDetails | null {
  const cleaned = pin.trim();
  if (PIN_CODE_MAPPINGS[cleaned]) {
    const item = PIN_CODE_MAPPINGS[cleaned];
    const availablePlaces = getPlacesForTaluka(item.district, item.taluka);
    return {
      district: item.district,
      taluka: item.taluka,
      place: item.locality,
      city: item.city,
      pincode: cleaned,
      state: 'Maharashtra',
      availablePlaces: availablePlaces.length > 0 ? availablePlaces : [item.locality],
    };
  }
  return null;
}
