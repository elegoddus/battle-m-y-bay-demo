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
        
        {/* Portrait Warning Overlay */}
        <div className="portrait-warning fixed inset-0 z-50 bg-black flex-col items-center justify-center p-8 text-center text-green-500">
          <svg className="w-24 h-24 mb-4 animate-bounce text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          <h2 className="text-2xl font-bold uppercase mb-2">Yêu cầu Xoay ngang màn hình</h2>
          <p>Trải nghiệm Tác chiến Radar chỉ hỗ trợ chế độ màn hình ngang (Landscape). Vui lòng xoay điện thoại của bạn!</p>
        </div>

        <main className="app-content container mx-auto p-4 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  )
}
