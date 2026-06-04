
"use client";

import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { Search, MapPin, Star, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { t } = useAppContext();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 md:pt-32 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <h1 className="text-4xl md:text-7xl font-headline font-bold text-foreground leading-tight tracking-tight">
            {t.tagline}
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed">
            {t.homeDescription}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 h-14 rounded-full text-lg shadow-xl shadow-accent/10">
              <Link href="/auth">{t.signUp}</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-border text-foreground hover:bg-accent/10 h-14 rounded-full px-8 text-lg glass">
              {t.findServices}
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Stats / Features */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-8 rounded-3xl border-border space-y-4 group hover:bg-accent/5 transition-all">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t.securePayments}</h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              {t.securePaymentsDesc}
            </p>
          </div>

          <div className="glass p-8 rounded-3xl border-border space-y-4 group hover:bg-accent/5 transition-all">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t.smartMapping}</h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              {t.smartMappingDesc}
            </p>
          </div>

          <div className="glass p-8 rounded-3xl border-border space-y-4 group hover:bg-accent/5 transition-all">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t.topRatedPros}</h3>
            <p className="text-foreground/60 font-light leading-relaxed">
              {t.topRatedProsDesc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
