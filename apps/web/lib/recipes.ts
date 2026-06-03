import type { CauseOfLoss } from "@firstcall/types";

/**
 * T&M recipes: each generated scope/area line is expressed as a bundle of real
 * WrightWay cost-basis items — labor (role × hours), equipment (item × days),
 * and materials (item × qty) — plus an expected timeline. This is what lets the
 * estimate separate the TIME cost from the work+material/equipment cost, and is
 * the substrate the database learns to calibrate against actual jobs.
 *
 * `labor.role`, `equipment.name`, and `materials.name` MUST match
 * `cost_basis_items.name` exactly (resolved server-side via the service role).
 * `xa.keywords` drive the secondary Xactimate anchor: matched XA unit prices are
 * scaled by `xa.unitQty` to a per-line figure, then guarded against the trusted
 * T&M cost before blending into the median.
 */

export type Recipe = {
  labor: { role: string; hours: number }[];
  equipment: { name: string; days: number }[];
  materials: { name: string; qty: number }[];
  /** Expected job duration in days; min/max drive the timeline half of the band. */
  durationDays: { min: number; expected: number; max: number };
  /** Xactimate cross-check: keyword match + assumed quantity to scale per-unit XA. */
  xa: { keywords: string[]; unitQty: number };
};

// Canonical cost-basis names (must exist in cost_basis_items).
const TECH = "Restoration Technician";
const REMED = "Remediation Technician";
const GEN = "General Labor";
const CARP = "Carpenter";
const PAINT = "Painter";
const DRY = "Drywall Installer/Finsisher";
const PM = "Project Manager";
const SUP = "Restoration Supervisor";

const AIR_MOVER = "Fan Air Mover";
const DEHU = "Dehumidifiers Refrigerant (Lgr) Large (150 Cfm)";
const EXTRACTOR = "Portable Flood Extractor";
const SCRUBBER = "Air Scrubber (<1000 Cfm)";
const FOGGER = "Fogger Gas";
const OZONE = "Ozone Generator/Odorox Hydroxyl Unit (Does Not Include Air Mover)";
const HEPACART = "HEPAcart Mobile Containment & Filtration";

const ANTIMICROBIAL = "Antimicrobial Microban Or Equivalent";
const POLY6 = "Plastic Sheeting, 6 mil (20x100)";
const DEODORIZER = "Concentrated Odor Counteractant & Smoke Eliminator";
const FOG_SOLUTION = "Fogging Solution";

/** Cause-of-loss scope recipes, keyed by the scope line code in estimate.ts. */
export const CAUSE_RECIPES: Record<CauseOfLoss, Record<string, Recipe>> = {
  water: {
    "WTR-EXT": {
      labor: [{ role: TECH, hours: 3 }],
      equipment: [
        { name: EXTRACTOR, days: 1 },
        { name: AIR_MOVER, days: 2 },
      ],
      materials: [],
      durationDays: { min: 0.5, expected: 1, max: 1.5 },
      xa: { keywords: ["water extraction"], unitQty: 150 },
    },
    "WTR-DRY": {
      labor: [{ role: TECH, hours: 4 }],
      equipment: [
        { name: AIR_MOVER, days: 9 },
        { name: DEHU, days: 3 },
      ],
      materials: [],
      durationDays: { min: 2, expected: 3, max: 5 },
      xa: { keywords: ["structural drying", "dehumidif"], unitQty: 3 },
    },
    "WTR-AMB": {
      labor: [{ role: TECH, hours: 1.5 }],
      equipment: [{ name: FOGGER, days: 1 }],
      materials: [{ name: ANTIMICROBIAL, qty: 1 }],
      durationDays: { min: 0.25, expected: 0.5, max: 1 },
      xa: { keywords: ["antimicrobial", "apply biocide"], unitQty: 150 },
    },
    "WTR-FLC": {
      labor: [
        { role: DRY, hours: 3 },
        { role: GEN, hours: 2 },
      ],
      equipment: [],
      materials: [{ name: POLY6, qty: 0.25 }],
      durationDays: { min: 0.5, expected: 1, max: 1.5 },
      xa: { keywords: ["drywall", "flood cut", "tear out"], unitQty: 80 },
    },
  },
  fire: {
    "FIR-SOOT": {
      labor: [{ role: TECH, hours: 5 }],
      equipment: [{ name: HEPACART, days: 1 }],
      materials: [{ name: ANTIMICROBIAL, qty: 0.5 }],
      durationDays: { min: 1, expected: 1.5, max: 2.5 },
      xa: { keywords: ["soot", "smoke cleaning", "clean the walls"], unitQty: 150 },
    },
    "FIR-FOG": {
      labor: [{ role: TECH, hours: 2 }],
      equipment: [
        { name: FOGGER, days: 1 },
        { name: OZONE, days: 2 },
      ],
      materials: [{ name: DEODORIZER, qty: 1 }],
      durationDays: { min: 0.5, expected: 1, max: 2 },
      xa: { keywords: ["thermal fog", "deodoriz"], unitQty: 1 },
    },
    "FIR-PACK": {
      labor: [
        { role: GEN, hours: 6 },
        { role: TECH, hours: 2 },
      ],
      equipment: [],
      materials: [],
      durationDays: { min: 1, expected: 2, max: 4 },
      xa: { keywords: ["contents", "pack-out", "pack out"], unitQty: 1 },
    },
    "FIR-CHAR": {
      labor: [
        { role: DRY, hours: 4 },
        { role: GEN, hours: 3 },
      ],
      equipment: [],
      materials: [{ name: POLY6, qty: 0.3 }],
      durationDays: { min: 0.5, expected: 1, max: 2 },
      xa: { keywords: ["charred", "drywall", "insulation"], unitQty: 80 },
    },
  },
  mold: {
    "MLD-CONT": {
      labor: [{ role: REMED, hours: 4 }],
      equipment: [
        { name: HEPACART, days: 2 },
        { name: SCRUBBER, days: 2 },
      ],
      materials: [{ name: POLY6, qty: 0.5 }],
      durationDays: { min: 0.5, expected: 1, max: 2 },
      xa: { keywords: ["containment", "negative air"], unitQty: 1 },
    },
    "MLD-HEPA": {
      labor: [{ role: REMED, hours: 2 }],
      equipment: [{ name: SCRUBBER, days: 3 }],
      materials: [],
      durationDays: { min: 1, expected: 2, max: 3 },
      xa: { keywords: ["hepa", "air scrub"], unitQty: 3 },
    },
    "MLD-REM": {
      labor: [
        { role: REMED, hours: 5 },
        { role: GEN, hours: 3 },
      ],
      equipment: [],
      materials: [{ name: ANTIMICROBIAL, qty: 0.5 }],
      durationDays: { min: 1, expected: 2, max: 3 },
      xa: { keywords: ["mold remediation", "remove mold"], unitQty: 100 },
    },
    "MLD-ENC": {
      labor: [{ role: REMED, hours: 2 }],
      equipment: [{ name: FOGGER, days: 1 }],
      materials: [{ name: ANTIMICROBIAL, qty: 1 }],
      durationDays: { min: 0.25, expected: 0.5, max: 1 },
      xa: { keywords: ["encapsulat", "antimicrobial"], unitQty: 150 },
    },
  },
  storm: {
    "STM-BRD": {
      labor: [
        { role: CARP, hours: 4 },
        { role: GEN, hours: 3 },
      ],
      equipment: [],
      materials: [{ name: POLY6, qty: 1 }],
      durationDays: { min: 0.5, expected: 1, max: 2 },
      xa: { keywords: ["board up", "board-up", "roof tarp", "tarp"], unitQty: 1 },
    },
    "STM-DEB": {
      labor: [{ role: GEN, hours: 6 }],
      equipment: [],
      materials: [],
      durationDays: { min: 0.5, expected: 1, max: 2 },
      xa: { keywords: ["debris removal", "haul"], unitQty: 1 },
    },
    "STM-MIT": {
      labor: [{ role: TECH, hours: 4 }],
      equipment: [
        { name: AIR_MOVER, days: 6 },
        { name: DEHU, days: 2 },
      ],
      materials: [],
      durationDays: { min: 1, expected: 2, max: 4 },
      xa: { keywords: ["water mitigation", "structural drying"], unitQty: 150 },
    },
    "STM-DRY": {
      labor: [
        { role: DRY, hours: 3 },
        { role: GEN, hours: 2 },
      ],
      equipment: [],
      materials: [{ name: POLY6, qty: 0.25 }],
      durationDays: { min: 0.5, expected: 1, max: 1.5 },
      xa: { keywords: ["drywall", "tear out", "remove"], unitQty: 80 },
    },
  },
  other: {
    "OTH-ASMT": {
      labor: [{ role: PM, hours: 2 }],
      equipment: [],
      materials: [],
      durationDays: { min: 0.25, expected: 0.5, max: 1 },
      xa: { keywords: ["assessment", "inspection", "make safe"], unitQty: 1 },
    },
    "OTH-LAB": {
      labor: [
        { role: GEN, hours: 4 },
        { role: SUP, hours: 1 },
      ],
      equipment: [],
      materials: [],
      durationDays: { min: 0.5, expected: 1, max: 2 },
      xa: { keywords: ["general labor", "mitigation labor"], unitQty: 1 },
    },
  },
};

/** Per-area finish recipes, keyed by the area line code in estimate.ts. */
export const AREA_RECIPES: Record<string, Recipe> = {
  "KIT-CAB": {
    labor: [{ role: CARP, hours: 8 }],
    equipment: [],
    materials: [],
    durationDays: { min: 1, expected: 2, max: 3 },
    xa: { keywords: ["cabinet", "countertop"], unitQty: 1 },
  },
  "KIT-FLR": {
    labor: [{ role: CARP, hours: 5 }],
    equipment: [],
    materials: [],
    durationDays: { min: 0.5, expected: 1, max: 2 },
    xa: { keywords: ["flooring", "floor replace"], unitQty: 120 },
  },
  "BTH-TILE": {
    labor: [{ role: CARP, hours: 6 }],
    equipment: [],
    materials: [],
    durationDays: { min: 1, expected: 1.5, max: 2.5 },
    xa: { keywords: ["tile", "fixture"], unitQty: 50 },
  },
  "BED-CRP": {
    labor: [{ role: GEN, hours: 3 }],
    equipment: [],
    materials: [],
    durationDays: { min: 0.5, expected: 1, max: 1.5 },
    xa: { keywords: ["carpet", "pad"], unitQty: 140 },
  },
  "BED-PNT": {
    labor: [{ role: PAINT, hours: 4 }],
    equipment: [],
    materials: [],
    durationDays: { min: 0.5, expected: 1, max: 1.5 },
    xa: { keywords: ["paint", "repaint"], unitQty: 140 },
  },
  "LIV-FLR": {
    labor: [{ role: CARP, hours: 6 }],
    equipment: [],
    materials: [],
    durationDays: { min: 0.5, expected: 1, max: 2 },
    xa: { keywords: ["flooring", "refinish"], unitQty: 220 },
  },
  "LIV-PNT": {
    labor: [{ role: PAINT, hours: 5 }],
    equipment: [],
    materials: [],
    durationDays: { min: 0.5, expected: 1, max: 1.5 },
    xa: { keywords: ["paint", "repaint"], unitQty: 220 },
  },
  "CLG-DRY": {
    labor: [{ role: DRY, hours: 4 }],
    equipment: [],
    materials: [],
    durationDays: { min: 0.5, expected: 1, max: 1.5 },
    xa: { keywords: ["ceiling", "drywall", "texture"], unitQty: 200 },
  },
  "FLR-SUB": {
    labor: [{ role: TECH, hours: 3 }],
    equipment: [{ name: AIR_MOVER, days: 3 }],
    materials: [],
    durationDays: { min: 1, expected: 2, max: 3 },
    xa: { keywords: ["subfloor", "floor drying"], unitQty: 200 },
  },
};
