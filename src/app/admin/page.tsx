import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Navbar from "@/components/layout/Navbar";
import AdminClient, { type AdminUser } from "@/components/admin/AdminClient";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  role?: string;
  page?: string;
}

const PAGE_SIZE = 25;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=login&next=/admin");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "superadmin") redirect("/dashboard");

  let admin;
  try {
    admin = createAdminClient();
  } catch (e: any) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto p-12 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin client unavailable</h1>
          <p className="text-muted-foreground">{e.message}</p>
          <p className="text-xs text-muted-foreground mt-4">
            Set <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env</code> and restart the server.
          </p>
        </div>
      </div>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const roleFilter = params.role && ["user", "provider", "superadmin"].includes(params.role) ? params.role : null;
  const q = params.q?.trim() || null;

  let profilesQuery = admin
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, province, city, district, nearest_landmark, is_banned, subscription_end_date, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (roleFilter) profilesQuery = profilesQuery.eq("role", roleFilter);
  if (q) {
    profilesQuery = profilesQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`,
    );
  }

  const { data: profilesData, count: total, error } = await profilesQuery;
  const profiles = profilesData as Array<Record<string, unknown>> | null;
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto p-12 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-4" />
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  const ids = (profiles || []).map((p) => p.id as string);
  const detailsByProvider = new Map<
    string,
    { category: string | null; services_delivered: number | null; average_rating: number | null; is_online: boolean | null }
  >();
  if (ids.length) {
    const { data: pdRows } = await admin
      .from("provider_details")
      .select("provider_id, category, services_delivered, average_rating, is_online")
      .in("provider_id", ids);
    ((pdRows as Array<Record<string, unknown>> | null) || []).forEach((r) =>
      detailsByProvider.set(r.provider_id as string, {
        category: (r.category as string | null) ?? null,
        services_delivered: (r.services_delivered as number | null) ?? null,
        average_rating: (r.average_rating as number | null) ?? null,
        is_online: (r.is_online as boolean | null) ?? null,
      }),
    );
  }

  const lastSignInById = new Map<string, string | null>();
  try {
    const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    (authList?.users || []).forEach((u: any) => lastSignInById.set(u.id, u.last_sign_in_at ?? null));
  } catch {
    /* ignore */
  }

  const users: AdminUser[] = (profiles || []).map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string) || "",
    email: (p.email as string | null) ?? null,
    phone: (p.phone as string) || "",
    role: p.role as AdminUser["role"],
    province: (p.province as string | null) ?? null,
    city: (p.city as string) || "",
    district: (p.district as string | null) ?? null,
    nearest_landmark: (p.nearest_landmark as string | null) ?? null,
    is_banned: !!p.is_banned,
    subscription_end_date: (p.subscription_end_date as string | null) ?? null,
    created_at: (p.created_at as string | null) ?? null,
    last_sign_in_at: lastSignInById.get(p.id as string) ?? null,
    provider_details: detailsByProvider.get(p.id as string) ?? null,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-headline text-accent font-bold flex items-center gap-3">
            <ShieldAlert className="h-8 w-8" /> Superadmin Control
          </h1>
          <p className="text-muted-foreground">
            Manage every user on the platform. Actions here are audit-logged.
          </p>
        </header>
        <AdminClient
          users={users}
          total={total ?? users.length}
          page={page}
          pageSize={PAGE_SIZE}
          initialQuery={q ?? ""}
          initialRole={roleFilter ?? "all"}
        />
      </main>
    </div>
  );
}
