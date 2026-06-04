
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import useLocation from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function OnboardingPage() {
  const [locating, setLocating] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { location, setLocation, t } = useAppContext();
  const { loading, fetchLocation, setManualAddress: setManualLocation, saveToProfile } = useLocation();
  const router = useRouter();

  const handleLocate = async () => {
    setErrorMessage(null);
    setLocating(true);
    try {
      const result = await fetchLocation();
      const newLoc = {
        lat: result.coords.latitude,
        lng: result.coords.longitude,
        address: result.displayAddress,
      };
      setLocation(newLoc);
      try {
        await saveToProfile();
      } catch (error: any) {
        console.warn("Unable to save detected location to profile:", error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to detect your location.");
    } finally {
      setLocating(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualAddress.trim()) {
      setErrorMessage("Please enter your address before continuing.");
      return;
    }
    setErrorMessage(null);
    setManualLocation(manualAddress.trim());
    setLocation({ lat: null, lng: null, address: manualAddress.trim() });
    try {
      await saveToProfile();
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to save profile location.");
    }
  };

  const handleFinish = async () => {
    if (!location) {
      setErrorMessage("Please set your location before continuing.");
      return;
    }
    router.push("/dashboard");
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
                <>
                  <Button 
                    onClick={handleLocate} 
                    disabled={locating || loading}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {locating || loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                    {t.onboardingLocation}
                  </Button>
                  <div className="w-full">
                    <p className="mb-2 text-sm text-foreground/70">Or enter your address manually:</p>
                    <textarea
                      value={manualAddress}
                      onChange={(event) => setManualAddress(event.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground"
                      rows={3}
                      placeholder="Enter your street, city, and area"
                    />
                    <Button onClick={handleManualSave} className="mt-3 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Save manual address
                    </Button>
                  </div>
                </>
              )}
            </div>
            {errorMessage && <p className="text-sm text-destructive mt-3">{errorMessage}</p>}
          </CardContent>
          <CardFooter>
            <Button 
              disabled={!location} 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleFinish}
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
