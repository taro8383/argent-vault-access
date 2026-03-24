import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Wine, MessageCircle, BarChart2, Send, ExternalLink, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AccountManager {
  id: string;
  full_name: string;
  title: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  calendar_url: string | null;
}

interface Wine {
  id: string;
  name: string;
  vintage: string;
}

type ContactMode = "tasting" | "sample" | "question" | "market_report" | null;

const ContactCard = ({
  icon: Icon,
  title,
  manager,
  description,
  action,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  manager: AccountManager | null;
  description: string;
  action: string;
  onClick: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-glass hover:bg-glass-strong transition-colors duration-300 p-7 flex flex-col gap-5 cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 border border-primary/40 flex items-center justify-center group-hover:border-primary transition-colors duration-300">
        <Icon size={18} className="text-primary" />
      </div>
    </div>

    <div>
      <h3 className="font-serif text-xl mb-1">{title}</h3>
      {manager && (
        <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary mb-3">
          {manager.full_name} · {manager.title}
        </p>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>

    <div className="mt-auto font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary border-b border-primary/30 pb-0.5 w-fit">
      {action} →
    </div>
  </motion.div>
);

const TradeContact = () => {
  const { user } = useAuth();
  const [manager, setManager]     = useState<AccountManager | null>(null);
  const [wines, setWines]         = useState<Wine[]>([]);
  const [mode, setMode]           = useState<ContactMode>(null);
  const [msg, setMsg]             = useState("");
  const [topic, setTopic]         = useState("");
  const [deadline, setDeadline]   = useState("");
  const [selectedWines, setSel]   = useState<string[]>([]);
  const [purpose, setPurpose]     = useState("");
  const [submitting, setSubmit]   = useState(false);
  const [sent, setSent]           = useState(false);

  useEffect(() => {
    const load = async () => {
      // Get the user's preferred partner account manager (or default)
      if (user) {
        const { data: partner } = await supabase
          .from("preferred_partners")
          .select("account_manager_id")
          .eq("user_id", user.id)
          .single();

        const managerId = partner?.account_manager_id;
        if (managerId) {
          const { data: am } = await supabase.from("account_managers").select("*").eq("id", managerId).single();
          if (am) { setManager(am as AccountManager); }
        } else {
          // Default: first account manager
          const { data: am } = await supabase.from("account_managers").select("*").limit(1).single();
          if (am) setManager(am as AccountManager);
        }
      }

      const { data: winesData } = await supabase
        .from("wines")
        .select("id, name, vintage")
        .order("sort_order");
      if (winesData) setWines(winesData as Wine[]);
    };
    load();
  }, [user]);

  const openSheet = (m: ContactMode) => {
    setMode(m);
    setMsg(""); setTopic(""); setDeadline(""); setSel([]); setPurpose("");
    setSent(false);
  };

  const submit = async () => {
    if (!user || !mode) return;
    setSubmit(true);

    let messageBody = msg;
    if (mode === "sample") {
      messageBody = `Wine sample request:\nWines: ${selectedWines.join(", ")}\nPurpose: ${purpose}\n\n${msg}`;
    }
    if (mode === "market_report") {
      messageBody = `Market report request:\nTopic: ${topic}\nDeadline: ${deadline}\n\nDetails: ${msg}`;
    }

    await supabase.from("direct_contact_requests").insert({
      user_id:      user.id,
      type:         mode,
      message:      messageBody,
      preferred_date: deadline || undefined,
      wine_ids:     selectedWines.length > 0 ? selectedWines : undefined,
    });

    setSent(true);
    setSubmit(false);
  };

  const sheetTitles: Record<string, string> = {
    tasting:      "Book a Tasting",
    sample:       "Request Samples",
    question:     "Send a Message",
    market_report: "Request a Market Report",
  };

  return (
    <>
      {/* Contact Sheet */}
      <Sheet open={!!mode} onOpenChange={() => setMode(null)}>
        <SheetContent side="right" className="w-full max-w-lg bg-background border-l border-border overflow-y-auto">
          {mode && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="font-serif text-2xl text-foreground text-left">
                  {sheetTitles[mode]}
                </SheetTitle>
                <div className="gold-line w-12" />
              </SheetHeader>

              {sent ? (
                <div className="py-12 text-center">
                  <p className="font-serif text-2xl text-primary mb-3">Request Sent</p>
                  <p className="text-sm text-muted-foreground tracking-wider">
                    {manager?.full_name ?? "Your account manager"} will be in touch shortly.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Tasting: calendar embed or date picker */}
                  {mode === "tasting" && manager?.calendar_url && (
                    <a
                      href={manager.calendar_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-sans-nav text-[11px] tracking-[0.25em] uppercase border border-primary text-primary px-4 py-3 hover:bg-primary hover:text-primary-foreground transition-colors w-fit"
                    >
                      <ExternalLink size={12} />
                      Book via Calendar →
                    </a>
                  )}

                  {/* Sample: wine multi-select */}
                  {mode === "sample" && (
                    <>
                      <div>
                        <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                          Select Wines
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {wines.map((w) => (
                            <label key={w.id} className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={selectedWines.includes(w.id)}
                                onChange={(e) => setSel((prev) =>
                                  e.target.checked ? [...prev, w.id] : prev.filter((id) => id !== w.id)
                                )}
                                className="accent-primary"
                              />
                              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                {w.name} {w.vintage}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                          Purpose
                        </label>
                        <select
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="w-full bg-background border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary appearance-none"
                        >
                          <option value="">Select…</option>
                          <option value="training">Staff Training</option>
                          <option value="menu_trial">Menu Trial</option>
                          <option value="press">Press / Media</option>
                          <option value="event">Event</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Market report: topic + deadline */}
                  {mode === "market_report" && (
                    <>
                      <div>
                        <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                          Market / Topic
                        </label>
                        <input
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors"
                          placeholder="e.g. Malbec in Southeast Asia 2025"
                        />
                      </div>
                      <div>
                        <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                          Desired Deadline
                        </label>
                        <input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full bg-transparent border-b border-border py-2.5 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary"
                        />
                      </div>
                    </>
                  )}

                  {/* Message for all modes */}
                  <div>
                    <label className="block font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                      {mode === "question" ? "Your Message" : "Additional Details"}
                    </label>
                    <Textarea
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      placeholder="…"
                      className="bg-transparent border-border text-foreground text-sm"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="w-full font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary py-3 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={12} />}
                    {submitting ? "Sending…" : "Send Request →"}
                  </button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <div>
        {/* Header */}
        <div className="mb-10">
          <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Contact</p>
          <h1 className="font-serif text-3xl md:text-4xl">Direct Contact</h1>
        </div>
        <div className="gold-line w-full mb-10" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ContactCard
            icon={Calendar}
            title="Book a Tasting"
            manager={manager}
            description="Schedule a private tasting at your property or ours."
            action="Book a Time"
            onClick={() => openSheet("tasting")}
          />
          <ContactCard
            icon={Wine}
            title="Request a Sample"
            manager={manager}
            description="Request bottles for team training or menu evaluation."
            action="Request Samples"
            onClick={() => openSheet("sample")}
          />
          <ContactCard
            icon={MessageCircle}
            title="Ask a Question"
            manager={manager}
            description="Any question about our portfolio, pricing, or logistics."
            action="Send a Message"
            onClick={() => openSheet("question")}
          />
          <ContactCard
            icon={BarChart2}
            title="Request a Market Report"
            manager={manager}
            description="Commission a bespoke analysis for your market or category."
            action="Make a Request"
            onClick={() => openSheet("market_report")}
          />
        </div>
      </div>
    </>
  );
};

export default TradeContact;
