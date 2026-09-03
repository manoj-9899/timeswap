import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isValidPincode, findByPincode } = require('@twin.techies/india-pincode');

const DISTRICT_ALIAS_MAP: Record<string, string> = {
  aurangabad: 'Chhatrapati Sambhajinagar',
  osmanabad: 'Dharashiv',
  ahmednagar: 'Ahilyanagar',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get('pin')?.trim();

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { success: false, error: 'Valid 6-digit PIN code required' },
      { status: 400 },
    );
  }

  // 1. Offline high-performance lookup using @twin.techies/india-pincode
  try {
    if (isValidPincode && isValidPincode(pin)) {
      const pinData = findByPincode(pin);
      if (pinData) {
        const rawDist = pinData.district || '';
        const normalizedDist = DISTRICT_ALIAS_MAP[rawDist.toLowerCase()] || rawDist;
        const offices = pinData.offices || [];
        const primaryOffice = offices[0]?.name || normalizedDist;
        const taluka = offices[0]?.taluka || normalizedDist;
        const state = pinData.state || 'Maharashtra';
        const allPlaces = Array.from(
          new Set(offices.map((o: any) => o.name).filter(Boolean)),
        ) as string[];

        return NextResponse.json({
          success: true,
          data: {
            district: normalizedDist,
            taluka: taluka,
            place: primaryOffice,
            city: normalizedDist,
            pincode: pin,
            state: state,
            availablePlaces: allPlaces.length > 0 ? allPlaces : [primaryOffice],
          },
        });
      }
    }
  } catch (err) {
    console.warn('Offline PIN lookup error:', err);
  }

  // 2. Postal PIN API Fallback
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (TimeSwap Maharashtra Platform)',
      },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffices = data[0].PostOffice;
        const primaryPO = postOffices[0];

        const rawDistrict = primaryPO.District || primaryPO.Division || 'Maharashtra';
        const district = DISTRICT_ALIAS_MAP[rawDistrict.toLowerCase()] || rawDistrict;
        const taluka = primaryPO.Block && primaryPO.Block !== 'NA' ? primaryPO.Block : district;
        const place = primaryPO.Name || primaryPO.Block || district;
        const state = primaryPO.State || 'Maharashtra';
        const allPlaces = Array.from(new Set(postOffices.map((p: any) => p.Name).filter(Boolean))) as string[];

        return NextResponse.json({
          success: true,
          data: {
            district,
            taluka,
            place,
            city: district,
            pincode: pin,
            state,
            availablePlaces: allPlaces,
          },
        });
      }
    }
  } catch (err) {
    console.warn('Server-side PIN lookup fetch error:', err);
  }

  return NextResponse.json(
    { success: false, error: 'PIN code details not found' },
    { status: 404 },
  );
}
