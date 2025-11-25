import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Web3Provider } from "@/lib/web3"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CrowdFundX - Decentralized Crowdfunding Platform",
  description: "Empowering creators and innovators through blockchain-based crowdfunding. Fund your dreams with transparent, secure, and global funding solutions.",
  keywords: "crowdfunding, blockchain, ethereum, web3, decentralized, funding, creators, innovation",
  authors: [{ name: "CrowdFundX Team" }],
  openGraph: {
    title: "CrowdFundX - Decentralized Crowdfunding Platform",
    description: "Empowering creators and innovators through blockchain-based crowdfunding",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Web3Provider>
            {children}
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
