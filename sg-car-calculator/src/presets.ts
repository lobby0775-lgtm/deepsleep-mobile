import { COE_LATEST, type CoeCategory, type Fuel, type VesBand } from './calc/defaults';

export interface CarPreset {
  id: string;
  label: string;
  dealerPrice: number;
  omv: number;
  category: CoeCategory;
  fuel: Fuel;
  vesBand: VesBand;
  engineCc: number;
  powerKW: number;
}

/**
 * Illustrative cars, not real models: numbers are typical of each segment so
 * the calculators open with something sensible. Users replace them with their quote.
 */
export const PRESETS: CarPreset[] = [
  { id: 'a-petrol', label: 'Cat A petrol sedan', dealerPrice: 209_999, omv: 22_000, category: 'A', fuel: 'petrol', vesBand: 'C1', engineCc: 1496, powerKW: 90 },
  { id: 'a-hybrid', label: 'Cat A hybrid hatch', dealerPrice: 214_999, omv: 26_000, category: 'A', fuel: 'hybrid', vesBand: 'B', engineCc: 1490, powerKW: 85 },
  { id: 'a-ev', label: 'Cat A electric', dealerPrice: 199_999, omv: 32_000, category: 'A', fuel: 'ev', vesBand: 'A', engineCc: 0, powerKW: 100 },
  { id: 'b-suv', label: 'Cat B premium SUV', dealerPrice: 299_999, omv: 45_000, category: 'B', fuel: 'petrol', vesBand: 'C2', engineCc: 1998, powerKW: 150 },
];

export const coeFor = (c: CoeCategory) => COE_LATEST[c];
