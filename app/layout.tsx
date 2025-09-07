import './globals.css'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HITSZ OpenAuto 文件加速',
  description: 'HITSZ OpenAuto 文件加速',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}
