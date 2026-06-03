// web/data.jsx — shared seed data for Surfaces B (PM Portal) & C (CRM)
// Placeholder data for a demo condo association serviced by one restoration tenant.

const PROPERTY = { name: 'Harborview Condominiums', units: 100, address: '4200 Marina Blvd' };

// Default coverage responsibilities (editable per policy). Each line can sit in master or ho6.
const COVERAGE_DEFAULTS = {
  master: [
    'Building envelope & exterior',
    'Drywall / structure-in',
    'Communal spaces & corridors',
    'Shared mechanicals (HVAC, plumbing stacks)',
    'Roof & waterproofing',
  ],
  ho6: [
    'Paint & wall texture',
    'Trim & interior finishes',
    'Flooring & carpet pad',
    'Cabinetry & countertops',
    'Fixtures & betterments',
  ],
};

const OWNER_NAMES = ['A. Okafor', 'M. Reyes', 'J. Pearson', 'L. Chen', 'D. Whitfield', 'S. Kowalski',
  'R. Nguyen', 'T. Abara', 'K. Bauer', 'P. Salib', 'C. Donovan', 'E. Marsh', 'V. Idris', 'N. Holt',
  'B. Castellano', 'G. Mwangi', 'H. Petrova', 'F. Adeyemi', 'O. Lindqvist', 'W. Tanaka'];

// Generate a 40-unit grid with HO6 status (mostly verified, some pending, few none).
function makeUnits() {
  const statuses = {}; // seed a few non-verified
  const pending = new Set([7, 12, 18, 23, 31, 36]);
  const none = new Set([3, 27]);
  const out = [];
  for (let i = 1; i <= 40; i++) {
    let ho6 = 'verified';
    if (pending.has(i)) ho6 = 'pending';
    if (none.has(i)) ho6 = 'none';
    const num = String(i).padStart(2, '0');
    out.push({
      id: i, num, ho6,
      owner: OWNER_NAMES[(i * 3) % OWNER_NAMES.length],
      floor: Math.ceil(i / 8),
      activeClaim: i === 18 || i === 7,
    });
  }
  return out;
}
const UNITS = makeUnits();

const CLAIMS = [
  { id: 'CLM-2041', unit: '18', cause: 'Water', owner: 'F. Adeyemi', ho6: 'pending', opened: '2h ago', stage: 'On-site' },
  { id: 'CLM-2039', unit: '07', cause: 'Water', owner: 'R. Nguyen', ho6: 'pending', opened: '5h ago', stage: 'Dispatched' },
  { id: 'CLM-2036', unit: '24', cause: 'Storm', owner: 'L. Chen', ho6: 'verified', opened: 'Yesterday', stage: 'Estimate' },
];

// CRM dispatch jobs (kanban). value in dollars.
const JOBS = [
  { id: 'J-2048', unit: '31', cause: 'Water', owner: 'C. Donovan', value: 4200, stage: 'new', eta: '—', conf: 'Med' },
  { id: 'J-2047', unit: '12', cause: 'Mold', owner: 'A. Okafor', value: 6800, stage: 'new', eta: '—', conf: 'High' },
  { id: 'J-2046', unit: '03', cause: 'Fire', owner: 'J. Pearson', value: 18400, stage: 'new', eta: '—', conf: 'Low' },
  { id: 'J-2044', unit: '07', cause: 'Water', owner: 'R. Nguyen', value: 5600, stage: 'dispatched', eta: '32m', conf: 'High' },
  { id: 'J-2043', unit: '22', cause: 'Storm', owner: 'T. Abara', value: 9100, stage: 'dispatched', eta: '1h', conf: 'Med' },
  { id: 'J-2041', unit: '18', cause: 'Water', owner: 'F. Adeyemi', value: 6604, stage: 'onsite', eta: 'On-site', conf: 'High' },
  { id: 'J-2040', unit: '36', cause: 'Water', owner: 'B. Castellano', value: 3300, stage: 'onsite', eta: 'On-site', conf: 'Med' },
  { id: 'J-2038', unit: '24', cause: 'Storm', owner: 'L. Chen', value: 11200, stage: 'estimate', eta: '—', conf: 'High' },
  { id: 'J-2037', unit: '09', cause: 'Fire', owner: 'K. Bauer', value: 22800, stage: 'estimate', eta: '—', conf: 'Med' },
  { id: 'J-2031', unit: '15', cause: 'Water', owner: 'P. Salib', value: 7400, stage: 'signed', eta: '✓', conf: 'High' },
  { id: 'J-2029', unit: '02', cause: 'Mold', owner: 'M. Reyes', value: 5900, stage: 'signed', eta: '✓', conf: 'High' },
];

const PIPELINE = [
  { id: 'new', label: 'New' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'onsite', label: 'On-site' },
  { id: 'estimate', label: 'Estimate' },
  { id: 'signed', label: 'Signed' },
];

const CAUSE_TINT = {
  Water: { c: '#2A6FDB', bg: 'rgba(42,111,219,0.12)' },
  Fire: { c: '#CC5A28', bg: 'rgba(204,90,40,0.12)' },
  Mold: { c: '#1F8A5B', bg: 'rgba(31,138,91,0.12)' },
  Storm: { c: '#7A5AE0', bg: 'rgba(122,90,224,0.12)' },
  Other: { c: '#6E7A86', bg: 'rgba(110,122,134,0.12)' },
};

window.DATA = { PROPERTY, COVERAGE_DEFAULTS, UNITS, CLAIMS, JOBS, PIPELINE, CAUSE_TINT, OWNER_NAMES };
