import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flane Battle - Radar Warfare',
  description: 'Turn-based airplane battle game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-black text-green-500 overflow-x-hidden selection:bg-green-900 selection:text-green-100">
        <main className="container mx-auto p-4 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  )
}
