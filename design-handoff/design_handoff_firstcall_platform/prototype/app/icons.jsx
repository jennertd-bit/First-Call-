// icons.jsx — functional UI glyphs for the FirstCall owner app.
// Stroke icons sized by a `s` prop; color inherits via currentColor.

const Ic = ({ s = 24, sw = 1.8, children, fill = 'none', style }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconWater  = (p) => <Ic {...p}><path d="M12 3c0 0 6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" strokeWidth="1.4"/></Ic>;
const IconFire   = (p) => <Ic {...p}><path d="M12 3c1 3 4 4.2 4 8a4 4 0 0 1-8 0c0-1.4.6-2.4 1.3-3.2C9 9.4 9.5 10.5 10 11c.2-2.2 1-3.4 2-5Z"/></Ic>;
const IconMold   = (p) => <Ic {...p}><circle cx="8" cy="14" r="3"/><circle cx="15" cy="11" r="2.3"/><circle cx="16" cy="16" r="1.6"/></Ic>;
const IconStorm  = (p) => <Ic {...p}><path d="M7 13a4 4 0 1 1 1-7.9A5 5 0 0 1 18 7a3.5 3.5 0 0 1-.5 7H8"/><path d="M12 14l-2 4h3l-2 4"/></Ic>;
const IconOther  = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5" strokeWidth="2"/></Ic>;

const IconBolt   = (p) => <Ic {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></Ic>;
const IconShield = (p) => <Ic {...p}><path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4" strokeWidth="1.6"/></Ic>;
const IconPhone  = (p) => <Ic {...p}><path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 3Z"/></Ic>;
const IconCamera = (p) => <Ic {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.2"/></Ic>;
const IconPlus   = (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>;
const IconCheck  = (p) => <Ic {...p}><path d="m5 12.5 4.5 4.5L19 7"/></Ic>;
const IconArrow  = (p) => <Ic {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Ic>;
const IconBack   = (p) => <Ic {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Ic>;
const IconClose  = (p) => <Ic {...p}><path d="M6 6l12 12M18 6 6 18"/></Ic>;
const IconStar   = (p) => <Ic {...p} fill="currentColor" sw="0"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/></Ic>;
const IconPin    = (p) => <Ic {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></Ic>;
const IconUser   = (p) => <Ic {...p}><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></Ic>;
const IconUsers  = (p) => <Ic {...p}><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 14c2.4.5 4 2.3 4 5" strokeWidth="1.5"/></Ic>;
const IconHome   = (p) => <Ic {...p}><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></Ic>;
const IconTruck  = (p) => <Ic {...p}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></Ic>;
const IconClock  = (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Ic>;
const IconDoc    = (p) => <Ic {...p}><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 13h6M9.5 16.5h6" strokeWidth="1.5"/></Ic>;
const IconSpark  = (p) => <Ic {...p}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/></Ic>;
const IconVideo  = (p) => <Ic {...p}><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l5-2.5v9L16 14"/></Ic>;
const IconLink   = (p) => <Ic {...p}><path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/></Ic>;
const IconCube   = (p) => <Ic {...p}><path d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z"/><path d="M12 21.5V12M3.2 7 12 12l8.8-5" strokeWidth="1.5"/></Ic>;

const CAUSE_ICONS = { water: IconWater, fire: IconFire, mold: IconMold, storm: IconStorm, other: IconOther };

Object.assign(window, {
  IconWater, IconFire, IconMold, IconStorm, IconOther, IconBolt, IconShield, IconPhone,
  IconCamera, IconPlus, IconCheck, IconArrow, IconBack, IconClose, IconStar, IconPin,
  IconUser, IconUsers, IconHome, IconTruck, IconClock, IconDoc, IconSpark,
  IconVideo, IconLink, IconCube, CAUSE_ICONS,
});
