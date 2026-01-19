import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rise2gether AI Career Coach Bot',
  description: 'Rise2gether Career Development AI Career Coach Bot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
