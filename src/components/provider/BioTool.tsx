
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { generateProviderBio } from "@/ai/flows/ai-provider-bio-generator";
import { toast } from "@/hooks/use-toast";

export default function BioTool() {
  const [experience, setExperience] = useState("");
  const [category, setCategory] = useState("Home Maintenance");
  const [generatedBio, setGeneratedBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useAppContext();

  const handleGenerate = async () => {
    if (!experience) return;
    setLoading(true);
    try {
      const result = await generateProviderBio({
        experience,
        serviceCategories: [category]
      });
      setGeneratedBio(result.generatedBio);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate bio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedBio);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="glass border-border overflow-hidden">
      <CardHeader className="bg-accent/10 border-b border-border">
        <CardTitle className="text-lg text-accent flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          {t.bioGenerator}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/70">{t.experience}</label>
          <Textarea 
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="e.g. 5 years of plumbing experience, certified expert in leak repairs..."
            className="bg-muted text-foreground border-border min-h-[100px]"
          />
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !experience}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {t.generate}
        </Button>

        {generatedBio && (
          <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{t.refinedBio}</h4>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-accent hover:bg-accent/10">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="p-4 bg-muted/70 rounded-lg border border-accent/30 text-foreground/90 text-sm leading-relaxed italic">
              {generatedBio}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
