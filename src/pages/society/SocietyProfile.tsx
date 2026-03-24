import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit2, Check, X, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { TierBadge } from "@/components/TierBadge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface SocietyMember {
  id:                 string;
  tier:               string;
  member_since:       string;
  delivery_address:   { line1: string; line2?: string; city: string; state: string; postcode: string; country: string };
  alt_address:        { line1: string; line2?: string; city: string; state: string; postcode: string; country: string } | null;
  preferred_window:   string;
  building_access:    string | null;
  storage_type:       string;
  birth_date:         string;
  annual_fee_aud:     number;
  next_billing_date:  string | null;
  stripe_customer_id: string;
}

const WINDOW_LABELS: Record<string, string> = {
  morning:   "Morning (8am – 12pm)",
  afternoon: "Afternoon (12pm – 5pm)",
  evening:   "Evening (5pm – 9pm)",
  any:       "Any time",
};

const STORAGE_LABELS: Record<string, string> = {
  cellar:  "Temperature-controlled cellar",
  fridge:  "Wine fridge",
  ambient: "Ambient storage (cool, dark room)",
  mixed:   "Mixed",
};

const TIER_LABELS: Record<string, string> = {
  founding:  "Founding Member",
  private:   "Private Member",
  collector: "Collector Member",
};

const inputCls = "w-full bg-transparent border-b border-border py-2 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors";
const labelCls = "block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1";

const SocietyProfile = () => {
  const { user, profile, signOut } = useAuth();

  const [member, setMember]     = useState<SocietyMember | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);

  // Editable delivery fields
  const [line1, setLine1]           = useState("");
  const [line2, setLine2]           = useState("");
  const [city, setCity]             = useState("");
  const [state, setState_]          = useState("");
  const [postcode, setPostcode]     = useState("");
  const [country, setCountry]       = useState("");
  const [window_, setWindow]        = useState("any");
  const [building, setBuilding]     = useState("");
  const [storage, setStorage]       = useState("ambient");

  const [upgradeSheet, setUpgradeSheet] = useState(false);
  const [upgradeMsg, setUpgradeMsg]     = useState("");
  const [upgradeSent, setUpgradeSent]   = useState(false);
  const [sendingUpgrade, setSendUpgrade] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("society_members")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const m = data as SocietyMember;
          setMember(m);
          // Prefill editable fields
          setLine1(m.delivery_address.line1);
          setLine2(m.delivery_address.line2 ?? "");
          setCity(m.delivery_address.city);
          setState_(m.delivery_address.state);
          setPostcode(m.delivery_address.postcode);
          setCountry(m.delivery_address.country);
          setWindow(m.preferred_window ?? "any");
          setBuilding(m.building_access ?? "");
          setStorage(m.storage_type);
        }
        setLoading(false);
      });
  }, [user]);

  const saveDelivery = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("society_members").update({
      delivery_address: { line1, line2: line2 || undefined, city, state, postcode, country },
      preferred_window: window_,
      building_access:  building || null,
      storage_type:     storage,
    }).eq("id", user.id);
    setMember((prev) => prev ? { ...prev, delivery_address: { line1, line2, city, state, postcode, country }, preferred_window: window_, building_access: building || null, storage_type: storage } : prev);
    setSaving(false);
    setEditing(false);
  };

  const cancelEdit = () => {
    if (!member) return;
    setLine1(member.delivery_address.line1);
    setLine2(member.delivery_address.line2 ?? "");
    setCity(member.delivery_address.city);
    setState_(member.delivery_address.state);
    setPostcode(member.delivery_address.postcode);
    setCountry(member.delivery_address.country);
    setWindow(member.preferred_window ?? "any");
    setBuilding(member.building_access ?? "");
    setStorage(member.storage_type);
    setEditing(false);
  };

  const sendUpgradeEnquiry = async () => {
    if (!user) return;
    setSendUpgrade(true);
    await supabase.from("direct_contact_requests").insert({
      user_id: user.id,
      type:    "upgrade",
      message: upgradeMsg.trim() || `Member enquires about upgrading from ${member?.tier ?? "current"} tier.`,
    });
    setUpgradeSent(true);
    setSendUpgrade(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return <div className="py-20 text-center"><p className="text-muted-foreground">Member profile not found.</p></div>;
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Account</p>
        <h1 className="font-serif text-3xl md:text-4xl">Profile</h1>
        <div className="gold-line w-full mt-4" />
      </div>

      {/* Personal details (read-only) */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-glass p-6 md:p-8">
        <h2 className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-5">Personal Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className={labelCls}>Full Name</p>
            <p className="text-sm text-foreground tracking-wider">{profile?.full_name ?? "—"}</p>
          </div>
          <div>
            <p className={labelCls}>Email</p>
            <p className="text-sm text-foreground tracking-wider">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className={labelCls}>Age Verified</p>
            <p className="text-sm text-foreground tracking-wider">
              {member.birth_date ? `✓ 18+ verified (DOB: ${new Date(member.birth_date).toLocaleDateString("en-AU")})` : "—"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Delivery profile */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-glass p-6 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Delivery Profile</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary hover:opacity-80 transition-opacity"
            >
              <Edit2 size={11} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
              <button
                onClick={saveDelivery}
                disabled={saving}
                className="flex items-center gap-1.5 font-sans-nav text-[10px] tracking-[0.2em] uppercase border border-primary text-primary px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Check size={11} /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Address Line 1</label>
                <input value={line1} onChange={(e) => setLine1(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address Line 2</label>
                <input value={line2} onChange={(e) => setLine2(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input value={state} onChange={(e) => setState_(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Postcode</label>
                <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Preferred Delivery Window</label>
              <select value={window_} onChange={(e) => setWindow(e.target.value)} className="w-full bg-background border-b border-border py-2 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary appearance-none">
                {Object.entries(WINDOW_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Building Access</label>
              <input value={building} onChange={(e) => setBuilding(e.target.value)} className={inputCls} placeholder="Optional" />
            </div>
            <div>
              <label className={labelCls}>Storage Type</label>
              <select value={storage} onChange={(e) => setStorage(e.target.value)} className="w-full bg-background border-b border-border py-2 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary appearance-none">
                {Object.entries(STORAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className={labelCls}>Primary Address</p>
              <p className="text-sm text-foreground tracking-wider leading-relaxed">
                {member.delivery_address.line1}{member.delivery_address.line2 ? `, ${member.delivery_address.line2}` : ""}<br />
                {member.delivery_address.city}, {member.delivery_address.state} {member.delivery_address.postcode}<br />
                {member.delivery_address.country}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <p className={labelCls}>Preferred Window</p>
                <p className="text-sm text-foreground tracking-wider">{WINDOW_LABELS[member.preferred_window] ?? member.preferred_window}</p>
              </div>
              {member.building_access && (
                <div>
                  <p className={labelCls}>Building Access</p>
                  <p className="text-sm text-foreground tracking-wider">{member.building_access}</p>
                </div>
              )}
              <div>
                <p className={labelCls}>Storage Type</p>
                <p className="text-sm text-foreground tracking-wider">{STORAGE_LABELS[member.storage_type] ?? member.storage_type}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Membership details */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-glass p-6 md:p-8">
        <h2 className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-5">Membership Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div>
            <p className={labelCls}>Tier</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-foreground tracking-wider">{TIER_LABELS[member.tier] ?? member.tier}</p>
              <TierBadge tier={member.tier as any} />
            </div>
          </div>
          <div>
            <p className={labelCls}>Member Since</p>
            <p className="text-sm text-foreground tracking-wider">
              {new Date(member.member_since).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div>
            <p className={labelCls}>Annual Fee</p>
            <p className="text-sm text-primary tracking-wider">AUD ${member.annual_fee_aud.toLocaleString()}</p>
          </div>
          {member.next_billing_date && (
            <div>
              <p className={labelCls}>Next Billing Date</p>
              <p className="text-sm text-foreground tracking-wider">
                {new Date(member.next_billing_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            /* Stripe Customer Portal redirect — handled via Edge Function in Phase 4 */
            console.log("Redirect to Stripe Customer Portal");
          }}
          className="flex items-center gap-2 font-sans-nav text-[10px] tracking-[0.25em] uppercase border border-border text-muted-foreground px-4 py-2.5 hover:border-primary hover:text-primary transition-colors"
        >
          <CreditCard size={12} />
          Manage Billing →
        </button>
      </motion.div>

      {/* Tier upgrade — if not collector */}
      {member.tier !== "collector" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-glass border border-primary/20 p-6 md:p-8">
          <h2 className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary mb-3">Upgrade Your Membership</h2>
          <p className="font-serif text-xl mb-2">
            {member.tier === "founding" ? "Step up to Private Member" : "Elevate to Collector Member"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg">
            {member.tier === "founding"
              ? "Private membership adds a second private tasting annually, additional purchase access, and an annual dinner invitation."
              : "Collector membership unlocks monthly allocations, unlimited tastings, cellar consultation, and bespoke sourcing."}
          </p>

          {!upgradeSheet ? (
            <button
              onClick={() => setUpgradeSheet(true)}
              className="font-sans-nav text-[10px] tracking-[0.3em] uppercase border border-primary text-primary px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Enquire About Upgrading →
            </button>
          ) : upgradeSent ? (
            <p className="text-sm text-primary">Enquiry sent. We will be in touch shortly.</p>
          ) : (
            <div className="space-y-4 max-w-lg">
              <Textarea
                value={upgradeMsg}
                onChange={(e) => setUpgradeMsg(e.target.value)}
                className="bg-transparent border-border text-foreground text-sm"
                rows={3}
                placeholder="Any questions or comments about your upgrade…"
              />
              <button
                onClick={sendUpgradeEnquiry}
                disabled={sendingUpgrade}
                className="font-sans-nav text-[10px] tracking-[0.3em] uppercase border border-primary text-primary px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                {sendingUpgrade ? "Sending…" : "Submit Enquiry →"}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SocietyProfile;
