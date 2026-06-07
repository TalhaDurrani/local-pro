"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Phone, User, Star } from "lucide-react";
import LeaveReviewDialog from "@/components/reviews/LeaveReviewDialog";

export default function SeekerRequests() {
  const { user } = useAppContext();
  const { items } = useServiceRequests({
    userId: user?.id,
    role: user?.role as "user" | "provider" | "superadmin" | undefined,
  });
  const [reviewFor, setReviewFor] = useState<{
    requestId: string;
    providerId: string;
    providerName: string;
  } | null>(null);

  if (!user || items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-foreground">My Service Requests</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((req) => (
          <Card key={req.id} className="border-border shadow-md overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className="pb-2 bg-muted/30">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 text-accent shrink-0" />
                  <CardTitle className="text-base font-bold truncate">
                    {req.provider?.full_name || "Provider"}
                  </CardTitle>
                </div>
                <Badge
                  variant={
                    req.status === "accepted"
                      ? "default"
                      : req.status === "completed"
                        ? "secondary"
                        : req.status === "declined" || req.status === "cancelled"
                          ? "destructive"
                          : "outline"
                  }
                  className="capitalize"
                >
                  {req.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(req.created_at).toLocaleString()}
                </div>
                {req.status === "accepted" && req.provider?.phone && (
                  <a
                    href={`tel:${req.provider.phone}`}
                    className="flex items-center gap-1 text-accent font-bold"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {req.provider.phone}
                  </a>
                )}
              </div>

              {req.status === "pending" && (
                <p className="text-xs text-muted-foreground italic">Waiting for professional to respond...</p>
              )}
              {req.status === "accepted" && (
                <p className="text-xs text-emerald-600 font-medium">Professional is on their way.</p>
              )}
              {req.status === "declined" && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  Request declined
                </div>
              )}
              {req.status === "cancelled" && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelled
                </div>
              )}
              {req.status === "completed" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Service completed
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setReviewFor({
                        requestId: req.id,
                        providerId: req.provider_id,
                        providerName: req.provider?.full_name || "the provider",
                      })
                    }
                  >
                    <Star className="h-3.5 w-3.5 mr-2" />
                    Leave a review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {reviewFor && (
        <LeaveReviewDialog
          open
          onOpenChange={(open) => !open && setReviewFor(null)}
          requestId={reviewFor.requestId}
          providerId={reviewFor.providerId}
          providerName={reviewFor.providerName}
        />
      )}
    </div>
  );
}
