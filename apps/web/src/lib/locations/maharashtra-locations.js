"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupPinCodeAsync = lookupPinCodeAsync;
const contracts_1 = require("@timeswap/contracts");
__exportStar(require("@timeswap/contracts"), exports);
async function lookupPinCodeAsync(pin) {
    const cleaned = pin.trim();
    if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned))
        return null;
    const localMatch = (0, contracts_1.lookupPinCode)(cleaned);
    if (localMatch) {
        return localMatch;
    }
    try {
        const res = await fetch(`/api/locations/pincode?pin=${cleaned}`);
        if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
                const data = result.data;
                const distMatch = contracts_1.MAHARASHTRA_LOCATION_DATA.find((d) => d.district.toLowerCase() === data.district.toLowerCase() || d.city.toLowerCase() === data.city.toLowerCase());
                const resolvedDistrict = distMatch ? distMatch.district : data.district;
                let resolvedTaluka = data.taluka;
                const validTalukas = (0, contracts_1.getTalukasForDistrict)(resolvedDistrict);
                if (validTalukas.length > 0) {
                    const talMatch = validTalukas.find((t) => t.toLowerCase() === data.taluka.toLowerCase());
                    if (talMatch) {
                        resolvedTaluka = talMatch;
                    }
                    else {
                        resolvedTaluka = validTalukas[0];
                    }
                }
                let resolvedPlace = data.place;
                const validPlaces = (0, contracts_1.getPlacesForTaluka)(resolvedDistrict, resolvedTaluka);
                if (validPlaces.length > 0) {
                    const placeMatch = validPlaces.find((p) => p.toLowerCase() === data.place.toLowerCase());
                    if (placeMatch) {
                        resolvedPlace = placeMatch;
                    }
                }
                return {
                    district: resolvedDistrict,
                    taluka: resolvedTaluka,
                    place: resolvedPlace,
                    city: (0, contracts_1.getCityForDistrict)(resolvedDistrict),
                    pincode: cleaned,
                    state: data.state || 'Maharashtra',
                    availablePlaces: validPlaces.length > 0 ? validPlaces : data.availablePlaces || [resolvedPlace],
                };
            }
        }
    }
    catch (err) {
        console.warn('Internal PIN proxy lookup error:', err);
    }
    return null;
}
//# sourceMappingURL=maharashtra-locations.js.map