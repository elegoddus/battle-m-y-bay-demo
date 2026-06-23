import type { Metadata } from 'next'
import { Comfortaa } from 'next/font/google'
import './globals.css'

const comfortaa = Comfortaa({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'counting shleep',
  description: 'Relax and count some cozy sheep.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${comfortaa.className} min-h-screen bg-black text-slate-100 overflow-x-hidden selection:bg-indigo-900 selection:text-indigo-100 antialiased`}>
        {/* Vignette overlay for dreamy atmospheric focus */}
        <div className="vignette" />
        
        {/* Full-width container */}
        <main className="relative z-10 min-h-screen w-full flex flex-col justify-between">
          {children}
        </main>
      </body>
    </html>
  )
}
