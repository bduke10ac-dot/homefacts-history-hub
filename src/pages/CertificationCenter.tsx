import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Award, BadgeCheck, BookOpen, Building2, CalendarClock, CheckCircle2, Crown,
  FileText, GraduationCap, Megaphone, RefreshCw, Scale, Send, Shield, ShieldCheck,
  Sparkles, Star, Upload, Users,
} from "lucide-react";

type Level = "none" | "bronze" | "silver" | "gold" | "platinum";

const LEVEL_META: Record<Level, { label: string; cls: string; min: number; ce: number }> = {
  none:     { label: "Not enrolled", cls: "bg-muted text-muted-foreground border-border", min: 0, ce: 0 },
  bronze:   { label: "Bronze",   cls: "bg-amber-700/15 text-amber-700 border-amber-700/30", min: 40, ce: 4 },
  silver:   { label: "Silver",   cls: "bg-slate-400/20 text-slate-700 border-slate-400/40 dark:text-slate-300", min: 60, ce: 8 },
  gold:     { label: "Gold",     cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-300", min: 80, ce: 14 },
  platinum: { label: "Platinum", cls: "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/30 dark:text-fuchsia-300", min: 92, ce: 24 },
};

const ICON_MAP: Record<string, any> = {
  BadgeCheck, Send, FileText, Star, Building2, Megaphone, Scale, Crown, Sparkles,
};

const SECTIONS = [
  { id: "become",      label: "Become Certified",     icon: Award },
  { id: "dashboard",   label: "Dashboard",            icon: Sparkles },
  { id: "mine",        label: "My Certification",     icon: ShieldCheck },
  { id: "trust",       label: "Trust Score",          icon: Star },
  { id: "education",   label: "Education",            icon: BookOpen },
  { id: "directory",   label: "Directory",            icon: Users },
  { id: "benefits",    label: "Partner Benefits",     icon: Crown },
  { id: "recert",      label: "Recertification",      icon: RefreshCw },
  { id: "compliance",  label: "Compliance",           icon: Shield },
  { id: "verify",      label: "Verification",         icon: BadgeCheck },
  { id: "ce",          label: "Continuing Ed.",       icon: GraduationCap },
];

export default function CertificationCenter() {
  const { user } = useAuth();
  const [cert, setCert] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [recerts, setRecerts] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [c, co, be] = await Promise.all([
      supabase.from("orivaz_ce_courses").select("*").eq("active", true).order("level_required"),
      supabase.from("orivaz_partner_benefits").select("*").eq("active", true).order("sort_order"),
      Promise.resolve(null),
    ]);
    setCourses(c.data ?? []);
    setBenefits(co.data ?? []);

    if (user) {
      const [cr, en, dc, ve, re] = await Promise.all([
        supabase.from("orivaz_certifications").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("orivaz_ce_enrollments").select("*, orivaz_ce_courses(title, hours, category)").eq("user_id", user.id),
        supabase.from("orivaz_compliance_docs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orivaz_verification_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("orivaz_recertifications").select("*").eq("user_id", user.id).order("due_date"),
      ]);
      setCert(cr.data);
      setEnrollments(en.data ?? []);
      setDocs(dc.data ?? []);
      setVerifications(ve.data ?? []);
      setRecerts(re.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [user?.id]);

  const totalCE = useMemo(
    () => enrollments.filter((e) => e.status === "completed")
      .reduce((s, e) => s + Number(e.orivaz_ce_courses?.hours ?? 0), 0),
    [enrollments]
  );

  const trustScore = cert?.trust_score ?? 0;
  const level: Level = (cert?.level ?? "none") as Level;
  const nextLevel: Level | null =
    level === "none" ? "bronze" :
    level === "bronze" ? "silver" :
    level === "silver" ? "gold" :
    level === "gold" ? "platinum" : null;

  const startCertification = async () => {
    if (!user) return;
    const { error } = await supabase.from("orivaz_certifications").upsert({
      user_id: user.id,
      status: "in_review",
      level: "none",
      trust_score: 25,
    }, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Application started. Complete compliance docs and CE to advance.");
    loadAll();
  };

  const enroll = async (course: any) => {
    if (!user) return;
    setEnrolling(course.id);
    const { error } = await supabase.from("orivaz_ce_enrollments").upsert({
      user_id: user.id, course_id: course.id, status: "enrolled",
    }, { onConflict: "user_id,course_id" });
    if (error) toast.error(error.message); else toast.success(`Enrolled in ${course.title}`);
    setEnrolling(null);
    loadAll();
  };

  const completeCourse = async (e: any) => {
    if (!user) return;
    const { error } = await supabase.from("orivaz_ce_enrollments")
      .update({ status: "completed", completed_at: new Date().toISOString(), score: 92 })
      .eq("id", e.id);
    if (error) toast.error(error.message); else toast.success("Course completed");
    loadAll();
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="container relative py-14">
          <Badge variant="outline" className="mb-4"><Sparkles className="mr-1.5 h-3 w-3" />Orivaz Certification</Badge>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Become an <span className="text-gradient">Orivaz Certified Professional</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Verified license & insurance. Continuing education. Permanent workmanship attached to
            every property you touch. Built for the next generation of property professionals.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {!cert && user && <Button onClick={startCertification}><Award className="mr-2 h-4 w-4" />Start application</Button>}
            <Button variant="outline" onClick={() => scrollTo("education")}><BookOpen className="mr-2 h-4 w-4" />Browse courses</Button>
            <Button variant="ghost" asChild><Link to="/network">View directory</Link></Button>
          </div>

          {/* Section nav chips */}
          <div className="mt-8 flex flex-wrap gap-1.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="inline-flex items-center gap-1 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium backdrop-blur hover:bg-muted">
                <Icon className="h-3 w-3" />{label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container space-y-16 py-12">
        {/* BECOME CERTIFIED */}
        <section id="become" className="space-y-4">
          <SectionHeader icon={Award} title="Become Certified" subtitle="The 4-step path from applicant to Platinum." />
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { n: 1, title: "Apply", body: "Open your file. We start a Trust Score and verification timeline." },
              { n: 2, title: "Verify Compliance", body: "Upload license, insurance, bond, and W-9. We verify." },
              { n: 3, title: "Complete Bronze CE", body: "Finish core courses to unlock the Bronze badge." },
              { n: 4, title: "Earn higher tiers", body: "Workmanship volume + CE moves you to Silver, Gold, Platinum." },
            ].map((s) => (
              <Card key={s.n} className="lift">
                <CardHeader>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero text-sm font-bold text-primary-foreground">{s.n}</div>
                  <CardTitle className="mt-3 text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{s.body}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* TIER LADDER */}
        <section id="dashboard" className="space-y-4">
          <SectionHeader icon={Sparkles} title="Certification Dashboard" subtitle="Your live progress across every requirement." />
          {!user ? (
            <SignInPrompt />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="lift md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current tier</CardTitle>
                      <CardDescription>Trust Score determines your tier. CE & verified work raise it.</CardDescription>
                    </div>
                    <Badge variant="outline" className={LEVEL_META[level].cls}>
                      <Award className="mr-1 h-3 w-3" />{LEVEL_META[level].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Trust Score</span>
                      <span className="text-2xl font-black text-gradient">{trustScore}</span>
                    </div>
                    <Progress value={trustScore} className="mt-2 h-3" />
                  </div>
                  {nextLevel && (
                    <p className="text-xs text-muted-foreground">
                      To reach <span className="font-semibold text-foreground">{LEVEL_META[nextLevel].label}</span>: score ≥{LEVEL_META[nextLevel].min}, CE hours ≥{LEVEL_META[nextLevel].ce}.
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <Stat label="CE Hours" value={totalCE.toFixed(1)} />
                    <Stat label="Verified Docs" value={docs.filter((d) => d.verified).length} />
                    <Stat label="Recerts due" value={recerts.filter((r) => r.status === "upcoming").length} />
                  </div>
                </CardContent>
              </Card>
              <Card className="lift">
                <CardHeader>
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row label="Application" value={cert ? "Active" : "Not started"} ok={!!cert} />
                  <Row label="Compliance docs" value={`${docs.filter((d) => d.verified).length}/${docs.length || 0} verified`} ok={docs.some((d) => d.verified)} />
                  <Row label="CE progress" value={`${totalCE} / ${nextLevel ? LEVEL_META[nextLevel].ce : LEVEL_META.platinum.ce} hrs`} ok={totalCE > 0} />
                  <Row label="Next recert" value={recerts[0]?.due_date ?? "—"} ok={!!recerts[0]} />
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* MY CERTIFICATION */}
        <section id="mine" className="space-y-4">
          <SectionHeader icon={ShieldCheck} title="My Certification" subtitle="Your badge, issuance, and expiration record." />
          {user && cert ? (
            <Card className="lift overflow-hidden">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="p-6">
                  <Badge variant="outline" className={LEVEL_META[level].cls}>
                    <Award className="mr-1 h-3 w-3" />Orivaz {LEVEL_META[level].label}
                  </Badge>
                  <h3 className="mt-3 text-2xl font-bold">Verified Professional</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Status: <span className="font-medium capitalize">{cert.status}</span></p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-muted-foreground">Issued</dt><dd className="font-medium">{cert.issued_at ?? "Pending"}</dd></div>
                    <div><dt className="text-muted-foreground">Expires</dt><dd className="font-medium">{cert.expires_at ?? "—"}</dd></div>
                    <div><dt className="text-muted-foreground">CE hours</dt><dd className="font-medium">{totalCE.toFixed(1)}</dd></div>
                    <div><dt className="text-muted-foreground">Trust Score</dt><dd className="font-medium">{trustScore}</dd></div>
                  </dl>
                </div>
                <div className="bg-gradient-hero p-6 text-primary-foreground">
                  <p className="text-xs uppercase tracking-wider opacity-80">Orivaz Verified Network</p>
                  <p className="mt-1 text-3xl font-black">{LEVEL_META[level].label}</p>
                  <p className="mt-2 text-sm opacity-90">Your badge appears on every Orivaz property report you've worked on.</p>
                  <div className="mt-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/40">
                    <Award className="h-12 w-12" />
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyCard text="Start your application to issue your Orivaz certification record." />
          )}
        </section>

        {/* TRUST SCORE */}
        <section id="trust" className="space-y-4">
          <SectionHeader icon={Star} title="Trust Score" subtitle="How Orivaz calculates the score that powers your tier." />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Identity & License (30)", d: "Verified license, identity match, current standing." },
              { t: "Insurance & Bond (25)", d: "Current COI, bond, workers' comp where required." },
              { t: "Workmanship (25)", d: "Verified work attached to Orivaz properties." },
              { t: "Education & Recert (20)", d: "CE hours completed and on-time recertification." },
            ].map((x) => (
              <Card key={x.t} className="lift"><CardHeader><CardTitle className="text-sm">{x.t}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{x.d}</CardContent></Card>
            ))}
          </div>
        </section>

        {/* EDUCATION CENTER */}
        <section id="education" className="space-y-4">
          <SectionHeader icon={BookOpen} title="Education Center" subtitle="Core curriculum to earn and maintain your tier." />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => {
              const enrolled = enrollments.find((e) => e.course_id === c.id);
              return (
                <Card key={c.id} className="lift flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={LEVEL_META[c.level_required as Level].cls}>{LEVEL_META[c.level_required as Level].label}</Badge>
                      <span className="text-xs text-muted-foreground">{c.hours} hr</span>
                    </div>
                    <CardTitle className="mt-2 text-base">{c.title}</CardTitle>
                    <CardDescription>{c.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                    {!user ? (
                      <Button variant="outline" className="w-full" asChild><Link to="/auth">Sign in to enroll</Link></Button>
                    ) : !enrolled ? (
                      <Button className="w-full" disabled={enrolling === c.id} onClick={() => enroll(c)}>
                        {enrolling === c.id ? "Enrolling…" : "Enroll"}
                      </Button>
                    ) : enrolled.status === "completed" ? (
                      <Badge className="w-full justify-center bg-emerald-500/15 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" />Completed · {enrolled.score}</Badge>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => completeCourse(enrolled)}>
                        Mark complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {loading && <p className="text-sm text-muted-foreground">Loading courses…</p>}
          </div>
        </section>

        {/* DIRECTORY */}
        <section id="directory" className="space-y-4">
          <SectionHeader icon={Users} title="Professional Directory" subtitle="Get discovered by Orivaz homeowners and builder partners." />
          <Card className="lift">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
              <p className="text-sm text-muted-foreground max-w-xl">
                Certified pros are featured in the public Orivaz Verified Network directory and
                inside every Property Command Center matching their service area.
              </p>
              <Button asChild><Link to="/network">Open directory</Link></Button>
            </CardContent>
          </Card>
        </section>

        {/* PARTNER BENEFITS */}
        <section id="benefits" className="space-y-4">
          <SectionHeader icon={Crown} title="Partner Benefits" subtitle="What unlocks at each tier." />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => {
              const Icon = ICON_MAP[b.icon] ?? BadgeCheck;
              return (
                <Card key={b.id} className="lift">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-primary" />
                      <Badge variant="outline" className={LEVEL_META[b.level_required as Level].cls}>{LEVEL_META[b.level_required as Level].label}+</Badge>
                    </div>
                    <CardTitle className="mt-2 text-base">{b.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{b.description}</CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* RECERTIFICATION */}
        <section id="recert" className="space-y-4">
          <SectionHeader icon={RefreshCw} title="Annual Recertification" subtitle="Every year, refresh your verification, CE, and insurance." />
          {user ? (
            <Card className="lift">
              <CardContent className="p-0">
                {recerts.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No recertification cycles yet — they're created automatically when your tier is issued.</div>
                ) : (
                  <ul className="divide-y">
                    {recerts.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-semibold">Cycle started {r.cycle_start}</p>
                          <p className="text-xs text-muted-foreground">Due {r.due_date}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{r.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : <SignInPrompt />}
        </section>

        {/* COMPLIANCE */}
        <section id="compliance" className="space-y-4">
          <SectionHeader icon={Shield} title="Compliance Center" subtitle="License, insurance, bond, workers' comp, W-9." />
          {user ? (
            <ComplianceUploader docs={docs} onChange={loadAll} userId={user.id} />
          ) : <SignInPrompt />}
        </section>

        {/* VERIFICATION CENTER */}
        <section id="verify" className="space-y-4">
          <SectionHeader icon={BadgeCheck} title="Verification Center" subtitle="Live activity log of every check Orivaz runs on your record." />
          {user ? (
            <Card className="lift">
              <CardContent className="p-0">
                {verifications.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No verification events yet.</div>
                ) : (
                  <ul className="divide-y">
                    {verifications.map((v) => (
                      <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-semibold">{v.event_type}</p>
                          <p className="text-xs text-muted-foreground">{v.source ?? "Orivaz"} · {new Date(v.created_at).toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{v.result ?? "pending"}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : <SignInPrompt />}
        </section>

        {/* CONTINUING EDUCATION */}
        <section id="ce" className="space-y-4">
          <SectionHeader icon={GraduationCap} title="Continuing Education" subtitle="Your enrollments and completion record." />
          {user ? (
            <Card className="lift">
              <CardContent className="p-0">
                {enrollments.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No enrollments yet. Browse the Education Center above.</div>
                ) : (
                  <ul className="divide-y">
                    {enrollments.map((e) => (
                      <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-semibold">{e.orivaz_ce_courses?.title}</p>
                          <p className="text-xs text-muted-foreground">{e.orivaz_ce_courses?.category} · {e.orivaz_ce_courses?.hours} hr</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.score != null && <Badge variant="outline">Score {e.score}</Badge>}
                          <Badge variant="outline" className="capitalize">{e.status.replace("_", " ")}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : <SignInPrompt />}
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: any) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-2">
      <div className="text-base font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border bg-card px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${ok ? "text-emerald-700 dark:text-emerald-300" : ""}`}>{value}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">{text}</div>
  );
}

function SignInPrompt() {
  return (
    <Card className="lift">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
        <p className="text-sm text-muted-foreground">Sign in as a professional to view your certification record.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </CardContent>
    </Card>
  );
}

function ComplianceUploader({ docs, onChange, userId }: { docs: any[]; onChange: () => void; userId: string }) {
  const [type, setType] = useState<string>("license");
  const [issuer, setIssuer] = useState("");
  const [number, setNumber] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    setSaving(true);
    const { error } = await supabase.from("orivaz_compliance_docs").insert({
      user_id: userId, doc_type: type as any, issuer, number, expires_at: expires || null,
    });
    if (error) toast.error(error.message); else { toast.success("Document recorded"); setIssuer(""); setNumber(""); setExpires(""); onChange(); }
    setSaving(false);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="lift">
        <CardHeader><CardTitle className="text-base">Add a compliance record</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="license">License</option>
              <option value="insurance">Insurance</option>
              <option value="bond">Bond</option>
              <option value="workers_comp">Workers' Comp</option>
              <option value="w9">W-9</option>
              <option value="identity">Identity</option>
              <option value="other">Other</option>
            </select>
            <Input placeholder="Issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
          </div>
          <Input placeholder="Number / policy ID" value={number} onChange={(e) => setNumber(e.target.value)} />
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          <Button className="w-full" onClick={add} disabled={saving}>
            <Upload className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Add record"}
          </Button>
        </CardContent>
      </Card>
      <Card className="lift">
        <CardHeader><CardTitle className="text-base">On file</CardTitle></CardHeader>
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No compliance documents yet.</div>
          ) : (
            <ul className="divide-y">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold capitalize">{d.doc_type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{d.issuer ?? "—"} · {d.number ?? "—"}{d.expires_at ? ` · exp ${d.expires_at}` : ""}</p>
                  </div>
                  <Badge variant="outline" className={d.verified ? "border-emerald-500/40 text-emerald-700" : ""}>
                    {d.verified ? <><CheckCircle2 className="mr-1 h-3 w-3" />Verified</> : <><CalendarClock className="mr-1 h-3 w-3" />Pending</>}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
