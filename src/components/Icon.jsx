// Simple icon set — inline SVG, all 20x20, currentColor
const paths = {
  dashboard: (<>
    <rect x="2.5" y="2.5" width="6" height="8" rx="1.2" />
    <rect x="2.5" y="12.5" width="6" height="5" rx="1.2" />
    <rect x="11.5" y="2.5" width="6" height="5" rx="1.2" />
    <rect x="11.5" y="9.5" width="6" height="8" rx="1.2" />
  </>),
  plus: <path d="M10 4v12M4 10h12" />,
  export: (<>
    <path d="M10 2.5v10M6 6.5l4-4 4 4" />
    <path d="M3.5 13v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" />
  </>),
  folder: <path d="M2.5 5.5a1 1 0 0 1 1-1h3.5l1.5 1.5h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" />,
  wallet: (<>
    <path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h11a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z" />
    <path d="M13.5 10.5h2" />
    <path d="M3 8h14" />
  </>),
  trending: (<>
    <path d="M3 14l4-5 3 3 5-7" />
    <path d="M11 5h4v4" />
  </>),
  layers: (<>
    <path d="M10 2.5l7 3.5-7 3.5-7-3.5z" />
    <path d="M3 10l7 3.5 7-3.5" />
    <path d="M3 14l7 3.5 7-3.5" />
  </>),
  bitcoin: (<>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M8 6.5v7M8 6.5h3.5a1.75 1.75 0 0 1 0 3.5H8M8 10h4a1.75 1.75 0 0 1 0 3.5H8" />
    <path d="M9.5 5v1.5M11 5v1.5M9.5 13.5v1.5M11 13.5v1.5" />
  </>),
  grid: (<>
    <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
    <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
    <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
    <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
  </>),
  chevron_right: <path d="M8 5l5 5-5 5" />,
  chevron_down: <path d="M5 8l5 5 5-5" />,
  sun: (<>
    <circle cx="10" cy="10" r="3.5" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4" />
  </>),
  moon: <path d="M15.5 11.5A6 6 0 1 1 8.5 4.5a5 5 0 0 0 7 7z" />,
  sidebar: (<>
    <rect x="2.5" y="3.5" width="15" height="13" rx="1.5" />
    <path d="M7.5 3.5v13" />
  </>),
  copy: (<>
    <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" />
    <path d="M13.5 6.5V4.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
  </>),
  download: (<>
    <path d="M10 3v10M6 9l4 4 4-4" />
    <path d="M3.5 14.5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2" />
  </>),
  github: <path d="M10 2.5a7.5 7.5 0 0 0-2.37 14.61c.37.07.5-.16.5-.36v-1.27c-2.07.45-2.5-1-2.5-1a1.97 1.97 0 0 0-.83-1.1c-.67-.46.05-.45.05-.45a1.56 1.56 0 0 1 1.14.77 1.59 1.59 0 0 0 2.17.62 1.6 1.6 0 0 1 .47-1c-1.65-.19-3.39-.83-3.39-3.7a2.9 2.9 0 0 1 .77-2 2.7 2.7 0 0 1 .07-2s.63-.2 2.07.77a7.14 7.14 0 0 1 3.77 0c1.44-.97 2.07-.77 2.07-.77a2.7 2.7 0 0 1 .07 2 2.9 2.9 0 0 1 .77 2c0 2.88-1.74 3.51-3.4 3.7a1.78 1.78 0 0 1 .51 1.38v2.05c0 .2.13.44.5.36A7.5 7.5 0 0 0 10 2.5z" />,
  trash: (<>
    <path d="M4 6h12M8 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
    <path d="M5.5 6l.8 10a1 1 0 0 0 1 1h5.4a1 1 0 0 0 1-1l.8-10" />
  </>),
  check: <path d="M4 10l4 4 8-8" />,
  calendar: (<>
    <rect x="3" y="4.5" width="14" height="12" rx="1.5" />
    <path d="M3 8h14M7 3v3M13 3v3" />
  </>),
  refresh: (<>
    <path d="M3.5 10a6.5 6.5 0 0 1 11-4.5l2 2" />
    <path d="M16.5 3v4h-4" />
    <path d="M16.5 10a6.5 6.5 0 0 1-11 4.5l-2-2" />
    <path d="M3.5 17v-4h4" />
  </>),
  doc: (<>
    <path d="M5 2.5h6l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
    <path d="M11 2.5v4h4" />
    <path d="M7 10h6M7 13h6M7 7h2" />
  </>),
  sparkles: (<>
    <path d="M10 3l1.3 3.7L15 8l-3.7 1.3L10 13l-1.3-3.7L5 8l3.7-1.3z" />
    <path d="M15.5 13l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" />
  </>),
  close: <path d="M5 5l10 10M15 5L5 15" />,
  home: (<>
    <path d="M3 9l7-6 7 6" />
    <path d="M5 8v8.5h10V8" />
    <path d="M8.5 16.5v-4h3v4" />
  </>),
  settings: (<>
    <circle cx="10" cy="10" r="2.5" />
    <path d="M16.5 10c0 .5-.1 1-.2 1.5l1.4 1.1a.5.5 0 0 1 .1.6l-1.3 2.3a.5.5 0 0 1-.6.2l-1.7-.7c-.4.3-.9.6-1.4.8l-.3 1.8a.5.5 0 0 1-.5.4h-2.6a.5.5 0 0 1-.5-.4l-.3-1.8c-.5-.2-1-.5-1.4-.8l-1.7.7a.5.5 0 0 1-.6-.2l-1.3-2.3a.5.5 0 0 1 .1-.6l1.4-1.1c-.1-.5-.2-1-.2-1.5s.1-1 .2-1.5L3.7 7.4a.5.5 0 0 1-.1-.6l1.3-2.3a.5.5 0 0 1 .6-.2l1.7.7c.4-.3.9-.6 1.4-.8l.3-1.8a.5.5 0 0 1 .5-.4h2.6a.5.5 0 0 1 .5.4l.3 1.8c.5.2 1 .5 1.4.8l1.7-.7a.5.5 0 0 1 .6.2l1.3 2.3a.5.5 0 0 1-.1.6l-1.4 1.1c.1.5.2 1 .2 1.5z" />
  </>),
  users: (<>
    <circle cx="7" cy="7.5" r="3" />
    <path d="M2 17c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
    <path d="M13 8.5a2.5 2.5 0 1 0 0-5" />
    <path d="M14 12.5c2 .3 4 2 4 4.5" />
  </>),
  archive: (<>
    <rect x="2.5" y="4" width="15" height="4" rx="1" />
    <path d="M3.5 8v7.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V8" />
    <path d="M8 11h4" />
  </>),
  upload: (<>
    <path d="M10 13V3M6 7l4-4 4 4" />
    <path d="M3.5 13v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" />
  </>),
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.6 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name] || null}
    </svg>
  );
}
