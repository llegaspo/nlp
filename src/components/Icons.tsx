import type {CSSProperties} from 'react';
const paths: Record<string,string> = {
  sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon:'M20.8 13a9 9 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z',
  book:'M4 4h6c1.3 0 2 .7 2 2v15c0-1.3-.7-2-2-2H4V4Zm16 0h-6c-1.3 0-2 .7-2 2v15c0-1.3.7-2 2-2h6V4Z',
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  arrow:'M4 12h16m-6-6 6 6-6 6',
  search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  check:'M5 12l4 4L19 6',
  clock:'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  flask:'M9 3h6m-5 0v6l-6 10c-.6 1 .1 2 1.3 2h13.4c1.2 0 1.9-1 1.3-2L14 9V3M7 15h10',
  menu:'M4 6h16M4 12h16M4 18h16',
  close:'M6 6l12 12M18 6 6 18',
  link:'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
  external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
  spark:'m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z',
};
export default function Icon({name,size=20,style}:{name:string;size?:number;style?:CSSProperties}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]||paths.book}/></svg>;
}
