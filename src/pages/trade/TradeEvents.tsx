import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, MapPin, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignedDownload } from "@/components/SignedDownload";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface TastingEvent {
  id: string;
  title: string;
  event_date: string;
  location: string;
  format: string;
  wines_json: any[] | null;
  capacity: number | null;
  is_past: boolean;
  report_url: string | null;
}

interface EventInvite {
  event_id: string;
  status: string;
}

const FORMAT_LABELS: Record<string, string> = {
  trade_tasting: "Trade Tasting",
  masterclass:   "Masterclass",
  dinner:        "Private Dinner",
  virtual:       "Virtual",
};

const TradeEvents = () => {
  const { user } = useAuth();
  const [events, setEvents]         = useState<TastingEvent[]>([]);
  const [invites, setInvites]       = useState<EventInvite[]>([]);
  const [requestingId, setReqId]    = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  // Calendar: highlighted dates
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      const [evtRes, invRes] = await Promise.all([
        supabase.from("tasting_events").select("*").order("event_date"),
        user
          ? supabase.from("tasting_event_invites").select("event_id,status").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);
      if (evtRes.data) setEvents(evtRes.data);
      if (invRes.data) setInvites(invRes.data as EventInvite[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const inviteStatus = (eventId: string) =>
    invites.find((i) => i.event_id === eventId)?.status ?? null;

  const requestInvite = async (eventId: string) => {
    if (!user) return;
    setReqId(eventId);
    await supabase.from("tasting_event_invites").upsert({
      event_id: eventId,
      user_id: user.id,
      status: "requested",
    }, { onConflict: "event_id,user_id" });
    setInvites((prev) => {
      const filtered = prev.filter((i) => i.event_id !== eventId);
      return [...filtered, { event_id: eventId, status: "requested" }];
    });
    setReqId(null);
  };

  // Dates with events for calendar highlight
  const eventDates = events
    .filter((e) => !e.is_past)
    .map((e) => new Date(e.event_date));

  const upcoming = events.filter((e) => !e.is_past);
  const past     = events.filter((e) => e.is_past);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Events</p>
        <h1 className="font-serif text-3xl md:text-4xl">Tastings & Events</h1>
      </div>
      <div className="gold-line w-full mb-10" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
        {/* Calendar */}
        <div className="bg-glass p-6 self-start">
          <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary mb-4">Event Calendar</p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ event: eventDates }}
            modifiersClassNames={{
              event: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
            }}
            className="[&_.rdp-day]:relative"
          />
          <p className="font-sans-nav text-[9px] tracking-wider text-muted-foreground mt-3">
            Gold dots indicate scheduled events.
          </p>
        </div>

        {/* Events list */}
        <div>
          {/* Upcoming */}
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming events scheduled.</p>
          ) : (
            <div className="space-y-4 mb-12">
              {upcoming.map((evt, i) => {
                const status = inviteStatus(evt.id);
                const d = new Date(evt.event_date);

                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-glass hover:bg-glass-strong transition-colors duration-300 p-6 relative"
                  >
                    {/* Date badge */}
                    <div className="absolute top-4 right-4 bg-[hsl(var(--accent))] px-2 py-1 text-center">
                      <p className="font-sans-nav text-[10px] tracking-wider text-foreground">
                        {d.toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}
                      </p>
                    </div>

                    <h3 className="font-serif text-xl mb-2 pr-20">{evt.title}</h3>

                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin size={12} />
                        <span className="text-xs tracking-wider">{evt.location}</span>
                      </div>
                      <span className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary/70">
                        {FORMAT_LABELS[evt.format] ?? evt.format}
                      </span>
                    </div>

                    {evt.wines_json && Array.isArray(evt.wines_json) && evt.wines_json.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="font-sans-nav text-[9px] tracking-wider text-muted-foreground uppercase mr-1">Wines:</span>
                        {evt.wines_json.map((w: any, idx: number) => (
                          <span key={idx} className="text-[10px] border border-border px-2 py-0.5 text-muted-foreground">
                            {typeof w === "string" ? w : w.name ?? "Wine"}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => { if (!status) requestInvite(evt.id); }}
                      disabled={!!status || requestingId === evt.id}
                      className={cn(
                        "font-sans-nav text-[10px] tracking-[0.25em] uppercase flex items-center gap-2 transition-colors duration-200",
                        status
                          ? "text-primary cursor-default"
                          : "border border-border text-muted-foreground hover:border-primary hover:text-primary px-4 py-2"
                      )}
                    >
                      {status ? (
                        <><Check size={12} />Invitation Requested</>
                      ) : requestingId === evt.id ? (
                        "Sending…"
                      ) : (
                        "Request Invitation →"
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <>
              <div className="gold-line w-full mb-6" />
              <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-6">Past Events</p>
              <div className="space-y-3">
                {past.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-serif text-base">{evt.title}</p>
                      <p className="font-sans-nav text-[10px] tracking-wider text-muted-foreground">
                        {new Date(evt.event_date).toLocaleDateString("en-AU", { year: "numeric", month: "long" })}
                      </p>
                    </div>
                    {evt.report_url && (
                      <SignedDownload bucket="event-reports" path={evt.report_url} label="Download Report" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeEvents;
