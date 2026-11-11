import type { ReactNode } from 'react';

export type IconName = 'grid'|'building'|'files'|'calculator'|'ticket'|'users'|'arrow'|'external'|'lock'|'info'|'check'|'clock'|'layers'|'image'|'video'|'folder'|'search'|'chart'|'shield'|'link'|'home'|'chevron'|'menu'|'close'|'plus'|'checkcircle'|'spark'|'settings'|'filetext'|'filter';
const shapes: Record<IconName,ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M9 22v-5h6v5M8 6h2m4 0h2M8 10h2m4 0h2M8 14h2m4 0h2"/></>,
  files: <><rect x="7" y="4" width="14" height="17" rx="2"/><path d="M17 4V3a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v13a1 1 0 0 0 1 1h3M11 10h6m-6 4h6m-6 4h3"/></>,
  calculator: <><rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="6" width="8" height="4" rx=".5"/><path d="M8 14h2m4 0h2m-8 4h2m4 0h2"/></>,
  ticket: <><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6Z"/><path d="M12 4v3m0 3v4m0 3v3"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6m2 4a5 5 0 0 1 2 4"/></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  external: <><path d="M12 5h7v7M19 5l-9 9"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9v.5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  layers: <><path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></>,
  folder: <><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></>,
  search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
  chart: <><path d="M4 20V5m0 15h17M7 15l4-5 4 3 5-8"/></>,
  shield: <><path d="m12 2 8 4v6c0 6-4 9-8 10-4-1-8-4-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></>,
  home: <><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  close: <path d="M5 5l14 14M19 5 5 19"/>,
  plus: <path d="M12 4v16M4 12h16"/>,
  checkcircle: <><circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/></>,
  spark: <><path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .9 1.5-2 2-.9-.5a7 7 0 0 1-2.5 1v2h-4v-2a7 7 0 0 1-2.5-1l-1 .5-2-2L6.2 15a7 7 0 0 1 0-3l-1.5-.9 2-2 1.5.5a7 7 0 0 1 2.5-1v-2h4v2a7 7 0 0 1 2.5 1l1.5-.5 2 2-1.3.9a7 7 0 0 1 0 3Z"/></>,
  filetext: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7Z"/><path d="M13 2v7h7M8 13h8M8 17h8"/></>,
  filter: <><path d="M4 4h16l-6 8v7l-4 2v-9L4 4Z"/></>,
};
export function Icon({name,size=20,className=''}:{name:IconName,size?:number,className?:string}) {
  return <svg className={className} aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>;
}
