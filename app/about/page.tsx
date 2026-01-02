"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Shield, 
  Globe, 
  Heart, 
  Zap, 
  CheckCircle,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const features = [
    {
      icon: <Shield className="h-6 w-6 text-white" />,
      title: "Decentralized & Secure",
      description: "Built on blockchain technology with smart contracts ensuring transparency and security."
    },
    {
      icon: <Globe className="h-6 w-6 text-white" />,
      title: "Global Access",
      description: "Connect with supporters worldwide without geographical limitations."
    },
    {
      icon: <Zap className="h-6 w-6 text-white" />,
      title: "Instant Transactions",
      description: "Fast and secure payments with automatic fund distribution."
    },
    {
      icon: <Users className="h-6 w-6 text-white" />,
      title: "Community Driven",
      description: "Empowering creators through community support and engagement."
    }
  ]

  const team = [
    {
      name: "Duy Nguyen",
      role: "Founder & Developer",
      description: "Building the future of decentralized crowdfunding",
      image: "👨‍💻"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="relative w-full overflow-hidden mb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 opacity-90"></div>
          {/* Decorative geometric shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-300 rounded-full opacity-30"></div>
            <div className="absolute top-32 left-32 w-16 h-16 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-blue-300 rounded-full opacity-30"></div>
            <div className="absolute top-1/2 right-20 w-20 h-20 border-4 border-blue-300 transform rotate-12 opacity-30" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <div className="absolute top-20 right-32 w-16 h-16 border-4 border-blue-300 rounded-full opacity-30"></div>
            <div className="absolute bottom-32 right-10 w-12 h-12 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
          </div>
          <div className="relative container mx-auto px-6 py-16 text-center">
            <h1 className="text-4xl font-semibold text-white mb-6 drop-shadow-lg">
              About CrowdFundX
            </h1>
            <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              We're revolutionizing crowdfunding through blockchain technology, 
              empowering creators and innovators to bring their dreams to life 
              with transparent, secure, and global funding solutions.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="border border-border bg-card">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-semibold text-foreground mb-6">Our Mission</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    To democratize funding by connecting passionate creators with supportive communities 
                    through decentralized technology, ensuring every great idea has the opportunity to flourish.
                  </p>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-xs">Decentralized</Badge>
                    <Badge variant="outline" className="text-xs">Transparent</Badge>
                    <Badge variant="outline" className="text-xs">Global</Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-muted-foreground text-lg">
                    Empowering the next generation of creators
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="relative w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 opacity-90"></div>
            {/* Decorative geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-32 left-32 w-16 h-16 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
              <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-1/2 right-20 w-20 h-20 border-4 border-blue-300 transform rotate-12 opacity-30" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
              <div className="absolute top-20 right-32 w-16 h-16 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute bottom-32 right-10 w-12 h-12 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
            </div>
            <div className="relative container mx-auto px-6 py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-white mb-4 drop-shadow-lg">Why Choose CrowdFundX?</h2>
                <p className="text-white/90 max-w-2xl mx-auto drop-shadow-md">
                  We combine cutting-edge blockchain technology with user-friendly design 
                  to create the ultimate crowdfunding experience.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature, index) => (
                  <Card key={index} className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-center hover:bg-white/20 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <div className="text-white">
                            {feature.icon}
                          </div>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 drop-shadow-md">{feature.title}</h3>
                      <p className="text-white/80 text-sm drop-shadow-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="relative w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 opacity-90"></div>
            {/* Decorative geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-32 left-32 w-16 h-16 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
              <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-1/2 right-20 w-20 h-20 border-4 border-blue-300 transform rotate-12 opacity-30" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
              <div className="absolute top-20 right-32 w-16 h-16 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute bottom-32 right-10 w-12 h-12 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
            </div>
            <div className="relative container mx-auto px-6 py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-white mb-4 drop-shadow-lg">Meet Our Team</h2>
                <p className="text-white/90 max-w-2xl mx-auto drop-shadow-md">
                  Passionate individuals working together to revolutionize crowdfunding
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="max-w-sm w-full">
                  {team.map((member, index) => (
                    <Card key={index} className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-center hover:bg-white/20 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="text-5xl mb-4">{member.image}</div>
                        <h3 className="text-lg font-semibold text-white mb-1 drop-shadow-md">{member.name}</h3>
                        <Badge className="mb-3 text-xs bg-white/20 text-white border-white/30">
                          {member.role}
                        </Badge>
                        <p className="text-white/80 text-sm drop-shadow-sm">{member.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="relative w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 opacity-90"></div>
            {/* Decorative geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-32 left-32 w-16 h-16 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
              <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-1/2 right-20 w-20 h-20 border-4 border-blue-300 transform rotate-12 opacity-30" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
              <div className="absolute top-20 right-32 w-16 h-16 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute bottom-32 right-10 w-12 h-12 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
            </div>
            <div className="relative container mx-auto px-6 py-16">
              <h2 className="text-3xl font-semibold text-white mb-4 drop-shadow-lg">Ready to Get Started?</h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto drop-shadow-md">
                Join thousands of creators who are already using CrowdFundX to bring their ideas to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/creator">
                  <Button size="lg" className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 backdrop-blur-sm">
                    <Heart className="mr-2 h-5 w-5" />
                    Start Your Campaign
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Explore Campaigns
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}