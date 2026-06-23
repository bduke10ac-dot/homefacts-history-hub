import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "property.ownership_transfer"
  | "property_owner.added"
  | "property_owner.removed"
  | "document.uploaded"
  | "document.deleted"
  | "warranty.added"
  | "warranty.updated"
  | "warranty.deleted"
  | "builder.assigned"
  | "builder.removed"
  | "contractor.assigned"
  | "contractor.removed"
  | "admin.role_changed";

interface AuditPayload {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  property_id?: string;
  metadata?: Record<string, unknown>;
}

/** Best-effort client-side audit log write. Server-side triggers cover the critical paths. */
export async function logAudit(p: AuditPayload): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: p.action,
    entity_type: p.entity_type,
    entity_id: p.entity_id ?? null,
    property_id: p.property_id ?? null,
    metadata: (p.metadata ?? {}) as never,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
}
