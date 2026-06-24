import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { inviteId, claimUrl } = await req.json();
    if (!inviteId || !claimUrl) {
      return json({ error: "Missing inviteId or claimUrl" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(auth ?? "");
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r: any) => r.role === "admin")) return json({ error: "Admin only" }, 403);

    const { data: invite, error: invErr } = await supabase
      .from("partner_invites")
      .select("invitee_email, company_name, expires_at, categories, service_zips")
      .eq("id", inviteId)
      .maybeSingle();
    if (invErr || !invite) return json({ error: "Invite not found" }, 404);

    if (!RESEND_API_KEY) {
      return json({
        error: "email_not_configured",
        message:
          "RESEND_API_KEY is not set. Add it in Project Settings → Secrets to enable invite emails. The invite link is still valid — share it manually for now.",
      }, 503);
    }

    const expiresOn = new Date(invite.expires_at).toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric",
    });
    const cats = (invite.categories ?? []).join(", ") || "your service categories";
    const zips = (invite.service_zips ?? []).join(", ") || "any zip you serve";

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a">
        <h1 style="font-size:20px;margin:0 0 16px">You're invited to join Orivaz as a partner</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 14px">
          ${invite.company_name ? `Hi ${invite.company_name},` : "Hi there,"} an Orivaz admin invited you to join the
          partner marketplace for <strong>${cats}</strong> in <strong>${zips}</strong>.
        </p>
        <p style="font-size:15px;line-height:1.55;margin:0 0 14px">
          Orivaz is a homeowner-controlled property intelligence platform. Approved partners can post service
          offers to anonymized opportunity groups — homeowners decide whether to accept and reveal their contact info.
          No cold outreach, no list buying.
        </p>
        <p style="margin:24px 0">
          <a href="${claimUrl}" style="background:#0f172a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Claim your invite</a>
        </p>
        <p style="font-size:13px;color:#64748b;margin:0 0 6px">This invite expires on <strong>${expiresOn}</strong>.</p>
        <p style="font-size:13px;color:#64748b;margin:0">If the button doesn't work, paste this link in your browser:<br/><span style="word-break:break-all">${claimUrl}</span></p>
      </div>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Orivaz <onboarding@resend.dev>",
        to: [invite.invitee_email],
        subject: "You're invited to join Orivaz as a partner",
        html,
      }),
    });

    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error("Resend error", resp.status, body);
      return json({ error: "resend_failed", message: body?.message ?? `Resend returned ${resp.status}` }, 502);
    }
    return json({ ok: true, id: body?.id ?? null });
  } catch (e) {
    console.error("send-partner-invite error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
