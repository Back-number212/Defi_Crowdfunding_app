"use client"

import { useState } from "react"
import { SimpleWalletConnect } from "@/components/simple-wallet-connect"
import { Menu, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-background/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img 
              src="/logo-header.png" 
              alt="CrowdFundX Logo" 
              className="h-48 w-auto group-hover:opacity-90 transition-opacity duration-200"
            />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium">
              Home
            </Link>
            <Link href="/creator" className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium">
              Create
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium">
              About
            </Link>
          </nav>

          {/* Wallet Connection - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/creator">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </Link>
            <SimpleWalletConnect />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-sm">
            <nav className="flex flex-col space-y-1">
              <Link 
                href="/" 
                className="px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/creator" 
                className="px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Create
              </Link>
              <Link 
                href="/about" 
                className="px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              <div className="pt-4 border-t border-border space-y-3">
                <Link href="/creator" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </Link>
                <SimpleWalletConnect />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}