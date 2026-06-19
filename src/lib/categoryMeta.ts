import {
  Hammer, Wrench, FileSearch, Award, Building2, MoreHorizontal, FileText,
  Home, Zap, Droplet, Flame, Mountain, Trees, PaintRoller, ShieldAlert,
  ClipboardCheck, Key, type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** Tailwind class fragments for the icon chip (bg + text). */
  tone: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  repair:       { label: "Repair",       icon: Hammer,        tone: "bg-primary/10 text-primary" },
  maintenance:  { label: "Maintenance",  icon: Wrench,        tone: "bg-accent/15 text-accent" },
  inspection:   { label: "Inspection",   icon: FileSearch,    tone: "bg-primary/10 text-primary" },
  warranty:     { label: "Warranty",     icon: Award,         tone: "bg-accent/15 text-accent" },
  renovation:   { label: "Renovation",   icon: Building2,     tone: "bg-primary/10 text-primary" },
  roof:         { label: "Roof",         icon: Home,          tone: "bg-primary/10 text-primary" },
  hvac:         { label: "HVAC",         icon: Flame,         tone: "bg-warning/15 text-warning-foreground" },
  plumbing:     { label: "Plumbing",     icon: Droplet,       tone: "bg-primary/10 text-primary" },
  electrical:   { label: "Electrical",   icon: Zap,           tone: "bg-warning/15 text-warning-foreground" },
  foundation:   { label: "Foundation",   icon: Mountain,      tone: "bg-muted text-foreground" },
  paint:        { label: "Paint",        icon: PaintRoller,   tone: "bg-accent/15 text-accent" },
  landscaping:  { label: "Landscaping",  icon: Trees,         tone: "bg-accent/15 text-accent" },
  claim:        { label: "Insurance claim", icon: ShieldAlert, tone: "bg-destructive/10 text-destructive" },
  permit:       { label: "Permit",       icon: ClipboardCheck, tone: "bg-primary/10 text-primary" },
  sale:         { label: "Sale",         icon: Key,           tone: "bg-accent/15 text-accent" },
  construction: { label: "Construction", icon: Building2,     tone: "bg-primary/10 text-primary" },
  other:        { label: "Other",        icon: MoreHorizontal, tone: "bg-muted text-foreground" },
};

export function getCategoryMeta(category?: string | null): CategoryMeta {
  if (!category) return { label: "Record", icon: FileText, tone: "bg-muted text-foreground" };
  return CATEGORY_META[category.toLowerCase()] ?? CATEGORY_META.other;
}
