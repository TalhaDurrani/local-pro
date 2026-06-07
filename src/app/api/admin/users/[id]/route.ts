import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401 as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "superadmin") {
    return { error: "Forbidden", status: 403 as const };
  }
  return { user, supabase };
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireSuperadmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (auth.user.id === id) {
    return NextResponse.json(
      { error: "Use Settings -> Danger Zone to delete your own account." },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.supabase.from("audit_log").insert({
    actor_id: auth.user.id,
    action: "user.delete",
    target_type: "user",
    target_id: id,
    payload: {},
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireSuperadmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { is_banned?: boolean; subscription_end_date?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.is_banned === "boolean") update.is_banned = body.is_banned;
  if (body.subscription_end_date !== undefined)
    update.subscription_end_date = body.subscription_end_date;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.supabase.from("audit_log").insert({
    actor_id: auth.user.id,
    action: typeof body.is_banned === "boolean" ? (body.is_banned ? "user.ban" : "user.unban") : "user.update",
    target_type: "user",
    target_id: id,
    payload: update,
  });

  if (body.is_banned === true) {
    // Revoke active sessions for the banned user.
    try {
      await admin.auth.admin.signOut(id);
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true });
}
