import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ShoppingCart, X, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusPill } from "@/components/StatusPill";
import { SignedDownload } from "@/components/SignedDownload";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface TradeWine {
  id: string;
  name: string;
  vintage: string;
  region: string;
  trade_price_aud: number | null;
  moq: number | null;
  availability: string | null;
}

interface DraftItem {
  wine: TradeWine;
  qty: number;
}

interface TradeOrder {
  id: string;
  status: string;
  total_aud: number | null;
  invoice_url: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  notes: string | null;
}

// ─── Shipment progress stepper ───────────────────────────────────────────────

const STEPS = ["Confirmed", "Processing", "Dispatched", "In Transit", "Delivered"] as const;
const STEP_STATUS: Record<string, number> = {
  pending:   -1,
  confirmed:  0,
  shipped:    3,
  delivered:  4,
  invoiced:   4,
};

const ShipmentStepper = ({ status }: { status: string }) => {
  const activeIdx = STEP_STATUS[status] ?? 0;
  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-0 flex-1">
          <div className={cn(
            "w-2 h-2 rounded-full shrink-0 transition-colors duration-300",
            i <= activeIdx ? "bg-primary" : "bg-border"
          )} />
          {i < STEPS.length - 1 && (
            <div className={cn("h-[1px] flex-1 transition-colors duration-300", i < activeIdx ? "bg-primary" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
};

// ─── TradeOrders ─────────────────────────────────────────────────────────────

const TradeOrders = () => {
  const { user } = useAuth();
  const [catalog, setCatalog]       = useState<TradeWine[]>([]);
  const [orders, setOrders]         = useState<TradeOrder[]>([]);
  const [draft, setDraft]           = useState<DraftItem[]>([]);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [notes, setNotes]           = useState("");
  const [msg, setMsg]               = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      const [catRes, ordRes] = await Promise.all([
        supabase
          .from("wines")
          .select("id, name, vintage, region, trade_price_aud, moq, availability")
          .not("trade_price_aud", "is", null)
          .order("sort_order"),
        user
          ? supabase
              .from("trade_orders")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
      if (catRes.data) setCatalog(catRes.data as TradeWine[]);
      if (ordRes.data) setOrders(ordRes.data as TradeOrder[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const addToDraft = (wine: TradeWine) => {
    setDraft((prev) => {
      const existing = prev.find((d) => d.wine.id === wine.id);
      if (existing) return prev.map((d) => d.wine.id === wine.id ? { ...d, qty: d.qty + (wine.moq ?? 6) } : d);
      return [...prev, { wine, qty: wine.moq ?? 6 }];
    });
  };

  const adjustQty = (wineId: string, delta: number) => {
    setDraft((prev) =>
      prev
        .map((d) => d.wine.id === wineId ? { ...d, qty: Math.max(0, d.qty + delta) } : d)
        .filter((d) => d.qty > 0)
    );
  };

  const totalDraft = draft.reduce((sum, d) => sum + (d.wine.trade_price_aud ?? 0) * d.qty, 0);

  const placeOrder = async () => {
    if (!user || draft.length === 0) return;
    setSubmitting(true);

    const { data: order, error: orderErr } = await supabase
      .from("trade_orders")
      .insert({ user_id: user.id, status: "pending", total_aud: totalDraft, notes })
      .select()
      .single();

    if (orderErr || !order) { setSubmitting(false); return; }

    await supabase.from("trade_order_items").insert(
      draft.map((d) => ({
        order_id:   order.id,
        wine_id:    d.wine.id,
        sku:        d.wine.id,
        quantity:   d.qty,
        unit_price: d.wine.trade_price_aud ?? 0,
      }))
    );

    setOrders((prev) => [order as TradeOrder, ...prev]);
    setDraft([]);
    setNotes("");
    setSheetOpen(false);
    setSubmitting(false);
  };

  const sendMessage = async () => {
    if (!user || !msg.trim()) return;
    await supabase.from("trade_messages").insert({ user_id: user.id, body: msg.trim() });
    setMsg("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Draft Order Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-lg bg-background border-l border-border overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-serif text-2xl text-foreground text-left">Order Draft</SheetTitle>
            <div className="gold-line w-12" />
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-280px)] pr-2">
            {draft.map((item) => (
              <div key={item.wine.id} className="flex items-center gap-4 py-4 border-b border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base truncate">{item.wine.name}</p>
                  <p className="text-xs text-muted-foreground">{item.wine.vintage}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustQty(item.wine.id, -6)} className="w-6 h-6 flex items-center justify-center border border-border hover:border-primary transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm">{item.qty}</span>
                  <button onClick={() => adjustQty(item.wine.id, 6)} className="w-6 h-6 flex items-center justify-center border border-border hover:border-primary transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                <p className="text-sm text-primary w-24 text-right">
                  {item.wine.trade_price_aud ? `AUD $${(item.wine.trade_price_aud * item.qty).toFixed(2)}` : "—"}
                </p>
                <button onClick={() => setDraft((p) => p.filter((d) => d.wine.id !== item.wine.id))} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </ScrollArea>

          <div className="mt-4 space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery notes (optional)…"
              className="bg-transparent border-border text-foreground text-sm"
              rows={3}
            />

            <div className="flex items-center justify-between py-3 border-t border-border">
              <p className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Total</p>
              <p className="font-serif text-xl text-primary">AUD ${totalDraft.toFixed(2)}</p>
            </div>

            <button
              onClick={placeOrder}
              disabled={submitting || draft.length === 0}
              className="w-full font-sans-nav text-xs tracking-[0.3em] uppercase border border-primary text-primary py-3 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Placing Order…" : "Confirm Order →"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <div>
        {/* Header */}
        <div className="mb-10">
          <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Orders</p>
          <h1 className="font-serif text-3xl md:text-4xl">Order Management</h1>
        </div>
        <div className="gold-line w-full mb-10" />

        {/* Catalog */}
        <div className="mb-12">
          <h2 className="font-serif text-xl mb-6">Current Inventory</h2>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {["Wine", "SKU", "Vintage", "Trade Price", "MOQ", "Availability", ""].map((h) => (
                  <TableHead key={h} className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.map((wine) => (
                <TableRow key={wine.id} className="border-border hover:bg-primary/5 transition-colors">
                  <TableCell>
                    <p className="font-serif text-base">{wine.name}</p>
                    <p className="text-xs text-muted-foreground">{wine.region}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{wine.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{wine.vintage}</TableCell>
                  <TableCell className="text-sm text-primary">{wine.trade_price_aud ? `AUD $${wine.trade_price_aud.toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{wine.moq ?? 6}</TableCell>
                  <TableCell>
                    <span className={cn("text-xs", wine.availability === "in_stock" ? "text-primary" : "text-muted-foreground")}>
                      {wine.availability === "in_stock" ? "In Stock" : wine.availability === "pre_release" ? "Pre-Release" : wine.availability === "allocated" ? "Allocated" : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => addToDraft(wine)}
                      className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary border border-primary/40 hover:border-primary px-3 py-1.5 transition-colors duration-200"
                    >
                      Add to Order
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Order History */}
        {orders.length > 0 && (
          <div className="mb-12">
            <h2 className="font-serif text-xl mb-6">Order History</h2>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {["Order ID", "Date", "Status", "Total", "Invoice", "Tracking"].map((h) => (
                    <TableHead key={h} className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-border hover:bg-primary/5 transition-colors">
                    <TableCell className="text-xs font-mono text-muted-foreground">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-AU")}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={order.status as any} />
                    </TableCell>
                    <TableCell className="text-sm text-primary">
                      {order.total_aud ? `AUD $${order.total_aud.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {order.invoice_url && (
                        <SignedDownload bucket="invoices" path={order.invoice_url} label="Download" />
                      )}
                    </TableCell>
                    <TableCell>
                      {order.tracking_url && (
                        <a href={order.tracking_url} target="_blank" rel="noreferrer" className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary hover:underline">
                          Track →
                        </a>
                      )}
                      {(order.status === "shipped" || order.status === "delivered") && (
                        <ShipmentStepper status={order.status} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Direct message */}
        <div>
          <h2 className="font-serif text-xl mb-4">Message Your Account Manager</h2>
          <div className="flex gap-3">
            <Textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Send a message about your orders or portfolio needs…"
              className="bg-glass border-border text-foreground text-sm flex-1"
              rows={3}
            />
            <button
              onClick={sendMessage}
              disabled={!msg.trim()}
              className="self-end font-sans-nav text-[10px] tracking-[0.25em] uppercase border border-primary text-primary px-5 py-3 hover:bg-primary hover:text-primary-foreground transition-colors duration-300 disabled:opacity-40 flex items-center gap-2"
            >
              <Send size={12} />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Floating draft bar */}
      <AnimatePresence>
        {draft.length > 0 && !sheetOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-glass-strong border border-primary/40 px-6 py-3 flex items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" />
              <span className="font-sans-nav text-[11px] tracking-[0.2em] uppercase text-foreground">
                {draft.reduce((s, d) => s + d.qty, 0)} bottles in draft
              </span>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary border border-primary/60 hover:border-primary px-4 py-2 transition-colors"
            >
              Review Draft →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TradeOrders;
