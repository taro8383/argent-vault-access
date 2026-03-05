import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Send, Lock, Check, User, Building2, Globe, Sparkles, Wine, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHoverSound } from "@/hooks/use-sound";
import { useToast } from "@/hooks/use-toast";

// Magnetic Button Component
interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
}

const MagneticButton = ({ children, onClick, type = "button", className = "", disabled = false }: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const { onMouseEnter: playHoverSound } = useHoverSound();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    setPosition({
      x: distanceX * 0.15,
      y: distanceY * 0.15,
    });
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
      playHoverSound();
    }
  }, [disabled, playHoverSound]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    onClick?.();
  }, [onClick, disabled]);

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`relative overflow-hidden ${className}`}
      disabled={disabled}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-20 h-20 rounded-full bg-primary/30 pointer-events-none"
          style={{
            left: ripple.x - 40,
            top: ripple.y - 40,
          }}
        />
      ))}

      <span className="relative block overflow-hidden h-[1.2em]">
        <motion.span
          className="block"
          animate={{ y: isHovered ? "-100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.span>
        <motion.span
          className="absolute top-full left-0 right-0 block"
          animate={{ y: isHovered ? "-100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.span>
      </span>
    </motion.button>
  );
};

// Animated Icon Component
const AnimatedIcon = ({
  icon: Icon,
  isFocused,
  isValid,
}: {
  icon: React.ElementType;
  isFocused: boolean;
  isValid: boolean;
}) => {
  return (
    <motion.div
      className="absolute left-0 top-3 text-muted-foreground"
      animate={{
        color: isFocused
          ? "hsl(39, 52%, 56%)"
          : isValid
          ? "hsl(39, 52%, 56%)"
          : "hsl(0, 0%, 45%)",
        x: isFocused ? 4 : 0,
        scale: isFocused ? 1.15 : 1,
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Icon size={16} />
    </motion.div>
  );
};

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  icon: React.ElementType;
}

const FormField = ({ id, label, type = "text", value, onChange, required, icon }: FormFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const isActive = isFocused || hasValue;
  const isValid = hasValue && value.length >= 2;

  return (
    <div className="group relative">
      <AnimatedIcon icon={icon} isFocused={isFocused} isValid={isValid} />

      <label
        htmlFor={id}
        className={`
          font-sans-nav text-[10px] tracking-[0.3em] uppercase absolute
          transition-all duration-300 pointer-events-none origin-left
          ${isActive
            ? "-top-6 text-primary text-[8px] tracking-[0.2em] left-0"
            : "top-3 text-muted-foreground left-6"
          }
        `}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        className="w-full bg-transparent border-b py-3 pl-6 pr-8 text-sm text-foreground tracking-wider
          focus:outline-none transition-all duration-300
          placeholder:text-transparent
          focus:border-primary border-border"
        style={{
          boxShadow: isFocused
            ? "0 2px 0 0 hsl(39 52% 56%), 0 8px 20px -10px hsla(39, 52%, 56%, 0.3)"
            : "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: isValid && !isFocused ? 1 : 0,
          scale: isValid && !isFocused ? 1 : 0.5,
        }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-3 text-primary"
      >
        <Check size={14} />
      </motion.div>
    </div>
  );
};

// Auto-expanding Textarea Component
const AutoExpandingTextarea = ({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasValue = value.length > 0;
  const isActive = isFocused || hasValue;
  const isValid = hasValue && value.length >= 10;

  // Auto-expand on input
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className={`
          font-sans-nav text-[10px] tracking-[0.3em] uppercase absolute
          transition-all duration-300 pointer-events-none origin-left
          ${isActive
            ? "-top-6 text-primary text-[8px] tracking-[0.2em]"
            : "top-3 text-muted-foreground"
          }
        `}
      >
        {label}
      </label>

      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        rows={1}
        className="w-full bg-transparent border-b py-3 pr-8 text-sm text-foreground tracking-wider
          focus:outline-none transition-all duration-300 resize-none
          placeholder:text-transparent min-h-[80px]
          focus:border-primary border-border overflow-hidden"
        style={{
          boxShadow: isFocused
            ? "0 2px 0 0 hsl(39 52% 56%), 0 8px 20px -10px hsla(39, 52%, 56%, 0.3)"
            : "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: isValid && !isFocused ? 1 : 0,
          scale: isValid && !isFocused ? 1 : 0.5,
        }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-3 text-primary"
      >
        <Check size={14} />
      </motion.div>
    </div>
  );
};

// Celebratory Success Modal
const SuccessModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation("contact");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowConfetti(true), 200);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      setShowConfetti(false);
      // Restore body scroll
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: "hsla(0, 0%, 5%, 0.95)",
            backdropFilter: "blur(20px)",
          }}
          onClick={onClose}
        >
          {/* Confetti particles */}
          {showConfetti && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 0,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400 - 100,
                    opacity: 0,
                    scale: Math.random() * 0.5 + 0.5,
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 1.5 + Math.random(),
                    ease: "easeOut",
                    delay: Math.random() * 0.3,
                  }}
                  style={{
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: i % 2 === 0 ? "hsl(39, 52%, 56%)" : "hsl(0, 82%, 17%)",
                    left: "50%",
                    top: "50%",
                  }}
                />
              ))}
            </>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            style={{
              position: 'relative',
              maxWidth: '448px',
              width: '100%',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow ring */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '16px',
                background: "linear-gradient(135deg, hsla(39, 52%, 56%, 0.3), hsla(0, 82%, 17%, 0.3))",
                filter: "blur(40px)",
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div
              style={{
                position: 'relative',
                borderRadius: '4px',
                padding: '40px',
                background: "hsla(0, 0%, 8%, 0.95)",
                border: "1px solid hsla(39, 52%, 56%, 0.3)",
                boxShadow: "0 0 60px hsla(39, 52%, 56%, 0.2), inset 0 0 60px hsla(39, 52%, 56%, 0.05)",
              }}
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, delay: 0.1 }}
                style={{
                  margin: '0 auto 24px',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: "linear-gradient(135deg, hsla(39, 52%, 56%, 0.2), hsla(39, 52%, 56%, 0.1))",
                  border: "1px solid hsla(39, 52%, 56%, 0.4)",
                  boxShadow: "0 0 30px hsla(39, 52%, 56%, 0.3)",
                }}
              >
                <Wine size={32} style={{ color: 'hsl(39, 52%, 56%)' }} />
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontFamily: 'serif',
                  fontSize: '30px',
                  color: 'hsl(39, 52%, 56%)',
                  marginBottom: '12px',
                }}
              >
                {t('successModal.title')}
              </motion.h3>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  color: 'hsl(0, 0%, 55%)',
                  letterSpacing: '0.05em',
                  fontSize: '14px',
                  marginBottom: '8px',
                }}
              >
                {t('successModal.message')}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  color: 'hsl(0, 0%, 80%)',
                  letterSpacing: '0.05em',
                  fontSize: '14px',
                  marginBottom: '32px',
                }}
              >
                {t('successModal.response')}
                <span style={{ color: 'hsl(39, 52%, 56%)', fontWeight: 500 }}>{t('successModal.responseHighlight')}</span>
              </motion.p>

              {/* Sparkles */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '32px',
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    <Sparkles size={16} style={{ color: 'hsla(39, 52%, 56%, 0.6)' }} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'hsl(39, 52%, 56%)',
                  border: "1px solid hsl(39, 52%, 56%)",
                  padding: '12px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {t('successModal.button')}
                <ChevronRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ContactSection = () => {
  const { t } = useTranslation("contact");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    region: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Also show toast as backup
    toast({
      title: t("toast.title"),
      description: t("toast.description"),
    });

    setFormData({ name: "", company: "", region: "", message: "" });
  };

  const updateField = (key: keyof typeof formData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section id="contact" className="section-padding relative" ref={ref}>
      <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} />

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-4">
            {t("sectionTag")}
          </p>
          <h2 className="font-serif text-4xl md:text-6xl">{t("sectionTitle")}</h2>
          <motion.div
            className="gold-line w-16 mx-auto mt-6 mb-6"
            animate={{ scaleX: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
          <p className="text-sm text-muted-foreground tracking-wider">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          onSubmit={handleSubmit}
          className="space-y-10 pt-4"
        >
          <FormField
            id="name"
            label={t("form.name.label")}
            value={formData.name}
            onChange={updateField("name")}
            required
            icon={User}
          />

          <FormField
            id="company"
            label={t("form.company.label")}
            value={formData.company}
            onChange={updateField("company")}
            icon={Building2}
          />

          <FormField
            id="region"
            label={t("form.region.label")}
            value={formData.region}
            onChange={updateField("region")}
            required
            icon={Globe}
          />

          <AutoExpandingTextarea
            id="message"
            label={t("form.message.label")}
            value={formData.message}
            onChange={updateField("message")}
            required
          />

          <div className="flex items-center justify-between pt-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock size={12} />
              <span className="text-[10px] tracking-wider">{t("form.security")}</span>
            </div>
            <MagneticButton
              type="submit"
              disabled={isSubmitting}
              className="font-sans-nav text-xs tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 flex items-center gap-3 transition-colors duration-500 hover:bg-primary hover:text-primary-foreground group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <span className="flex items-center gap-3">
                  {t("form.submit")}
                  <Send size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </MagneticButton>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
