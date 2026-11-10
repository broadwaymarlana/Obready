import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Scale, Gavel, ArrowRight } from "lucide-react";
import { setBarCaptureSkipped } from "@/lib/barCaptureSkip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const LA_PARISHES = [
  "Acadia","Allen","Ascension","Assumption","Avoyelles","Beauregard","Bienville",
  "Bossier","Caddo","Calcasieu","Caldwell","Cameron","Catahoula","Claiborne",
  "Concordia","De Soto","East Baton Rouge","East Carroll","East Feliciana",
  "Evangeline","Franklin","Grant","Iberia","Iberville","Jackson","Jefferson",
  "Jefferson Davis","La Salle","Lafayette","Lafourche","Lincoln","Livingston",
  "Madison","Morehouse","Natchitoches","Orleans","Ouachita","Plaquemines",
  "Pointe Coupee","Rapides","Red River","Richland","Sabine","St. Bernard",
  "St. Charles","St. Helena","St. James","St. John the Baptist","St. Landry",
  "St. Martin","St. Mary","St. Tammany","Tangipahoa","Tensas","Terrebonne",
  "Union","Vermilion","Vernon","Washington","Webster","West Baton Rouge",
  "West Carroll","West Feliciana","Winn",
];

export default function BarCapturePage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [barNumber, setBarNumber] = useState("");
  const [barState, setBarState] = useState("LA");
  const [barParish, setBarParish] = useState("");
  const [error, setError] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/trust/bar-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barNumber, barState, barParish: barParish || null }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trust/bar-profile"] });
      navigate("/");
    },
    onError: (e: Error) => setError(e.message),
  });

  const canSubmit = barNumber.trim().length > 0 && barState.trim().length > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Scale className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold font-serif">Welcome to ObjectionReady</h1>
          <p className="text-muted-foreground">Let's get your attorney profile set up.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" />
              Bar Membership
            </CardTitle>
            <CardDescription>
              Your bar number and state help us tailor recommendations to your jurisdiction and
              may appear on generated court documents. This information is stored securely and
              never shared.{" "}
              <a href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Privacy Policy
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bar-number">Bar Number <span className="text-destructive">*</span></Label>
                <Input
                  id="bar-number"
                  value={barNumber}
                  onChange={e => setBarNumber(e.target.value)}
                  placeholder="e.g. 23456"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bar-state">State <span className="text-destructive">*</span></Label>
                <Select value={barState} onValueChange={setBarState}>
                  <SelectTrigger id="bar-state"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {barState === "LA" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bar-parish">Primary Parish <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={barParish} onValueChange={setBarParish}>
                    <SelectTrigger id="bar-parish"><SelectValue placeholder="Select your primary parish…" /></SelectTrigger>
                    <SelectContent>
                      {LA_PARISHES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                variant="ghost"
                className="sm:flex-none"
                onClick={() => {
                  setBarCaptureSkipped();
                  navigate("/");
                }}
                disabled={saveMutation.isPending}
                data-testid="button-skip-bar-capture"
              >
                Skip for now
              </Button>
              <Button
                className="flex-1"
                onClick={() => saveMutation.mutate()}
                disabled={!canSubmit || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving…" : "Continue"}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Skipping reminds you again next time you sign in. You can also add it anytime in{" "}
          <span className="font-medium">Settings → Security &amp; Privacy</span>.
        </p>
      </div>
    </div>
  );
}
