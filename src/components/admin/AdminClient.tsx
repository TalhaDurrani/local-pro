"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  role: "user" | "provider" | "superadmin";
  province: string | null;
  city: string;
  district: string | null;
  nearest_landmark: string | null;
  is_banned: boolean;
  subscription_end_date: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  provider_details: {
    category: string | null;
    services_delivered: number | null;
    average_rating: number | null;
    is_online: boolean | null;
  } | null;
}

interface Props {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  initialQuery: string;
  initialRole: string;
}

export default function AdminClient({
  users,
  total,
  page,
  pageSize,
  initialQuery,
  initialRole,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [role, setRole] = useState(initialRole);
  const [pending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [drawer, setDrawer] = useState<AdminUser | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const sp = new URLSearchParams(params.toString());
    if (debouncedQuery) sp.set("q", debouncedQuery);
    else sp.delete("q");
    if (role !== "all") sp.set("role", role);
    else sp.delete("role");
    sp.set("page", "1");
    startTransition(() => router.replace(`/admin?${sp.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, role]);

  const goToPage = (n: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(n));
    startTransition(() => router.replace(`/admin?${sp.toString()}`));
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleBan = async (u: AdminUser) => {
    setProcessingId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_banned: !u.is_banned }),
    });
    setProcessingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Action failed",
        description: body.error || "Unable to update user.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: `${u.full_name} ${u.is_banned ? "unbanned" : "banned"}` });
    router.refresh();
  };

  const deleteUser = async (u: AdminUser) => {
    setProcessingId(u.id);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    setProcessingId(null);
    setConfirmDelete(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Delete failed",
        description: body.error || "Unable to delete user.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: `${u.full_name} permanently deleted` });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, city..."
              className="pl-10"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">Seekers</SelectItem>
              <SelectItem value="provider">Providers</SelectItem>
              <SelectItem value="superadmin">Superadmins</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => router.refresh()} disabled={pending}>
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Activity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={u.is_banned ? "bg-destructive/5" : ""}>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-foreground truncate max-w-[200px]">{u.email || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-foreground">
                        {[u.city, u.district].filter(Boolean).join(", ") || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {u.nearest_landmark || "—"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-muted">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      <div>Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</div>
                      <div>
                        Last login{" "}
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}
                      </div>
                      {u.role === "provider" && u.provider_details && (
                        <div className="mt-1">
                          {u.provider_details.services_delivered ?? 0} jobs · ⭐{" "}
                          {(u.provider_details.average_rating ?? 0).toFixed(1)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.is_banned ? (
                        <span className="text-destructive font-bold text-xs flex items-center">
                          <Ban className="w-3 h-3 mr-1" /> Banned
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs flex items-center">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDrawer(u)}
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={u.is_banned ? "outline" : "destructive"}
                          disabled={processingId === u.id}
                          onClick={() => toggleBan(u)}
                          aria-label={u.is_banned ? "Unban" : "Ban"}
                        >
                          {processingId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === u.id}
                          onClick={() => setConfirmDelete(u)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || pending}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || pending}
            onClick={() => goToPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete?.full_name}</strong> and all associated data (profile, requests,
              reviews, transactions, notifications) will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteUser(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!drawer} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {drawer && <UserDetail user={drawer} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface RequestRow {
  id: string;
  status: string;
  created_at: string;
  counterparty: string;
}
interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
interface TxRow {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
}
interface AuditRow {
  id: string;
  action: string;
  created_at: string;
  payload: Record<string, unknown>;
}

function UserDetail({ user }: { user: AdminUser }) {
  const [requests, setRequests] = useState<RequestRow[] | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [transactions, setTransactions] = useState<TxRow[] | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [reqRes, revRes, txRes, audRes] = await Promise.all([
        supabase
          .from("service_requests")
          .select("id, status, created_at, seeker_id, provider_id, seeker:seeker_id(full_name), provider:provider_id(full_name)")
          .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at")
          .or(`provider_id.eq.${user.id},user_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("transactions")
          .select("id, amount, transaction_type, status, created_at")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("audit_log")
          .select("id, action, created_at, payload")
          .eq("target_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      setRequests(
        (reqRes.data || []).map((r: any) => ({
          id: r.id,
          status: r.status,
          created_at: r.created_at,
          counterparty:
            r.seeker_id === user.id ? r.provider?.full_name || "Provider" : r.seeker?.full_name || "Seeker",
        })),
      );
      setReviews((revRes.data || []) as ReviewRow[]);
      setTransactions((txRes.data || []) as TxRow[]);
      setAudit((audRes.data || []) as AuditRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{user.full_name}</SheetTitle>
        <SheetDescription>{user.email || user.phone}</SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-6 text-sm">
        <Section title="Identity">
          <Row label="Role" value={user.role} />
          <Row label="Banned" value={user.is_banned ? "Yes" : "No"} />
          <Row label="Joined" value={user.created_at ? new Date(user.created_at).toLocaleString() : "—"} />
          <Row
            label="Last sign-in"
            value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}
          />
        </Section>
        <Section title="Contact">
          <Row label="Email" value={user.email || "—"} />
          <Row label="Phone" value={user.phone || "—"} />
        </Section>
        <Section title="Location">
          <Row label="Province" value={user.province || "—"} />
          <Row label="City" value={user.city || "—"} />
          <Row label="District" value={user.district || "—"} />
          <Row label="Landmark" value={user.nearest_landmark || "—"} />
        </Section>
        {user.role === "provider" && user.provider_details && (
          <Section title="Provider">
            <Row label="Category" value={user.provider_details.category || "—"} />
            <Row label="Jobs delivered" value={String(user.provider_details.services_delivered ?? 0)} />
            <Row label="Rating" value={(user.provider_details.average_rating ?? 0).toFixed(2)} />
            <Row label="Online" value={user.provider_details.is_online ? "Yes" : "No"} />
          </Section>
        )}

        <Section title={`Recent requests (${requests?.length ?? "…"})`}>
          {requests === null ? (
            <Loader />
          ) : requests.length === 0 ? (
            <Empty />
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex justify-between border-b last:border-0 py-1.5">
                <span className="capitalize">{r.status}</span>
                <span className="text-muted-foreground truncate">{r.counterparty}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </Section>

        <Section title={`Reviews (${reviews?.length ?? "…"})`}>
          {reviews === null ? (
            <Loader />
          ) : reviews.length === 0 ? (
            <Empty />
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border-b last:border-0 py-1.5">
                <div className="flex justify-between">
                  <span>⭐ {r.rating}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
              </div>
            ))
          )}
        </Section>

        <Section title={`Transactions (${transactions?.length ?? "…"})`}>
          {transactions === null ? (
            <Loader />
          ) : transactions.length === 0 ? (
            <Empty />
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex justify-between border-b last:border-0 py-1.5">
                <span className="capitalize">{t.transaction_type}</span>
                <span>Rs. {Number(t.amount).toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{t.status}</span>
              </div>
            ))
          )}
        </Section>

        <Section title={`Audit log (${audit?.length ?? "…"})`}>
          {audit === null ? (
            <Loader />
          ) : audit.length === 0 ? (
            <Empty />
          ) : (
            audit.map((a) => (
              <div key={a.id} className="border-b last:border-0 py-1.5">
                <div className="flex justify-between">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
                  {JSON.stringify(a.payload, null, 0)}
                </pre>
              </div>
            ))
          )}
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function Empty() {
  return <div className="text-xs text-muted-foreground py-2 text-center">No records.</div>;
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-3">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );
}
