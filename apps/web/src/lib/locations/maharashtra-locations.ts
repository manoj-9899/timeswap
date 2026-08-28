import {
  PinLocationDetails,
  lookupPinCode,
  MAHARASHTRA_LOCATION_DATA,
  getTalukasForDistrict,
  getPlacesForTaluka,
  getCityForDistrict,
} from '@timeswap/contracts';

export * from '@timeswap/contracts';

export async function lookupPinCodeAsync(
  pin: string
): Promise<PinLocationDetails | null> {
  const cleaned = pin.trim();
  if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) return null;

  // 1. Check fast local mapping first
  const localMatch = lookupPinCode(cleaned);
  if (localMatch) {
    return localMatch;
  }

  // 2. Fetch via internal API proxy
  try {
    const res = await fetch(`/api/locations/pincode?pin=${cleaned}`);
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        const distMatch = MAHARASHTRA_LOCATION_DATA.find(
          (d) => d.district.toLowerCase() === data.district.toLowerCase() || d.city.toLowerCase() === data.city.toLowerCase()
        );
        const resolvedDistrict = distMatch ? distMatch.district : data.district;

        let resolvedTaluka = data.taluka;
        const validTalukas = getTalukasForDistrict(resolvedDistrict);
        if (validTalukas.length > 0) {
          const talMatch = validTalukas.find(
            (t) => t.toLowerCase() === data.taluka.toLowerCase()
          );
          if (talMatch) {
            resolvedTaluka = talMatch;
          } else {
            resolvedTaluka = validTalukas[0];
          }
        }

        let resolvedPlace = data.place;
        const validPlaces = getPlacesForTaluka(resolvedDistrict, resolvedTaluka);
        if (validPlaces.length > 0) {
          const placeMatch = validPlaces.find(
            (p) => p.toLowerCase() === data.place.toLowerCase()
          );
          if (placeMatch) {
            resolvedPlace = placeMatch;
          }
        }

        return {
          district: resolvedDistrict,
          taluka: resolvedTaluka,
          place: resolvedPlace,
          city: getCityForDistrict(resolvedDistrict),
          pincode: cleaned,
          state: data.state || 'Maharashtra',
          availablePlaces: validPlaces.length > 0 ? validPlaces : data.availablePlaces || [resolvedPlace],
        };
      }
    }
  } catch (err) {
    console.warn('Internal PIN proxy lookup error:', err);
  }

  return null;
}
