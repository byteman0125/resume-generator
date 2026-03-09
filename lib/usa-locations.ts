/**
 * USA locations for profile form: states and cities by state.
 * Cities are loaded from static JSON to keep bundle small.
 */

export interface UsaState {
  code: string;
  name: string;
}

export const US_STATES: UsaState[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/** Cities by state code (loaded from JSON). */
export type CitiesByState = Record<string, string[]>;

let citiesCache: CitiesByState | null = null;

/** Get cities for a state code. Loads from data/usa-cities.json once. */
export async function getCitiesForState(stateCode: string): Promise<string[]> {
  if (!citiesCache) {
    try {
      const res = await fetch("/api/usa-cities");
      if (res.ok) citiesCache = await res.json();
      else citiesCache = {};
    } catch {
      citiesCache = {};
    }
  }
  const list = citiesCache![stateCode];
  return Array.isArray(list) ? [...list].sort((a, b) => a.localeCompare(b)) : [];
}

/** Sync version for use with preloaded data (e.g. in form). */
export function getCitiesForStateSync(
  stateCode: string,
  citiesByState: CitiesByState
): string[] {
  const list = citiesByState[stateCode];
  return Array.isArray(list) ? [...list].sort((a, b) => a.localeCompare(b)) : [];
}
