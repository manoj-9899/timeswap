import { NextResponse } from 'next/server';
import { PIN_CODE_MAPPINGS } from '@/lib/locations/maharashtra-locations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get('pin')?.trim();

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { success: false, error: 'Valid 6-digit PIN code required' },
      { status: 400 }
    );
  }

  // 1. Check local fast mapping
  if (PIN_CODE_MAPPINGS[pin]) {
    const item = PIN_CODE_MAPPINGS[pin];
    return NextResponse.json({
      success: true,
      data: {
        district: item.district,
        taluka: item.district,
        place: item.locality,
        city: item.city,
        pincode: pin,
        state: 'Maharashtra',
        availablePlaces: [item.locality],
      },
    });
  }

  // 2. Fetch server-side from Postal PIN API (avoids CORS & AdBlocker issues)
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (TimeSwap Maharashtra Platform)',
      },
      next: { revalidate: 86400 }, // Cache server-side for 24h
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffices = data[0].PostOffice;
        const primaryPO = postOffices[0];

        const district = primaryPO.District || primaryPO.Division || 'Maharashtra';
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
    { success: false, error: 'PIN code not found in database' },
    { status: 404 }
  );
}
