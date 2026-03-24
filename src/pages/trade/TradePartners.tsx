import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ExternalLink, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TierBadge } from "@/components/TierBadge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PartnerData {
  id: string;
  tier: "silver" | "gold" | "platinum";
  commitment_aud: number;
  actual_spend_aud: number;
  period_start: string;
  period_end: string;
  account_manager_id: string | null;
}

interface AccountManager {
  id: string;
  full_name: string;
  title: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  calendar_url: string | null;
}

const TIER_BENEFITS: Record<string, { used: boolean; label: string }[]> = {
  silver: [
    { used: true,  label: "Allocated wines access" },
    { used: false, label: "First-access allocation" },
    { used: false, label: "Private tasting invitation (1/yr)" },
  ],
  gold: [
    { used: true,  label: "Allocated wines access" },
    { used: true,  label: "First-access allocation" },
    { used: false, label: "Private tasting invitations (2/yr)" },
    { used: false, label: "Bespoke market report" },
  ],
  platinum: [
    { used: true,  label: "Allocated wines access" },
    { used: true,  label: "First-access allocation" },
    { used: false, label: "Unlimited private tasting invitations" },
    { used: false, label: "Bespoke market reports" },
    { used: false, label: "Annual dinner invitation" },
    { used: false, label: "Winemaker introductions" },
  ],
};

const TradePartners = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [manager, setManager] = useState<AccountManager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: pd } = await supabase
        .from("preferred_partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!pd) { setLoading(false); return; }
      setPartner(pd as PartnerData);

      if (pd.account_manager_id) {
        const { data: am } = await supabase
          .from("account_managers")
          .select("*")
          .eq("id", pd.account_manager_id)
          .single();
        if (am) setManager(am as AccountManager);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Partner Hub is available to preferred partners only.</p>
        <p className="text-sm text-muted-foreground/60 mt-2">Contact your account manager to discuss partnership tiers.</p>
      </div>
    );
  }

  const pct = partner.commitment_aud > 0
    ? Math.min(100, Math.round((partner.actual_spend_aud / partner.commitment_aud) * 100))
    : 0;

  const benefits = TIER_BENEFITS[partner.tier] ?? TIER_BENEFITS.silver;
  const tierMap: Record<string, string> = { silver: "Silver", gold: "Gold", platinum: "Platinum" };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Preferred Partner</p>
        <h1 className="font-serif text-3xl md:text-4xl">Your Partnership Status</h1>
      </div>
      <div className="gold-line w-full mb-10" />

      {/* Progress card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-glass-strong p-6 md:p-8 mb-10 relative"
      >
        <div className="absolute top-4 right-4">
          <TierBadge tier={partner.tier as any} />
        </div>

        <h3 className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Annual Commitment Progress
        </h3>

        <div className="flex flex-wrap gap-6 mb-4">
          <div>
            <p className="font-sans-nav text-[10px] tracking-wider text-muted-foreground mb-1">Committed</p>
            <p className="font-serif text-2xl text-foreground">AUD ${partner.commitment_aud.toLocaleString()}</p>
          </div>
          <div>
            <p className="font-sans-nav text-[10px] tracking-wider text-muted-foreground mb-1">Purchased</p>
            <p className="font-serif text-2xl text-primary">AUD ${partner.actual_spend_aud.toLocaleString()}</p>
          </div>
        </div>

        <Progress value={pct} className="h-1 mb-2 [&>div]:bg-primary" />
        <p className="font-sans-nav text-[10px] tracking-wider text-muted-foreground">
          {pct}% of annual commitment fulfilled
        </p>
        <p className="font-sans-nav text-[10px] tracking-wider text-muted-foreground/60 mt-1">
          Period: {new Date(partner.period_start).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })} –{" "}
          {new Date(partner.period_end).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-glass p-6"
        >
          <h3 className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-5">
            {tierMap[partner.tier]} Partner Benefits
          </h3>
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-4 h-4 flex items-center justify-center border shrink-0 ${b.used ? "border-primary bg-primary/10" : "border-border"}`}>
                  {b.used && <Check size={10} className="text-primary" />}
                </div>
                <span className={`text-sm tracking-wider ${b.used ? "text-foreground/60 line-through" : "text-foreground"}`}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account Manager */}
        {manager && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-glass p-6"
          >
            <h3 className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-5">
              Your Account Manager
            </h3>

            <div className="flex items-center gap-4 mb-5">
              {manager.avatar_url ? (
                <img src={manager.avatar_url} alt={manager.full_name} className="w-14 h-14 rounded-full border border-primary object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full border border-primary flex items-center justify-center bg-primary/10">
                  <span className="font-sans-nav text-sm text-primary">
                    {manager.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-serif text-xl">{manager.full_name}</p>
                <p className="font-sans-nav text-[10px] tracking-wider text-muted-foreground">{manager.title}</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <a href={`mailto:${manager.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                <Mail size={12} />
                {manager.email}
              </a>
              {manager.phone && (
                <a href={`tel:${manager.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                  <Phone size={12} />
                  {manager.phone}
                </a>
              )}
            </div>

            {manager.calendar_url && (
              <a
                href={manager.calendar_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.25em] uppercase border border-primary text-primary px-4 py-2.5 hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
              >
                <ExternalLink size={11} />
                Book a Meeting
              </a>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TradePartners;
