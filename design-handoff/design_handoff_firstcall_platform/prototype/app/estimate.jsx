// estimate.jsx — FirstCall ballpark engine + shared data.
// Raw labor+materials+equipment is assembled per cause-of-loss and per affected
// area, then a tenant O&P tier is applied to produce a ballpark + range.
// All numbers are illustrative placeholders, never a quote.

const CAUSES = [
  { id: 'water', label: 'Water', sub: 'leak · flood · burst pipe' },
  { id: 'fire',  label: 'Fire',  sub: 'smoke · soot · char' },
  { id: 'mold',  label: 'Mold',  sub: 'growth · moisture' },
  { id: 'storm', label: 'Storm', sub: 'wind · roof · debris' },
  { id: 'other', label: 'Other', sub: 'tell us more' },
];

// Mitigation scope per cause. perArea items scale with # of affected areas.
const CAUSE_SCOPE = {
  water: [
    { label: 'Emergency water extraction',            raw: 460, perArea: true,  bucket: 'master' },
    { label: 'Structural drying — air movers + dehu', raw: 720, perArea: false, bucket: 'master', note: '3 drying days · IICRC S500' },
    { label: 'Antimicrobial application',             raw: 190, perArea: true,  bucket: 'master' },
    { label: 'Drywall flood-cut & removal',           raw: 280, perArea: true,  bucket: 'master' },
  ],
  fire: [
    { label: 'Soot & smoke surface cleaning',         raw: 540, perArea: true,  bucket: 'master' },
    { label: 'Thermal fogging & deodorization',       raw: 430, perArea: false, bucket: 'master' },
    { label: 'Contents pack-out & cleaning',          raw: 610, perArea: false, bucket: 'ho6' },
    { label: 'Charred drywall & insulation removal',  raw: 320, perArea: true,  bucket: 'master' },
  ],
  mold: [
    { label: 'Containment & negative air setup',      raw: 480, perArea: false, bucket: 'master', note: 'IICRC S520' },
    { label: 'HEPA air scrubbing',                    raw: 360, perArea: false, bucket: 'master' },
    { label: 'Mold remediation & removal',            raw: 410, perArea: true,  bucket: 'master' },
    { label: 'Antimicrobial / encapsulation',         raw: 220, perArea: true,  bucket: 'master' },
  ],
  storm: [
    { label: 'Emergency board-up & roof tarp',        raw: 560, perArea: false, bucket: 'master' },
    { label: 'Debris removal & haul-off',             raw: 340, perArea: false, bucket: 'master' },
    { label: 'Water mitigation & drying',             raw: 620, perArea: true,  bucket: 'master' },
    { label: 'Structural drywall removal',            raw: 290, perArea: true,  bucket: 'master' },
  ],
  other: [
    { label: 'On-site assessment & make-safe',        raw: 380, perArea: false, bucket: 'master' },
    { label: 'General mitigation labor',              raw: 300, perArea: true,  bucket: 'master' },
  ],
};

// Affected areas → finish/restoration line items (mostly HO6 / owner side).
const AREAS = [
  { id: 'kitchen',  label: 'Kitchen',     items: [
    { label: 'Cabinet & countertop restoration', raw: 980, bucket: 'ho6' },
    { label: 'Kitchen flooring replacement',      raw: 640, bucket: 'ho6' } ] },
  { id: 'bath',     label: 'Bathroom',    items: [
    { label: 'Tile & fixture restoration',        raw: 720, bucket: 'ho6' } ] },
  { id: 'bedroom',  label: 'Bedroom',     items: [
    { label: 'Carpet & pad replacement',          raw: 520, bucket: 'ho6' },
    { label: 'Repaint walls & trim',              raw: 360, bucket: 'ho6' } ] },
  { id: 'living',   label: 'Living room', items: [
    { label: 'Flooring refinish',                 raw: 600, bucket: 'ho6' },
    { label: 'Repaint walls & trim',              raw: 420, bucket: 'ho6' } ] },
  { id: 'ceiling',  label: 'Ceilings',    items: [
    { label: 'Ceiling drywall & texture',         raw: 470, bucket: 'master' } ] },
  { id: 'flooring', label: 'Flooring',    items: [
    { label: 'Subfloor drying & treatment',       raw: 540, bucket: 'master' } ] },
];

const OP_TIERS = { '10/10': 0.20, '15/15': 0.30, '20/20': 0.40 };

function fmt(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

// Assemble the estimate from inputs.
function buildEstimate({ cause = 'water', areas = [], photoCount = 0, opTier = '15/15' }) {
  const nAreas = Math.max(1, areas.length);
  const scope = CAUSE_SCOPE[cause] || CAUSE_SCOPE.other;
  const items = [];

  scope.forEach((s) => {
    const qty = s.perArea ? nAreas : 1;
    items.push({
      label: s.label,
      note: s.note,
      qty,
      unitRaw: s.raw,
      raw: s.raw * qty,
      bucket: s.bucket,
    });
  });

  areas.forEach((aid) => {
    const a = AREAS.find((x) => x.id === aid);
    if (!a) return;
    a.items.forEach((it) => {
      items.push({ label: it.label, qty: 1, unitRaw: it.raw, raw: it.raw, bucket: it.bucket, area: a.label });
    });
  });

  const rawSubtotal = items.reduce((s, it) => s + it.raw, 0);
  const opRate = OP_TIERS[opTier] ?? 0.30;
  const markup = rawSubtotal * opRate;            // combined overhead + profit
  const overhead = markup / 2;
  const profit = markup / 2;
  const ballpark = rawSubtotal + markup;

  // Confidence widens the range. More photos + clearer scope = tighter band.
  const conf = photoCount >= 5 ? 'High' : photoCount >= 2 ? 'Medium' : 'Low';
  const band = conf === 'High' ? 0.10 : conf === 'Medium' ? 0.16 : 0.24;

  const masterRaw = items.filter((i) => i.bucket === 'master').reduce((s, i) => s + i.raw, 0);
  const ho6Raw = rawSubtotal - masterRaw;

  return {
    items,
    rawSubtotal,
    opTier, opRate, overhead, profit, markup,
    ballpark,
    low: ballpark * (1 - band),
    high: ballpark * (1 + band),
    confidence: conf,
    masterShare: masterRaw + markup * (masterRaw / rawSubtotal || 0),
    ho6Share: ho6Raw + markup * (ho6Raw / rawSubtotal || 0),
  };
}

window.FC = { CAUSES, AREAS, CAUSE_SCOPE, OP_TIERS, fmt, buildEstimate };
