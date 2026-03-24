import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo 1.svg";
import SignInModal from "@/components/SignInModal";

// ─── Waiting List Form ────────────────────────────────────────────────────────

const WaitingListForm = () => {
  const { t } = useTranslation("society");
  const [form, setForm] = useState({ first_name: "", email: "", country: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fullName = form.first_name.trim();
    const email    = form.email.trim();
    const country  = form.country.trim();

    if (!fullName || !email) {
      setError(t("waitingList.validation.required"));
      setIsSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("society_waitlist")
      .insert({ email, full_name: fullName, country: country || null });

    if (dbError && dbError.code !== "23505") {
      // 23505 = unique violation (already on list) — treat as success
      setError(t("waitingList.validation.error"));
      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-4"
      >
        <CheckCircle2 size={24} className="text-primary mx-auto mb-3" />
        <p className="font-serif text-xl text-foreground mb-2">{t("waitingList.success.title")}</p>
        <p className="font-sans-nav text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {t("waitingList.success.message")}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
      className="bg-glass-strong p-8 w-full max-w-md mx-auto mt-10"
    >
      <h2 className="font-serif text-2xl mb-2 text-center">{t("waitingList.title")}</h2>
      <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-6">
        {t("waitingList.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              {t("waitingList.fields.firstName.label")}
            </label>
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              required
              className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
              placeholder={t("waitingList.fields.firstName.placeholder")}
            />
          </div>
          <div>
            <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              {t("waitingList.fields.country.label")}
            </label>
            <input
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
              placeholder={t("waitingList.fields.country.placeholder")}
            />
          </div>
        </div>

        <div>
          <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
            {t("waitingList.fields.email.label")}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
            placeholder={t("waitingList.fields.email.placeholder")}
          />
        </div>

        {error && (
          <p className="text-destructive font-sans-nav text-[10px] tracking-wider">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary px-8 py-4 hover:bg-primary hover:text-primary-foreground transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>{t("waitingList.submit")} <ChevronRight size={14} /></>
          )}
        </button>
      </form>
    </motion.div>
  );
};

// ─── Invite State ─────────────────────────────────────────────────────────────

type InviteStatus = "idle" | "validating" | "valid" | "invalid";

const InvitePanel = ({ token, navigate }: { token: string; navigate: ReturnType<typeof useNavigate> }) => {
  const { t } = useTranslation("society");
  const [status, setStatus] = useState<InviteStatus>("validating");
  const [tokenData, setTokenData] = useState<{ tier?: string; email?: string } | null>(null);

  useEffect(() => {
    const validate = async () => {
      const { data, error } = await supabase.functions.invoke("validate-invite-token", {
        body: { token },
      });

      if (error || !data?.valid) {
        setStatus("invalid");
        return;
      }

      // Store token in sessionStorage so SocietyApply can pick it up
      sessionStorage.setItem("society_invite_token", token);
      if (data.tier)  sessionStorage.setItem("gc_invite_tier",  data.tier);
      if (data.email) sessionStorage.setItem("gc_invite_email", data.email);

      setTokenData({ tier: data.tier ?? undefined, email: data.email ?? undefined });
      setStatus("valid");
    };

    validate();
  }, [token]);

  if (status === "validating") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 size={24} className="text-primary animate-spin" />
        <p className="font-sans-nav text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
          {t("invite.validating")}
        </p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-glass-strong border border-destructive/40 p-8 max-w-md mx-auto mt-10 text-center"
      >
        <XCircle size={32} className="text-destructive mx-auto mb-4" />
        <h3 className="font-serif text-xl mb-3">{t("invite.invalid.title")}</h3>
        <p className="text-sm text-muted-foreground tracking-wider leading-relaxed">
          {t("invite.invalid.message")}
        </p>
        <Link
          to="/#contact"
          className="inline-block mt-6 font-sans-nav text-[11px] tracking-[0.3em] uppercase text-primary border border-primary/40 px-6 py-2.5 hover:border-primary transition-colors duration-200"
        >
          {t("invite.invalid.contact")}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="bg-glass-strong p-8 md:p-12 max-w-md mx-auto mt-10"
    >
      {/* Validation badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-2 mb-6 px-4 py-2 border border-primary/30 bg-primary/5"
      >
        <CheckCircle2 size={14} className="text-primary" />
        <span className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary">
          {t("invite.valid.badge")}
        </span>
      </motion.div>

      <div className="text-center">
        <h2 className="font-serif text-3xl mb-3">{t("invite.valid.title")}</h2>
        <div className="gold-line w-12 mx-auto mb-5" />
        <p className="text-sm text-muted-foreground tracking-wider leading-relaxed mb-8">
          {t("invite.valid.description")}
          {tokenData?.email && (
            <span className="block mt-2 text-foreground/70">
              {t("invite.valid.emailNote")} <span className="text-primary">{tokenData.email}</span>
            </span>
          )}
        </p>

        <button
          onClick={() => navigate(`/society/apply${window.location.search}`)}
          className="w-full font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary px-8 py-4 hover:bg-primary hover:text-primary-foreground transition-colors duration-500 flex items-center justify-center gap-3"
        >
          {t("invite.valid.button")}
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── SocietyGate ─────────────────────────────────────────────────────────────

const SocietyGate = () => {
  const { t } = useTranslation("society");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get("invite");
  const hasInvite = Boolean(inviteToken);
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-25"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 10%, hsla(0,82%,17%,0.5) 0%, transparent 60%)" }}
      />

      {/* Logo row */}
      <div className="w-full px-6 md:px-10 pt-8 pb-4 flex items-center justify-between relative z-10">
        <Link to="/">
          <img src={logo} alt="GC Wines" className="w-24 h-auto" />
        </Link>
        <Link
          to="/"
          className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {t("public.backToSite")}
        </Link>
      </div>

      {/* Hero editorial block */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 py-12 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-sans-nav text-xs tracking-[0.5em] uppercase text-primary mb-6">
            {t("public.eyebrow")}
          </p>
          <h1 className="font-serif text-5xl md:text-6xl italic mb-5">
            {t("public.title")}
          </h1>
          <div className="gold-line w-16 mx-auto mb-8" />

          <AnimatePresence mode="wait">
            {!hasInvite && (
              <motion.div
                key="public"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-sans-nav text-sm font-light tracking-wider text-muted-foreground max-w-lg mx-auto leading-relaxed mb-3">
                  {t("public.description")}
                </p>
                <p className="font-sans-nav text-sm font-light tracking-wider text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  {t("public.scarcity")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Invite panel or waitlist */}
        {hasInvite ? (
          <InvitePanel token={inviteToken!} navigate={navigate} />
        ) : (
          <WaitingListForm />
        )}

        {/* Already a member */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 font-sans-nav text-[10px] tracking-wider text-muted-foreground"
        >
          {t("footer.alreadyMember")}{" "}
          <button
            onClick={() => setShowSignIn(true)}
            className="text-primary hover:underline"
          >
            {t("footer.signIn")}
          </button>
        </motion.p>
      </div>
      <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} context="society" />
    </div>
  );
};

export default SocietyGate;
