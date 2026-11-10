import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    openPortal();
  }, []);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.origin + "/" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to open billing portal");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Could not open billing portal");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      {loading && !error && (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-sm text-muted-foreground">Opening billing portal…</p>
        </>
      )}
      {error && (
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
          <Button onClick={openPortal} variant="outline" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
