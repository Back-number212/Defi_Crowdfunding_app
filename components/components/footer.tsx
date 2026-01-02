"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Linkedin, 
  Mail, 
  ArrowRight,
  Heart,
  Instagram
} from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    "ABOUT": [
      { label: "About Us", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" }
    ],
    "SUPPORT": [
      { label: "Help Center", href: "/help" },
      { label: "Community Guidelines", href: "/guidelines" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" }
    ],
    "MORE FROM CROWDFUNDX": [
      { label: "Blog", href: "/blog" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "API", href: "/api" },
      { label: "Developers", href: "/developers" }
    ]
  }

  return (
    <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo-footer.png" 
                alt="CrowdFundX Logo" 
                className="h-24 w-auto"
              />
              <span className="text-2xl font-bold text-white tracking-tight">CrowdFundX</span>
            </div>
            <p className="text-blue-100 mb-6 leading-relaxed">
              Empowering creators and innovators through decentralized crowdfunding. 
              Build your dreams with the support of a global community.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-2 mb-6">
              <h4 className="font-semibold mb-3">Contact Us</h4>
              <div className="space-y-2 text-sm">
                <a 
                  href="mailto:duy.nguyenkhoaquang@gmail.com"
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>duy.nguyenkhoaquang@gmail.com</span>
                </a>
                <a 
                  href="https://www.linkedin.com/in/duy-nkq-80227839a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </a>
                <a 
                  href="https://www.instagram.com/kvvan_dii/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
            
            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h4 className="font-semibold">Stay Updated</h4>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-white/40"
                />
                <Button size="sm" className="bg-white/20 hover:bg-white/30 border-white/20">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href}
                      className="text-blue-100 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-blue-100 text-sm">
              <span>© {currentYear} CrowdFundX. Made with</span>
              <Heart className="h-4 w-4 text-red-400 fill-current" />
              <span>for creators worldwide.</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-blue-100 text-sm">Follow us:</span>
              <div className="flex space-x-3">
                <a
                  href="https://www.linkedin.com/in/duy-nkq-80227839a"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-100 hover:text-white hover:bg-white/10 p-2"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </a>
                <a
                  href="https://www.instagram.com/kvvan_dii/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-100 hover:text-white hover:bg-white/10 p-2"
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                </a>
                <a
                  href="mailto:duy.nguyenkhoaquang@gmail.com"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-100 hover:text-white hover:bg-white/10 p-2"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}