
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function OnboardingPage() {
  const [locating, setLocating] = useState(false);
  const { location, setLocation, t } = useAppContext();
  const router = useRouter();

  const handleLocate = () => {
    setLocating(true);
    // Simulate browser geolocation
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTimeout(() => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: "Main Boulevard, Gulberg III, Lahore, Pakistan"
          });
          setLocating(false);
        }, 1500);
      },
      () => {
        setLocating(false);
        // Fallback for demo
        setLocation({
          lat: 31.5204,
          lng: 74.3587,
          address: "Lahore, Punjab, Pakistan"
        });
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex items-center justify-center p-6 pt-20">
        <Card className="w-full max-w-md glass border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center gap-3">
              <MapPin className="h-6 w-6" />
              {t.locationSetup}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-foreground/70 font-light leading-relaxed">
              {t.locationSetupDesc}
            </p>
            
            <div className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${location ? 'border-accent bg-accent/10' : 'border-dashed border-border'}`}>
              {location ? (
                <>
                  <CheckCircle2 className="h-10 w-10 text-accent" />
                  <div className="text-center">
                    <p className="text-foreground font-bold">{t.locationStatus}</p>
                    <p className="text-foreground/60 text-xs mt-1">{location.address}</p>
                  </div>
                </>
              ) : (
                <Button 
                  onClick={handleLocate} 
                  disabled={locating}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {locating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                  {t.onboardingLocation}
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              disabled={!location} 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => router.push("/dashboard")}
            >
              {t.finishSetup}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
