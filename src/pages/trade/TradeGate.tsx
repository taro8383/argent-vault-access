import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronRight, Loader2, Wine, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useHoverSound } from "@/hooks/use-sound";
import logo from "@/assets/logo 1.svg";
import SignInModal from "@/components/SignInModal";

// ─── Zod Schema ─────────────────────────────────────────────────────────────

const tradeApplicationSchema = z.object({
  full_name:          z.string().min(2, "validation.fullName"),
  professional_title: z.string().min(2, "validation.professionalTitle"),
  property_name:      z.string().min(2, "validation.propertyName"),
  property_type:      z.enum(["hotel","restaurant","wine_bar","retailer","distributor","other"], {
    errorMap: () => ({ message: "validation.propertyType" }),
  }),
  market_country:     z.string().min(2, "validation.marketCountry"),
  annual_spend:       z.enum(["under_50k","50k_150k","150k_500k","over_500k"], {
    errorMap: () => ({ message: "validation.annualSpend" }),
  }),
  referral_source:    z.string().min(2, "validation.referralSource"),
  requirements:       z.string().min(20, "validation.requirements"),
  tos_accepted:       z.literal(true, { errorMap: () => ({ message: "validation.tosAccepted" }) }),
  privacy_accepted:   z.literal(true, { errorMap: () => ({ message: "validation.privacyAccepted" }) }),
});

type TradeApplicationData = z.infer<typeof tradeApplicationSchema>;

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
  const { t } = useTranslation("trade");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => setShowConfetti(true), 200);
    } else {
      document.body.style.overflow = "";
      setShowConfetti(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position:"fixed", inset:0, zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", backgroundColor:"hsla(0,0%,5%,0.95)", backdropFilter:"blur(20px)" }}
          onClick={onClose}
        >
          {showConfetti && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x:0, y:0, opacity:1, scale:0 }}
              animate={{ x:(Math.random()-0.5)*400, y:(Math.random()-0.5)*400-100, opacity:0, scale:Math.random()*0.5+0.5, rotate:Math.random()*360 }}
              transition={{ duration:1.5+Math.random(), ease:"easeOut", delay:Math.random()*0.3 }}
              style={{ position:"absolute", width:8, height:8, borderRadius:"50%", background: i%2===0 ? "hsl(39,52%,56%)" : "hsl(0,82%,17%)", left:"50%", top:"50%" }}
            />
          ))}
          <motion.div
            initial={{ scale:0.8, opacity:0, y:20 }}
            animate={{ scale:1, opacity:1, y:0 }}
            exit={{ scale:0.8, opacity:0, y:20 }}
            transition={{ type:"spring", damping:20 }}
            style={{ position:"relative", maxWidth:448, width:"100%", textAlign:"center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              style={{ position:"absolute", inset:0, borderRadius:4, background:"linear-gradient(135deg,hsla(39,52%,56%,0.3),hsla(0,82%,17%,0.3))", filter:"blur(40px)" }}
              animate={{ scale:[1,1.1,1], opacity:[0.5,0.8,0.5] }}
              transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}
            />
            <div style={{ position:"relative", borderRadius:4, padding:40, background:"hsla(0,0%,8%,0.95)", border:"1px solid hsla(39,52%,56%,0.3)", boxShadow:"0 0 60px hsla(39,52%,56%,0.2)" }}>
              <motion.div
                initial={{ scale:0, rotate:-180 }}
                animate={{ scale:1, rotate:0 }}
                transition={{ type:"spring", damping:15, delay:0.1 }}
                style={{ margin:"0 auto 24px", width:80, height:80, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,hsla(39,52%,56%,0.2),hsla(39,52%,56%,0.1))", border:"1px solid hsla(39,52%,56%,0.4)" }}
              >
                <Wine size={32} style={{ color:"hsl(39,52%,56%)" }} />
              </motion.div>

              <motion.h3
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                style={{ fontFamily:"serif", fontSize:30, color:"hsl(39,52%,56%)", marginBottom:12 }}
              >
                {t("success.title")}
              </motion.h3>
              <motion.p
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                style={{ color:"hsl(0,0%,55%)", letterSpacing:"0.05em", fontSize:14, marginBottom:8 }}
              >
                {t("success.message")}
              </motion.p>
              <motion.p
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
                style={{ color:"hsl(0,0%,80%)", letterSpacing:"0.05em", fontSize:14, marginBottom:32 }}
              >
                {t("success.emailNote")}
              </motion.p>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }} style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:32 }}>
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} animate={{ scale:[1,1.3,1], opacity:[0.5,1,0.5] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.2 }}>
                    <Sparkles size={16} style={{ color:"hsla(39,52%,56%,0.6)" }} />
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
                onClick={onClose}
                style={{ fontFamily:"sans-serif", fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:"hsl(39,52%,56%)", border:"1px solid hsl(39,52%,56%)", padding:"12px 32px", display:"flex", alignItems:"center", gap:8, margin:"0 auto", background:"transparent", cursor:"pointer" }}
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

// ─── Field components ────────────────────────────────────────────────────────

const FieldError = ({ message }: { message?: string }) => {
  const { t } = useTranslation("trade");
  return message ? (
    <p className="mt-1 text-destructive font-sans-nav text-[10px] tracking-wider">
      {message.startsWith("validation.") ? t(`form.${message}`) : message}
    </p>
  ) : null;
};

// ─── TradeGate ───────────────────────────────────────────────────────────────

const TradeGate = () => {
  const { t } = useTranslation("trade");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TradeApplicationData>({
    resolver: zodResolver(tradeApplicationSchema),
  });

  const onSubmit = async (data: TradeApplicationData) => {
    const { error } = await supabase
      .from("trade_applications")
      .insert({
        full_name:          data.full_name,
        professional_title: data.professional_title,
        property_name:      data.property_name,
        property_type:      data.property_type,
        market_country:     data.market_country,
        annual_spend:       data.annual_spend,
        referral_source:    data.referral_source,
        requirements:       data.requirements,
        tos_accepted:       data.tos_accepted,
        privacy_accepted:   data.privacy_accepted,
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
      <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} context="trade" />

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 1: Name + Title */}
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
                  dangerouslySetInnerHTML={{ __html: t("form.fields.professionalTitle.label") }}
                />
                <input
                  {...register("professional_title")}
                  className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                  placeholder={t("form.fields.professionalTitle.placeholder")}
                />
                <FieldError message={errors.professional_title?.message} />
              </div>
            </div>

            {/* Row 2: Property + Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: t("form.fields.propertyName.label") }}
                />
                <input
                  {...register("property_name")}
                  className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                  placeholder={t("form.fields.propertyName.placeholder")}
                />
                <FieldError message={errors.property_name?.message} />
              </div>
              <div>
                <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: t("form.fields.propertyType.label") }}
                />
                <select
                  {...register("property_type")}
                  className="w-full bg-background border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200 appearance-none"
                >
                  <option value="">{t("form.fields.propertyType.placeholder")}</option>
                  <option value="hotel">{t("form.fields.propertyType.options.hotel")}</option>
                  <option value="restaurant">{t("form.fields.propertyType.options.restaurant")}</option>
                  <option value="wine_bar">{t("form.fields.propertyType.options.wine_bar")}</option>
                  <option value="retailer">{t("form.fields.propertyType.options.retailer")}</option>
                  <option value="distributor">{t("form.fields.propertyType.options.distributor")}</option>
                  <option value="other">{t("form.fields.propertyType.options.other")}</option>
                </select>
                <FieldError message={errors.property_type?.message} />
              </div>
            </div>

            {/* Row 3: Market */}
            <div>
              <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                dangerouslySetInnerHTML={{ __html: t("form.fields.marketCountry.label") }}
              />
              <input
                {...register("market_country")}
                className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                placeholder={t("form.fields.marketCountry.placeholder")}
              />
              <FieldError message={errors.market_country?.message} />
            </div>

            {/* Row 4: Annual Spend */}
            <div>
              <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                dangerouslySetInnerHTML={{ __html: t("form.fields.annualSpend.label") }}
              />
              <select
                {...register("annual_spend")}
                className="w-full bg-background border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200 appearance-none"
              >
                <option value="">{t("form.fields.annualSpend.placeholder")}</option>
                <option value="under_50k">{t("form.fields.annualSpend.options.under_50k")}</option>
                <option value="50k_150k">{t("form.fields.annualSpend.options.50k_150k")}</option>
                <option value="150k_500k">{t("form.fields.annualSpend.options.150k_500k")}</option>
                <option value="over_500k">{t("form.fields.annualSpend.options.over_500k")}</option>
              </select>
              <FieldError message={errors.annual_spend?.message} />
            </div>

            {/* Row 5: Referral source */}
            <div>
              <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                dangerouslySetInnerHTML={{ __html: t("form.fields.referralSource.label") }}
              />
              <input
                {...register("referral_source")}
                className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                placeholder={t("form.fields.referralSource.placeholder")}
              />
              <FieldError message={errors.referral_source?.message} />
            </div>

            {/* Row 6: Requirements */}
            <div>
              <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2"
                dangerouslySetInnerHTML={{ __html: t("form.fields.requirements.label") }}
              />
              <textarea
                {...register("requirements")}
                rows={3}
                className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200 resize-none"
                placeholder={t("form.fields.requirements.placeholder")}
              />
              <FieldError message={errors.requirements?.message} />
            </div>

            {/* Gold separator */}
            <div className="gold-line w-full" />

            {/* Checkboxes */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("tos_accepted")}
                  className="mt-0.5 w-4 h-4 border border-border bg-transparent accent-primary shrink-0"
                />
                <span className="font-sans-nav text-[11px] tracking-[0.1em] text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  {t("form.checkboxes.tos")}{" "}
                  <Link to="/legal/trade-tos" className="text-primary underline underline-offset-2">
                    {t("form.checkboxes.tosLink")}
                  </Link>
                </span>
              </label>
              <FieldError message={errors.tos_accepted?.message} />

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("privacy_accepted")}
                  className="mt-0.5 w-4 h-4 border border-border bg-transparent accent-primary shrink-0"
                />
                <span className="font-sans-nav text-[11px] tracking-[0.1em] text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  {t("form.checkboxes.privacy")}{" "}
                  <Link to="/legal/privacy" className="text-primary underline underline-offset-2">
                    {t("form.checkboxes.privacyLink")}
                  </Link>
                </span>
              </label>
              <FieldError message={errors.privacy_accepted?.message} />
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
                  {t("form.submit.sending")}
                </span>
              ) : (
                t("form.submit.default")
              )}
            </MagneticButton>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center font-sans-nav text-[10px] tracking-wider text-muted-foreground">
            {t("footer.alreadyApproved")}{" "}
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

export default TradeGate;
