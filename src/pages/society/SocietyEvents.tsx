import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SocietyEvent {
  id:          string;
  title:       string;
  event_date:  string;
  location:    string;
  format:      string;
  tier_access: string[];
  capacity:    number | null;
  description: string | null;
  image_url:   string | null;
  is_past?:    boolean;
}

interface RSVP {
  event_id: string;
  status:   string;
}

const FORMAT_LABELS: Record<string, string> = {
  private_tasting:   "Private Tasting",
  annual_dinner:     "Annual Dinner",
  winemaker_dinner:  "Winemaker Dinner",
};

const TIER_ORDER: Record<string, number> = { founding: 0, private: 1, collector: 2 };

const SocietyEvents = () => {
  const { user } = useAuth();
  const [events, setEvents]         = useState<SocietyEvent[]>([]);
  const [rsvps, setRsvps]           = useState<RSVP[]>([]);
  const [memberTier, setTier]       = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [recap, setRecap]           = useState<SocietyEvent | null>(null);
  const [rsvping, setRsvping]       = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [eventsRes, memberRes, rsvpRes] = await Promise.all([
        supabase
          .from("society_events")
          .select("*")
          .order("event_date", { ascending: true }),
        supabase
          .from("society_members")
          .select("tier")
          .eq("id", user.id)
          .single(),
        supabase
          .from("society_event_rsvps")
          .select("event_id, status")
          .eq("member_id", user.id),
      ]);

      if (eventsRes.data) setEvents(eventsRes.data as SocietyEvent[]);
      if (memberRes.data) setTier(memberRes.data.tier);
      if (rsvpRes.data) setRsvps(rsvpRes.data as RSVP[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const rsvp = async (eventId: string) => {
    if (!user) return;
    setRsvping(eventId);
    await supabase.from("society_event_rsvps").upsert({
      event_id:  eventId,
      member_id: user.id,
      status:    "attending",
    }, { onConflict: "event_id,member_id" });
    setRsvps((prev) => [...prev.filter((r) => r.event_id !== eventId), { event_id: eventId, status: "attending" }]);
    setRsvping(null);
  };

  const hasRsvp = (eventId: string) => rsvps.some((r) => r.event_id === eventId && r.status === "attending");

  const tierAllows = (eventTiers: string[]) => {
    if (!memberTier) return false;
    const memberLevel = TIER_ORDER[memberTier] ?? 0;
    return eventTiers.some((t) => (TIER_ORDER[t] ?? 0) <= memberLevel);
  };

  const now     = new Date();
  const upcoming = events.filter((e) => new Date(e.event_date) >= now);
  const past     = events.filter((e) => new Date(e.event_date) < now);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Recap Sheet */}
      <Sheet open={!!recap} onOpenChange={() => setRecap(null)}>
        <SheetContent side="right" className="w-full max-w-lg bg-background border-l border-border overflow-y-auto">
          {recap && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="font-serif text-2xl text-foreground text-left">{recap.title}</SheetTitle>
                <div className="gold-line w-12" />
              </SheetHeader>
              <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                {new Date(recap.event_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}{recap.location}
              </p>
              {recap.description && (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{recap.description}</p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <div>
        {/* Header */}
        <div className="mb-6">
          <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Your Invitations</p>
          <h1 className="font-serif text-3xl md:text-4xl">Events</h1>
        </div>
        <div className="gold-line w-full mb-10" />

        {/* Upcoming events */}
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {upcoming.map((event, i) => {
              const accessible = tierAllows(event.tier_access);
              const rsvped     = hasRsvp(event.id);
              const loading    = rsvping === event.id;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={cn(
                    "bg-glass border border-border overflow-hidden group",
                    !accessible && "opacity-70"
                  )}
                >
                  {/* Event image */}
                  {event.image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-700",
                          accessible && "group-hover:scale-105",
                          "sepia-[30%]"
                        )}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-secondary/40 flex items-center justify-center">
                      <span className="font-serif text-5xl text-primary/20">✦</span>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Date badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-[hsl(var(--burgundy))] px-3 py-1.5">
                        <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-foreground">
                          {new Date(event.event_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="font-sans-nav text-[9px] tracking-[0.2em] uppercase border border-primary text-primary px-2 py-1">
                        {FORMAT_LABELS[event.format] ?? event.format}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl mb-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{event.location}</p>

                    {event.description && (
                      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4 line-clamp-2">{event.description}</p>
                    )}

                    {/* CTA */}
                    {accessible ? (
                      <button
                        onClick={() => !rsvped && rsvp(event.id)}
                        disabled={rsvped || loading}
                        className={cn(
                          "font-sans-nav text-[10px] tracking-[0.3em] uppercase px-4 py-2.5 flex items-center gap-2 transition-colors",
                          rsvped
                            ? "border border-primary text-primary cursor-default"
                            : "border border-primary/40 text-muted-foreground hover:border-primary hover:text-primary"
                        )}
                      >
                        {rsvped ? <><Check size={12} /> RSVP Confirmed</> : loading ? "Confirming…" : "RSVP →"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock size={12} />
                        <span className="font-sans-nav text-[10px] tracking-[0.3em] uppercase">
                          {event.tier_access.includes("collector") ? "Collector" : "Private"} Access Required
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-16">No upcoming events at this time. Check back soon.</p>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <div className="gold-line w-full mb-8" />
            <h2 className="font-serif text-2xl mb-6">Past Events</h2>
            <div className="space-y-3">
              {past.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-glass border border-border p-5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-serif text-base">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(event.event_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                      {" · "}{event.location}
                    </p>
                  </div>
                  {event.description && (
                    <button
                      onClick={() => setRecap(event)}
                      className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary border-b border-primary/30 pb-0.5 hover:border-primary transition-colors"
                    >
                      View recap →
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SocietyEvents;
