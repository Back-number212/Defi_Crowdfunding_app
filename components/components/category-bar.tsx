"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useRef } from "react"
import type { FrontendCampaign } from "@/lib/frontend-campaign"

interface CategoryBarProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  campaigns?: FrontendCampaign[]
}

export function CategoryBar({ categories, selectedCategory, onCategoryChange, campaigns = [] }: CategoryBarProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount
      
      scrollRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      })
      setScrollPosition(newPosition)
    }
  }

  const getCategoryCount = (category: string): number => {
    if (category === "All") {
      return campaigns.length
    }
    return campaigns.filter(c => c.category?.toLowerCase() === category.toLowerCase()).length
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'All': '🌟',
      'Art': '🎨',
      'Technology': '💻',
      'Health': '🏥',
      'Education': '📚',
      'Community': '👥',
      'Crypto': '₿',
      'Other': '📁'
    }
    return icons[category] || '📁'
  }

  return (
    <div className="relative mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Categories</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => {
            const count = getCategoryCount(category)
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => onCategoryChange(category)}
                className={`
                  flex items-center space-x-2 whitespace-nowrap transition-all duration-200
                  ${selectedCategory === category 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'hover:bg-primary/10 hover:border-primary hover:text-primary'
                  }
                `}
              >
                <span className="text-lg">{getCategoryIcon(category)}</span>
                <span className="font-medium">{category}</span>
                <Badge 
                  variant="secondary" 
                  className={`ml-2 ${selectedCategory === category ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}