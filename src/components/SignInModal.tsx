import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Mail, ArrowRight, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useHoverSound } from "@/hooks/use-sound";

import { useTranslation } from "react-i18next";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: "trade" | "society" | "corporate";
}

const SignInModal = ({ isOpen, onClose, context = "trade" }: SignInModalProps) => {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onMouseEnter: playHoverSound } = useHoverSound();

  const config = {
    title: t(`signInModal.${context}.title`),
    subtitle: t(`signInModal.${context}.subtitle`),
    placeholder: t(`signInModal.${context}.placeholder`),
    buttonText: t(`signInModal.${context}.buttonText`),
    successTitle: t(`signInModal.${context}.successTitle`),
    successMessage: t(`signInModal.${context}.successMessage`),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (signInError) {
        setError(t("ui.errorSendingLink"));
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError(t("ui.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setEmail("");
      setIsSuccess(false);
      setError(null);
    }, 300);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ backgroundColor: "hsla(0,0%,5%,0.9)", backdropFilter: "blur(20px)" }}
          onClick={handleClose}
        >
          {/* Ambient glow */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, hsla(39,52%,56%,0.15) 0%, transparent 70%)",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              onMouseEnter={playHoverSound}
              className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {/* Glass card */}
            <div
              className="relative p-8 md:p-10"
              style={{
                background: "hsla(0,0%,8%,0.95)",
                border: "1px solid hsla(39,52%,56%,0.2)",
                boxShadow: "0 0 60px hsla(39,52%,56%,0.1)",
              }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-primary/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-primary/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-primary/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-primary/30" />

              {!isSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 20, delay: 0.1 }}
                      className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg,hsla(39,52%,56%,0.2),hsla(39,52%,56%,0.05))",
                        border: "1px solid hsla(39,52%,56%,0.3)",
                      }}
                    >
                      <Mail size={24} className="text-primary" />
                    </motion.div>
                    <h2 className="font-serif text-2xl md:text-3xl mb-2">{config.title}</h2>
                    <p className="text-sm text-muted-foreground tracking-wider">{config.subtitle}</p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                        {t("ui.emailAddress")}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={config.placeholder}
                        required
                        className="w-full bg-transparent border-b border-border py-3 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-200"
                        disabled={isLoading}
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-destructive text-sm text-center"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      onMouseEnter={playHoverSound}
                      className="w-full font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary px-8 py-4 hover:bg-primary hover:text-primary-foreground transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {t("ui.sending")}
                        </>
                      ) : (
                        <>
                          {config.buttonText}
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Note */}
                  <p className="mt-6 text-center text-xs text-muted-foreground/70">
                    {t("ui.secureSignInNote")}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 20, delay: 0.1 }}
                    className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,hsla(39,52%,56%,0.2),hsla(39,52%,56%,0.05))",
                      border: "1px solid hsla(39,52%,56%,0.4)",
                    }}
                  >
                    <CheckCircle2 size={28} className="text-primary" />
                  </motion.div>

                  <h3 className="font-serif text-2xl mb-3" style={{ color: "hsl(39,52%,56%)" }}>
                    {config.successTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {config.successMessage}
                  </p>

                  <button
                    onClick={handleClose}
                    onMouseEnter={playHoverSound}
                    className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary border border-primary/40 px-6 py-3 hover:border-primary transition-colors duration-200"
                  >
                    {t("ui.close")}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SignInModal;
