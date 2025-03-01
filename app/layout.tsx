import { Geist_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Rewind',
  description: 'A surprisingly good retrospective tool',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable}`}>{children}</body>
    </html>
  )
}
