import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronRight, Loader2, Wine, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useHoverSound } from "@/hooks/use-sound";
import logo from "@/assets/logo 1.svg";
import SignInModal from "@/components/SignInModal";

// ─── Zod Schema ─────────────────────────────────────────────────────────────

const consultationSchema = z.object({
  full_name: z.string().min(2, "validation.fullName"),
  email: z.string().email("validation.email"),
  phone: z.string().optional(),
  company_name: z.string().optional(),

  collection_size: z.enum(["under_500", "500_2000", "2000_5000", "over_5000"], {
    errorMap: () => ({ message: "validation.collectionSize" }),
  }),
  current_storage: z.enum(["professional_cellar", "wine_fridge", "mixed", "none"], {
    errorMap: () => ({ message: "validation.storage" }),
  }),
  annual_budget: z.enum(["under_50k", "50k_150k", "150k_500k", "over_500k"], {
    errorMap: () => ({ message: "validation.annualBudget" }),
  }),

  tier_interest: z.enum(["essentials", "management", "excellence", "undecided"]),
  primary_goals: z.array(z.string()).min(1, "validation.primaryGoals"),

  preferred_contact: z.enum(["email", "phone", "video_call"]),
  time_zone: z.string().optional(),
  additional_notes: z.string().optional(),

  privacy_accepted: z.literal(true, { errorMap: () => ({ message: "validation.privacyAccepted" }) }),
});

type ConsultationData = z.infer<typeof consultationSchema>;

// ─── Tier Data ──────────────────────────────────────────────────────────────

const getTiers = (t: (key: string) => string) => [
  {
    id: "essentials" as const,
    label: t("form.fields.tierInterest.essentials.name"),
    price: t("form.fields.tierInterest.essentials.price"),
    description: t("form.fields.tierInterest.essentials.description"),
  },
  {
    id: "management" as const,
    label: t("form.fields.tierInterest.management.name"),
    price: t("form.fields.tierInterest.management.price"),
    description: t("form.fields.tierInterest.management.description"),
  },
  {
    id: "excellence" as const,
    label: t("form.fields.tierInterest.excellence.name"),
    price: t("form.fields.tierInterest.excellence.price"),
    description: t("form.fields.tierInterest.excellence.description"),
    featured: true,
  },
  {
    id: "undecided" as const,
    label: t("form.fields.tierInterest.undecided.name"),
    price: t("form.fields.tierInterest.undecided.price"),
    description: t("form.fields.tierInterest.undecided.description"),
  },
];

const getGoals = (t: (key: string) => string) => [
  { id: "portfolio_growth", label: t("form.fields.goals.options.portfolio_growth") },
  { id: "cellar_optimization", label: t("form.fields.goals.options.cellar_optimization") },
  { id: "investment", label: t("form.fields.goals.options.investment") },
  { id: "events", label: t("form.fields.goals.options.events") },
  { id: "other", label: t("form.fields.goals.options.other") },
];

// ─── Magnetic Button ────────────────────────────────────────────────────────

const MagneticButton = ({
  children,
  type = "button",
  className = "",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const { onMouseEnter: playHoverSound } = useHoverSound();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      x: (e.clientX - (rect.left + rect.width / 2)) * 0.15,
      y: (e.clientY - (rect.top + rect.height / 2)) * 0.15,
    });
  }, [disabled]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick?.();
  }, [onClick, disabled]);

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setPosition({ x: 0, y: 0 }); setIsHovered(false); }}
      onMouseEnter={() => { if (!disabled) { setIsHovered(true); playHoverSound(); } }}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={cn("relative overflow-hidden", className)}
      disabled={disabled}
    >
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-20 h-20 rounded-full bg-primary/30 pointer-events-none"
          style={{ left: r.x - 40, top: r.y - 40 }}
        />
      ))}
      <span className="relative block overflow-hidden h-6">
        <motion.span
          className="flex items-center justify-center h-full"
          animate={{ y: isHovered ? "-100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.span>
        <motion.span
          className="absolute top-full left-0 right-0 flex items-center justify-center h-full"
          animate={{ y: isHovered ? "-100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.span>
      </span>
    </motion.button>
  );
};

// ─── Success Modal ───────────────────────────────────────────────────────────

const SuccessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation("corporate");
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ backgroundColor: "hsla(0,0%,5%,0.95)", backdropFilter: "blur(20px)" }}
          onClick={onClose}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400 - 100,
                opacity: 0,
                scale: Math.random() * 0.5 + 0.5,
                rotate: Math.random() * 360,
              }}
              transition={{ duration: 1.5 + Math.random(), ease: "easeOut", delay: Math.random() * 0.3 }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? "hsl(39,52%,56%)" : "hsl(0,82%,17%)",
                left: "50%",
                top: "50%",
              }}
            />
          ))}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="absolute inset-0 rounded"
              style={{
                background: "linear-gradient(135deg,hsla(39,52%,56%,0.3),hsla(0,82%,17%,0.3))",
                filter: "blur(40px)",
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className="relative rounded p-10"
              style={{
                background: "hsla(0,0%,8%,0.95)",
                border: "1px solid hsla(39,52%,56%,0.3)",
                boxShadow: "0 0 60px hsla(39,52%,56%,0.2)",
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, delay: 0.1 }}
                className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,hsla(39,52%,56%,0.2),hsla(39,52%,56%,0.1))",
                  border: "1px solid hsla(39,52%,56%,0.4)",
                }}
              >
                <Wine size={32} style={{ color: "hsl(39,52%,56%)" }} />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-serif text-3xl mb-3"
                style={{ color: "hsl(39,52%,56%)" }}
              >
                {t("success.title")}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm mb-2"
                style={{ color: "hsl(0,0%,55%)", letterSpacing: "0.05em" }}
              >
                {t("success.message")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-2 mb-8"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <Sparkles size={16} style={{ color: "hsla(39,52%,56%,0.6)" }} />
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="flex items-center gap-2 mx-auto px-8 py-3 border transition-colors duration-300"
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "hsl(39,52%,56%)",
                  borderColor: "hsl(39,52%,56%)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {t("success.continue")}
                <ChevronRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ─── Field Error Component ──────────────────────────────────────────────────

const FieldError = ({ message }: { message?: string }) => {
  const { t } = useTranslation("corporate");
  return message ? (
    <p className="mt-1 text-destructive font-sans-nav text-[10px] tracking-wider">
      {message.startsWith("validation.") ? t(`form.${message}`) : message}
    </p>
  ) : null;
};

// ─── Main Component ─────────────────────────────────────────────────────────

const CorporateGate = () => {
  const { t } = useTranslation("corporate");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const TIERS = getTiers(t);
  const GOALS = getGoals(t);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ConsultationData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      primary_goals: [],
      preferred_contact: "email",
    },
  });

  const selectedTier = watch("tier_interest");

  const onSubmit = async (data: ConsultationData) => {
    const { error } = await supabase.from("corporate_consultations").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      company_name: data.company_name || null,
      collection_size: data.collection_size,
      current_storage: data.current_storage,
      annual_acquisition_budget: data.annual_budget,
      tier_interest: data.tier_interest,
      primary_goals: data.primary_goals,
      preferred_contact_method: data.preferred_contact,
      preferred_time_zone: data.time_zone || null,
      additional_notes: data.additional_notes || null,
      status: "pending",
    });

    if (!error) {
      reset();
      setShowSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-start">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsla(0,82%,17%,0.4) 0%, transparent 60%)" }}
      />

      <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} />
      <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} context="corporate" />

      {/* Logo */}
      <div className="w-full px-6 md:px-10 pt-8 pb-4 flex items-center justify-between relative z-10">
        <Link to="/">
          <img src={logo} alt="GC Wines" className="w-24 h-auto" />
        </Link>
        <Link
          to="/"
          className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {t("header.backToSite")}
        </Link>
      </div>

      {/* Central glass card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 md:py-12"
      >
        <div className="bg-glass-strong p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-4">
              {t("header.eyebrow")}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl mb-4">{t("header.title")}</h1>
            <div className="gold-line w-16 mx-auto mb-5" />
            <p className="text-sm text-muted-foreground tracking-wider">
              {t("header.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Section 1: Your Information */}
            <div className="space-y-6">
              <h2 className="font-serif text-2xl mb-6">{t("form.sections.yourInfo")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: t("form.fields.fullName.label") }}
                  />
                  <input
                    {...register("full_name")}
                    className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                    placeholder={t("form.fields.fullName.placeholder")}
                  />
                  <FieldError message={errors.full_name?.message} />
                </div>
                <div>
                  <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: t("form.fields.email.label") }}
                  />
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                    placeholder={t("form.fields.email.placeholder")}
                  />
                  <FieldError message={errors.email?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: t("form.fields.phone.label") }}
                  />
                  <input
                    {...register("phone")}
                    className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                    placeholder={t("form.fields.phone.placeholder")}
                  />
                </div>
                <div>
                  <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: t("form.fields.companyName.label") }}
                  />
                  <input
                    {...register("company_name")}
                    className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                    placeholder={t("form.fields.companyName.placeholder")}
                  />
                </div>
              </div>
            </div>

            {/* Gold separator */}
            <div className="gold-line w-full" />

            {/* Section 2: Collection Profile */}
            <div className="space-y-6">
              <h2 className="font-serif text-2xl mb-6">{t("form.sections.collection")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: t("form.fields.collectionSize.label") }}
                  />
                  <select
                    {...register("collection_size")}
                    className="w-full bg-background border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200 appearance-none"
                  >
                    <option value="">{t("form.fields.collectionSize.placeholder")}</option>
                    <option value="under_500">{t("form.fields.collectionSize.options.under_500")}</option>
                    <option value="500_2000">{t("form.fields.collectionSize.options.500_2000")}</option>
                    <option value="2000_5000">{t("form.fields.collectionSize.options.2000_5000")}</option>
                    <option value="over_5000">{t("form.fields.collectionSize.options.over_5000")}</option>
                  </select>
                  <FieldError message={errors.collection_size?.message} />
                </div>
                <div>
                  <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: t("form.fields.storage.label") }}
                  />
                  <select
                    {...register("current_storage")}
                    className="w-full bg-background border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200 appearance-none"
                  >
                    <option value="">{t("form.fields.storage.placeholder")}</option>
                    <option value="professional_cellar">{t("form.fields.storage.options.professional_cellar")}</option>
                    <option value="wine_fridge">{t("form.fields.storage.options.wine_fridge")}</option>
                    <option value="mixed">{t("form.fields.storage.options.mixed")}</option>
                    <option value="none">{t("form.fields.storage.options.none")}</option>
                  </select>
                  <FieldError message={errors.current_storage?.message} />
                </div>
              </div>

              <div>
                <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: t("form.fields.annualBudget.label") }}
                />
                <select
                  {...register("annual_budget")}
                  className="w-full bg-background border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200 appearance-none"
                >
                  <option value="">{t("form.fields.annualBudget.placeholder")}</option>
                  <option value="under_50k">{t("form.fields.annualBudget.options.under_50k")}</option>
                  <option value="50k_150k">{t("form.fields.annualBudget.options.50k_150k")}</option>
                  <option value="150k_500k">{t("form.fields.annualBudget.options.150k_500k")}</option>
                  <option value="over_500k">{t("form.fields.annualBudget.options.over_500k")}</option>
                </select>
                <FieldError message={errors.annual_budget?.message} />
              </div>
            </div>

            {/* Gold separator */}
            <div className="gold-line w-full" />

            {/* Section 3: Service Interest */}
            <div className="space-y-6">
              <h2 className="font-serif text-2xl mb-6">{t("form.sections.interest")}</h2>

              {/* Tier selection cards */}
              <Controller
                name="tier_interest"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-4">
                    {TIERS.map((tier) => (
                      <motion.div
                        key={tier.id}
                        onClick={() => field.onChange(tier.id)}
                        className={`p-5 border cursor-pointer transition-all duration-300 ${
                          field.value === tier.id
                            ? "border-primary glow-gold bg-primary/5"
                            : "border-border bg-glass hover:border-primary/40"
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-serif text-lg mb-1">{tier.label}</h3>
                            <p className="font-sans-nav text-[11px] tracking-[0.2em] uppercase text-primary">
                              {tier.price}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                          </div>
                          <div
                            className={`w-5 h-5 border flex items-center justify-center shrink-0 transition-colors ${
                              field.value === tier.id ? "border-primary bg-primary" : "border-border"
                            }`}
                          >
                            {field.value === tier.id && <Check size={10} className="text-primary-foreground" />}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              />
              {errors.tier_interest && <FieldError message={errors.tier_interest.message} />}

              {/* Selected tier summary */}
              <AnimatePresence>
                {selectedTier && selectedTier !== "undecided" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-primary/5 border border-primary/30 p-4"
                  >
                    <p className="text-sm text-foreground">
                      {t("form.tierSummary")}{" "}
                      <span className="text-primary font-medium">
                        {TIERS.find((t) => t.id === selectedTier)?.label}
                      </span>
                      . {t("form.billingNote")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary goals */}
              <div>
                <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4"
                  dangerouslySetInnerHTML={{ __html: t("form.fields.goals.label") }}
                />
                <Controller
                  name="primary_goals"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {GOALS.map((goal) => {
                        const isSelected = field.value?.includes(goal.id);
                        return (
                          <label
                            key={goal.id}
                            className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                              isSelected ? "border-primary" : "border-border hover:border-primary/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newValue = e.target.checked
                                  ? [...(field.value || []), goal.id]
                                  : field.value?.filter((id) => id !== goal.id) || [];
                                field.onChange(newValue);
                              }}
                              className="accent-primary"
                            />
                            <span className="text-sm tracking-wide">{goal.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                <FieldError message={errors.primary_goals?.message} />
              </div>
            </div>

            {/* Gold separator */}
            <div className="gold-line w-full" />

            {/* Section 4: Consultation Preferences */}
            <div className="space-y-6">
              <h2 className="font-serif text-2xl mb-6">{t("form.sections.preferences")}</h2>

              <div>
                <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4"
                  dangerouslySetInnerHTML={{ __html: t("form.fields.contactMethod.label") }}
                />
                <Controller
                  name="preferred_contact"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "email", label: t("form.fields.contactMethod.options.email") },
                        { value: "phone", label: t("form.fields.contactMethod.options.phone") },
                        { value: "video_call", label: t("form.fields.contactMethod.options.video_call") },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex flex-col items-center p-4 border cursor-pointer transition-colors text-center ${
                            field.value === opt.value
                              ? "border-primary text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            checked={field.value === opt.value}
                            onChange={() => field.onChange(opt.value)}
                            className="sr-only"
                          />
                          <span className="font-sans-nav text-[10px] tracking-[0.2em] uppercase">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                    dangerouslySetInnerHTML={{ __html: t("form.fields.timeZone.label") }}
                  />
                  <input
                    {...register("time_zone")}
                    className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                    placeholder={t("form.fields.timeZone.placeholder")}
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: t("form.fields.additionalNotes.label") }}
                />
                <textarea
                  {...register("additional_notes")}
                  rows={3}
                  className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200 resize-none"
                  placeholder={t("form.fields.additionalNotes.placeholder")}
                />
              </div>
            </div>

            {/* Gold separator */}
            <div className="gold-line w-full" />

            {/* Terms */}
            <div className="space-y-4">
              <Controller
                name="privacy_accepted"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked || undefined)}
                        className="mt-0.5 w-4 h-4 border border-border bg-transparent accent-primary shrink-0"
                      />
                      <span className="font-sans-nav text-[11px] tracking-[0.1em] text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                        {t("form.privacyCheckbox")}{" "}
                        <Link to="/legal/privacy" className="text-primary underline underline-offset-2">
                          {t("form.privacyLink")}
                        </Link>{" "}
                        {t("form.privacyNote")}
                      </span>
                    </label>
                    {errors.privacy_accepted && (
                      <p className="text-xs text-destructive mt-1 ml-6">{t(`form.${errors.privacy_accepted.message}`)}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Submit */}
            <MagneticButton
              type="submit"
              disabled={isSubmitting}
              className="w-full font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary px-8 py-4 hover:bg-primary hover:text-primary-foreground transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {t("form.submitting")}
                </span>
              ) : (
                t("form.submit")
              )}
            </MagneticButton>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center font-sans-nav text-[10px] tracking-wider text-muted-foreground">
            {t("footer.alreadyClient")}{" "}
            <button
              onClick={() => setShowSignIn(true)}
              className="text-primary hover:underline"
            >
              {t("footer.signIn")}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CorporateGate;
