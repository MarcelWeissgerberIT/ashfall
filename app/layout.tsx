import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const sans=Geist({variable:'--font-geist-sans',subsets:['latin']});
const mono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
export const metadata: Metadata={title:'ASHFALL — Dead Sector',description:'Drei Sektoren. Eine letzte Chance. Ein isometrisches Zombie-Survival-Spiel mit Erkundung, Beute und Bunkern.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
