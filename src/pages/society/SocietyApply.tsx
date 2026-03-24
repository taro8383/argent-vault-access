import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo 1.svg";

// ─── Zod schemas per step ────────────────────────────────────────────────────

const step1Schema = z.object({
  full_name:   z.string().min(2, "Full name is required"),
  email:       z.string().email("Valid email required"),
  phone:       z.string().min(6, "Phone number required"),
  birth_date:  z.string().min(1, "Date of birth required").refine((v) => {
    const dob = new Date(v);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    return dob <= cutoff;
  }, "You must be 18 or older"),
  age_verified: z.literal(true, { errorMap: () => ({ message: "Age verification required" }) }),
});

const step2Schema = z.object({
  delivery_line1:    z.string().min(1, "Address line 1 required"),
  delivery_line2:    z.string().optional(),
  delivery_city:     z.string().min(1, "City required"),
  delivery_state:    z.string().min(1, "State / province required"),
  delivery_postcode: z.string().min(1, "Postcode required"),
  delivery_country:  z.string().min(2, "Country required"),
  alt_enabled:       z.boolean().optional(),
  alt_line1:         z.string().optional(),
  alt_line2:         z.string().optional(),
  alt_city:          z.string().optional(),
  alt_state:         z.string().optional(),
  alt_postcode:      z.string().optional(),
  alt_country:       z.string().optional(),
  preferred_window:  z.enum(["morning", "afternoon", "evening", "any"]),
  building_access:   z.string().optional(),
  storage_type:      z.enum(["cellar", "fridge", "ambient", "mixed"]),
});

const step3Schema = z.object({
  selected_tier:   z.enum(["founding", "private", "collector"]),
  referral_source: z.string().optional(),
  tos_accepted:    z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service." }) }),
  privacy_accepted: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the Privacy Notice." }) }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ─── Tier data ───────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: "founding" as const,
    label: "Founding Member",
    price: "AUD $2,500 / year",
    allocations: "4 per year · 6 bottles each",
    tastings: "1 private tasting annually",
    benefits: ["First access to special releases"],
  },
  {
    id: "private" as const,
    label: "Private Member",
    price: "AUD $3,500 / year",
    allocations: "4 per year · 6 bottles each",
    tastings: "2 private tastings annually",
    benefits: ["Additional purchase access", "Annual dinner invitation"],
  },
  {
    id: "collector" as const,
    label: "Collector Member",
    price: "AUD $10,500 / year",
    allocations: "12 per year (monthly) · 6 bottles each",
    tastings: "Unlimited access",
    benefits: [
      "Pre-release wines",
      "Annual private dinner with the winemaker",
      "Cellar consultation",
      "Bespoke sourcing",
      "Trade tasting guest invites",
    ],
    featured: true,
  },
];

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls = "w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50";
const labelCls = "block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5";

// ─── Main component ───────────────────────────────────────────────────────────

const SocietyApply = () => {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const inviteToken = params.get("invite") ?? sessionStorage.getItem("society_invite_token") ?? "";

  const [step, setStep]         = useState(1);
  const [submitting, setSubmit] = useState(false);
  const [success, setSuccess]   = useState(false);

  // Accumulated data across steps
  const [s1, setS1] = useState<Step1Data | null>(null);
  const [s2, setS2] = useState<Step2Data | null>(null);
  const [s3, setS3] = useState<Step3Data | null>(null);

  // ── Step 1 form
  const { register: r1, handleSubmit: hs1, formState: { errors: e1 }, control: c1 } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: s1 ?? undefined,
  });

  // ── Step 2 form
  const { register: r2, handleSubmit: hs2, formState: { errors: e2 }, watch: w2, control: c2 } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: s2 ?? { preferred_window: "any", storage_type: "ambient", alt_enabled: false },
  });
  const altEnabled = w2("alt_enabled");

  // ── Step 3 form
  const { register: r3, handleSubmit: hs3, formState: { errors: e3 }, control: c3, watch: w3 } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: s3 ?? undefined,
  });
  const selectedTier = w3("selected_tier");

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const onStep1 = (data: Step1Data) => { setS1(data); setStep(2); };
  const onStep2 = (data: Step2Data) => { setS2(data); setStep(3); };

  const onStep3 = async (data: Step3Data) => {
    if (!s1 || !s2) return;
    setS3(data);
    setSubmit(true);

    const delivery_address = {
      line1: s2.delivery_line1, line2: s2.delivery_line2 ?? "",
      city: s2.delivery_city, state: s2.delivery_state,
      postcode: s2.delivery_postcode, country: s2.delivery_country,
    };
    const alt_address = s2.alt_enabled ? {
      line1: s2.alt_line1 ?? "", line2: s2.alt_line2 ?? "",
      city: s2.alt_city ?? "", state: s2.alt_state ?? "",
      postcode: s2.alt_postcode ?? "", country: s2.alt_country ?? "",
    } : null;

    await supabase.from("society_applications").insert({
      full_name:        s1.full_name,
      email:            s1.email,
      phone:            s1.phone,
      birth_date:       s1.birth_date,
      age_verified:     true,
      delivery_address,
      alt_address,
      preferred_window: s2.preferred_window,
      building_access:  s2.building_access ?? null,
      storage_type:     s2.storage_type,
      selected_tier:    data.selected_tier,
      invite_token:     inviteToken || null,
      referral_source:  data.referral_source || null,
      status:           "pending",
    });

    setSubmit(false);
    setSuccess(true);
    sessionStorage.removeItem("society_invite_token");
  };

  const progress = ((step - 1) / 3) * 100 + (step === 1 ? 0 : step === 2 ? 33 : 66);

  // ─── Success state ────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-glass-strong border border-border p-10 max-w-md w-full text-center"
        >
          <div className="w-12 h-12 border border-primary flex items-center justify-center mx-auto mb-6">
            <Check size={20} className="text-primary" />
          </div>
          <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-4">Application Received</p>
          <h2 className="font-serif text-3xl mb-4">Thank You</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Our team will review your application within 48 hours. You will receive a confirmation at the email address provided.
          </p>
          <button
            onClick={() => navigate("/society")}
            className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary border border-primary/40 px-6 py-3 hover:border-primary transition-colors"
          >
            Return to Society ↗
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Form render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border">
        <img src={logo} alt="GC Wines" className="w-20 h-auto" />
        <a href="/" className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors">
          ← Back to site
        </a>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-10">
            <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-3">Private Allocation Society</p>
            <h1 className="font-serif text-4xl mb-2">Complete Your Application</h1>
            <div className="gold-line w-16 mt-4 mb-6" />

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-3">
              {["Your Details", "Delivery Profile", "Your Membership"].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 flex items-center justify-center text-[10px] border transition-colors ${
                    step > i + 1 ? "bg-primary border-primary text-primary-foreground" :
                    step === i + 1 ? "border-primary text-primary" : "border-border text-muted-foreground"
                  }`}>
                    {step > i + 1 ? <Check size={10} /> : i + 1}
                  </div>
                  <span className={`font-sans-nav text-[10px] tracking-[0.2em] uppercase hidden sm:block ${
                    step === i + 1 ? "text-foreground" : "text-muted-foreground"
                  }`}>{label}</span>
                  {i < 2 && <div className="w-6 h-[1px] bg-border" />}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-[1px] [&>div]:bg-primary bg-border" />
          </div>

          {/* Glass card */}
          <div className="bg-glass-strong border border-border p-8 md:p-10">
            <AnimatePresence mode="wait">
              {/* ── Step 1 ── */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={hs1(onStep1)}
                  className="space-y-7"
                >
                  <h2 className="font-serif text-2xl mb-1">Your Details</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input {...r1("full_name")} className={inputCls} placeholder="Your full legal name" />
                      {e1.full_name && <p className="text-xs text-destructive mt-1">{e1.full_name.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input {...r1("email")} type="email" className={inputCls} placeholder="your@email.com" />
                      {e1.email && <p className="text-xs text-destructive mt-1">{e1.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <input {...r1("phone")} type="tel" className={inputCls} placeholder="+61 400 000 000" />
                      {e1.phone && <p className="text-xs text-destructive mt-1">{e1.phone.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input {...r1("birth_date")} type="date" className={inputCls} />
                      {e1.birth_date && <p className="text-xs text-destructive mt-1">{e1.birth_date.message}</p>}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Controller
                      name="age_verified"
                      control={c1}
                      render={({ field }) => (
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked || undefined)}
                            className="mt-0.5 accent-primary"
                          />
                          <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                            I confirm I am 18 years of age or older and legally permitted to purchase alcohol in my country of residence.
                          </span>
                        </label>
                      )}
                    />
                    {e1.age_verified && <p className="text-xs text-destructive mt-1 ml-6">{e1.age_verified.message}</p>}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.3em] uppercase border border-primary text-primary px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                      Continue <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={hs2(onStep2)}
                  className="space-y-7"
                >
                  <h2 className="font-serif text-2xl mb-1">Delivery Profile</h2>

                  <div>
                    <p className={labelCls}>Primary Delivery Address</p>
                    <div className="space-y-4">
                      <input {...r2("delivery_line1")} className={inputCls} placeholder="Address Line 1" />
                      {e2.delivery_line1 && <p className="text-xs text-destructive">{e2.delivery_line1.message}</p>}
                      <input {...r2("delivery_line2")} className={inputCls} placeholder="Address Line 2 (optional)" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input {...r2("delivery_city")} className={inputCls} placeholder="City" />
                          {e2.delivery_city && <p className="text-xs text-destructive mt-1">{e2.delivery_city.message}</p>}
                        </div>
                        <div>
                          <input {...r2("delivery_state")} className={inputCls} placeholder="State / Province" />
                          {e2.delivery_state && <p className="text-xs text-destructive mt-1">{e2.delivery_state.message}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input {...r2("delivery_postcode")} className={inputCls} placeholder="Postcode" />
                          {e2.delivery_postcode && <p className="text-xs text-destructive mt-1">{e2.delivery_postcode.message}</p>}
                        </div>
                        <div>
                          <input {...r2("delivery_country")} className={inputCls} placeholder="Country" />
                          {e2.delivery_country && <p className="text-xs text-destructive mt-1">{e2.delivery_country.message}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alt address toggle */}
                  <div>
                    <Controller
                      name="alt_enabled"
                      control={c2}
                      render={({ field }) => (
                        <label className="flex items-center gap-3 cursor-pointer group mb-4">
                          <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} className="accent-primary" />
                          <span className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                            Add Alternative Delivery Address
                          </span>
                        </label>
                      )}
                    />
                    {altEnabled && (
                      <div className="space-y-4 pl-4 border-l border-border">
                        <p className={labelCls}>Alternative Address</p>
                        <input {...r2("alt_line1")} className={inputCls} placeholder="Address Line 1" />
                        <input {...r2("alt_line2")} className={inputCls} placeholder="Address Line 2 (optional)" />
                        <div className="grid grid-cols-2 gap-4">
                          <input {...r2("alt_city")} className={inputCls} placeholder="City" />
                          <input {...r2("alt_state")} className={inputCls} placeholder="State" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input {...r2("alt_postcode")} className={inputCls} placeholder="Postcode" />
                          <input {...r2("alt_country")} className={inputCls} placeholder="Country" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preferred delivery window */}
                  <div>
                    <p className={labelCls}>Preferred Delivery Window</p>
                    <Controller
                      name="preferred_window"
                      control={c2}
                      render={({ field }) => (
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { value: "morning", label: "Morning", sub: "8am – 12pm" },
                            { value: "afternoon", label: "Afternoon", sub: "12pm – 5pm" },
                            { value: "evening", label: "Evening", sub: "5pm – 9pm" },
                            { value: "any", label: "Any Time", sub: "" },
                          ].map((opt) => (
                            <label key={opt.value} className={`flex flex-col gap-1 p-3 border cursor-pointer transition-colors ${
                              field.value === opt.value ? "border-primary text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                            }`}>
                              <RadioGroupItem value={opt.value} className="sr-only" />
                              <span className="font-sans-nav text-[10px] tracking-[0.2em] uppercase">{opt.label}</span>
                              {opt.sub && <span className="text-xs">{opt.sub}</span>}
                            </label>
                          ))}
                        </RadioGroup>
                      )}
                    />
                  </div>

                  {/* Building access */}
                  <div>
                    <label className={labelCls}>Building Access Instructions (optional)</label>
                    <Textarea
                      {...r2("building_access")}
                      className="bg-transparent border-border text-foreground text-sm"
                      placeholder="e.g. Leave with concierge. Apartment 4B. Gate code: 1234."
                      rows={2}
                    />
                  </div>

                  {/* Storage type */}
                  <div>
                    <p className={labelCls}>Wine Storage Type</p>
                    <Controller
                      name="storage_type"
                      control={c2}
                      render={({ field }) => (
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-2">
                          {[
                            { value: "cellar", label: "Temperature-controlled cellar" },
                            { value: "fridge", label: "Wine fridge" },
                            { value: "ambient", label: "Ambient storage (cool, dark room)" },
                            { value: "mixed", label: "Mixed" },
                          ].map((opt) => (
                            <label key={opt.value} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                              field.value === opt.value ? "border-primary" : "border-border hover:border-primary/40"
                            }`}>
                              <RadioGroupItem value={opt.value} className="text-primary" />
                              <span className="text-sm tracking-wide">{opt.label}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      )}
                    />
                    {e2.storage_type && <p className="text-xs text-destructive mt-1">{e2.storage_type.message}</p>}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button type="submit" className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.3em] uppercase border border-primary text-primary px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                      Continue <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── Step 3 ── */}
              {step === 3 && (
                <motion.form
                  key="step3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={hs3(onStep3)}
                  className="space-y-8"
                >
                  <h2 className="font-serif text-2xl mb-1">Choose Your Membership</h2>
                  <p className="text-xs text-muted-foreground tracking-wider">All pricing is all-inclusive.</p>

                  {/* Tier cards */}
                  <Controller
                    name="selected_tier"
                    control={c3}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 gap-4">
                        {TIERS.map((tier) => (
                          <motion.div
                            key={tier.id}
                            onClick={() => field.onChange(tier.id)}
                            className={`p-6 border cursor-pointer transition-all duration-300 ${
                              field.value === tier.id
                                ? "border-primary glow-gold bg-primary/5"
                                : "border-border bg-glass hover:border-primary/40"
                            } ${tier.featured ? "relative" : ""}`}
                            whileHover={{ scale: 1.01 }}
                          >
                            {tier.featured && (
                              <div className="absolute top-3 right-3 font-sans-nav text-[9px] tracking-[0.3em] uppercase bg-primary text-primary-foreground px-2 py-0.5">
                                Featured
                              </div>
                            )}
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-serif text-xl mb-0.5">{tier.label}</h3>
                                <p className="font-sans-nav text-[11px] tracking-[0.2em] uppercase text-primary">{tier.price}</p>
                              </div>
                              <div className={`w-5 h-5 border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                                field.value === tier.id ? "border-primary bg-primary" : "border-border"
                              }`}>
                                {field.value === tier.id && <Check size={10} className="text-primary-foreground" />}
                              </div>
                            </div>
                            <div className="space-y-1.5 text-sm text-muted-foreground">
                              <p>{tier.allocations}</p>
                              <p>{tier.tastings}</p>
                              {tier.benefits.map((b, i) => (
                                <p key={i} className="text-xs">· {b}</p>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  />
                  {e3.selected_tier && <p className="text-xs text-destructive">{e3.selected_tier.message}</p>}

                  {/* Selected tier summary */}
                  <AnimatePresence>
                    {selectedTier && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-primary/5 border border-primary/30 p-4"
                      >
                        <p className="text-sm text-foreground">
                          You have selected the{" "}
                          <span className="text-primary font-medium">
                            {TIERS.find((t) => t.id === selectedTier)?.label}
                          </span>{" "}
                          at{" "}
                          <span className="text-primary">
                            {TIERS.find((t) => t.id === selectedTier)?.price}
                          </span>
                          . Annual billing. Cancel anytime with 30 days notice.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Referral */}
                  <div>
                    <label className={labelCls}>How did you hear about us? (optional)</label>
                    <input {...r3("referral_source")} className={inputCls} placeholder="Referral, event, publication…" />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-4">
                    <Controller
                      name="tos_accepted"
                      control={c3}
                      render={({ field }) => (
                        <div>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked || undefined)} className="mt-0.5 accent-primary" />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              I have read and accept the Terms of Service
                            </span>
                          </label>
                          {e3.tos_accepted && <p className="text-xs text-destructive mt-1 ml-6">{e3.tos_accepted.message}</p>}
                        </div>
                      )}
                    />
                    <Controller
                      name="privacy_accepted"
                      control={c3}
                      render={({ field }) => (
                        <div>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked || undefined)} className="mt-0.5 accent-primary" />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              I acknowledge the Privacy Notice
                            </span>
                          </label>
                          {e3.privacy_accepted && <p className="text-xs text-destructive mt-1 ml-6">{e3.privacy_accepted.message}</p>}
                        </div>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 font-sans-nav text-[11px] tracking-[0.3em] uppercase border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Complete Application →"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocietyApply;
