import React from 'react';
import { FAQSection } from '@/components/faq-section';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="mb-20">
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
              <h1 className="text-3xl font-semibold text-white mb-6 drop-shadow-lg text-center">Frequently Asked Questions</h1>
              <FAQSection />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
