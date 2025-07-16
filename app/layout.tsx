import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Alpesh And Sagar's Chat App",
  description: 'Developers',
  generator: 'Chat App',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}
