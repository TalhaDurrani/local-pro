"use client";

import { useEffect, useMemo, useReducer } from "react";
import { supabase } from "@/lib/supabase";

export type ServiceRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export interface ServiceRequest {
  id: string;
  seeker_id: string;
  provider_id: string;
  status: ServiceRequestStatus;
  seeker_lat: number | null;
  seeker_lng: number | null;
  created_at: string;
  seeker?: { id: string; full_name: string; phone: string } | null;
  provider?: { id: string; full_name: string; phone: string } | null;
}

type Action =
  | { type: "init"; rows: ServiceRequest[] }
  | { type: "upsert"; row: ServiceRequest }
  | { type: "remove"; id: string };

function reducer(state: ServiceRequest[], action: Action): ServiceRequest[] {
  switch (action.type) {
    case "init":
      return [...action.rows].sort(byCreatedDesc);
    case "upsert": {
      const idx = state.findIndex((r) => r.id === action.row.id);
      if (idx === -1) return [action.row, ...state].sort(byCreatedDesc);
      const next = [...state];
      next[idx] = { ...next[idx], ...action.row };
      return next;
    }
    case "remove":
      return state.filter((r) => r.id !== action.id);
  }
}

function byCreatedDesc(a: ServiceRequest, b: ServiceRequest) {
  return b.created_at.localeCompare(a.created_at);
}

interface Options {
  userId: string | undefined;
  role: "user" | "provider" | "superadmin" | undefined;
}

export function useServiceRequests({ userId, role }: Options) {
  const [items, dispatch] = useReducer(reducer, [] as ServiceRequest[]);

  useEffect(() => {
    if (!userId || !role || role === "superadmin") return;

    let cancelled = false;

    const normalize = (row: any): ServiceRequest | null => {
      if (!row) return null;
      const seeker = Array.isArray(row.seeker) ? row.seeker[0] : row.seeker;
      const provider = Array.isArray(row.provider) ? row.provider[0] : row.provider;
      return { ...row, seeker: seeker ?? null, provider: provider ?? null } as ServiceRequest;
    };

    const fetchOne = async (id: string): Promise<ServiceRequest | null> => {
      const { data } = await supabase
        .from("service_requests")
        .select(
          `id, seeker_id, provider_id, status, seeker_lat, seeker_lng, created_at,
           seeker:seeker_id (id, full_name, phone),
           provider:provider_id (id, full_name, phone)`,
        )
        .eq("id", id)
        .maybeSingle();
      return normalize(data);
    };

    const initialLoad = async () => {
      const filterCol = role === "provider" ? "provider_id" : "seeker_id";
      const { data, error } = await supabase
        .from("service_requests")
        .select(
          `id, seeker_id, provider_id, status, seeker_lat, seeker_lng, created_at,
           seeker:seeker_id (id, full_name, phone),
           provider:provider_id (id, full_name, phone)`,
        )
        .eq(filterCol, userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("useServiceRequests initial load:", error);
        return;
      }
      const rows = ((data as any[]) || []).map(normalize).filter(Boolean) as ServiceRequest[];
      if (!cancelled) dispatch({ type: "init", rows });
    };

    initialLoad();

    const filter = role === "provider" ? `provider_id=eq.${userId}` : `seeker_id=eq.${userId}`;
    const channel = supabase
      .channel(`service-requests-${role}-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_requests", filter },
        async (payload) => {
          const full = await fetchOne((payload.new as { id: string }).id);
          if (full) dispatch({ type: "upsert", row: full });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_requests", filter },
        async (payload) => {
          const full = await fetchOne((payload.new as { id: string }).id);
          if (full) dispatch({ type: "upsert", row: full });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "service_requests", filter },
        (payload) => dispatch({ type: "remove", id: (payload.old as { id: string }).id }),
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [userId, role]);

  return useMemo(() => ({ items }), [items]);
}
