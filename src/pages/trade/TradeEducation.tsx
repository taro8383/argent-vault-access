import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SignedDownload } from "@/components/SignedDownload";
import { supabase } from "@/lib/supabase";

interface EducationContent {
  id: string;
  type: "regional_guide" | "varietal" | "vintage" | "pairing" | "staff_training";
  title: string;
  body_markdown: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  duration_mins: number | null;
  published_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  regional_guide: "Regional Guides",
  varietal:       "Varietals",
  vintage:        "Vintages",
  pairing:        "Pairing",
  staff_training: "Staff Training",
};

const TYPE_KEYS = ["all", "regional_guide", "varietal", "vintage", "pairing", "staff_training"] as const;

const TradeEducation = () => {
  const [content, setContent]     = useState<EducationContent[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reading, setReading]     = useState<EducationContent | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase
      .from("education_content")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setContent(data as EducationContent[]);
        setLoading(false);
      });
  }, []);

  const filtered = activeTab === "all"
    ? content
    : content.filter((c) => c.type === activeTab);

  const openSheet = (item: EducationContent) => {
    setReading(item);
    setSheetOpen(true);
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
      {/* Inline reading Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-2xl bg-background border-l border-border overflow-y-auto">
          {reading && (
            <>
              <SheetHeader className="mb-6">
                <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary">
                  {TYPE_LABELS[reading.type]}
                </p>
                <SheetTitle className="font-serif text-2xl text-foreground text-left">
                  {reading.title}
                </SheetTitle>
                <div className="gold-line w-12" />
              </SheetHeader>

              {reading.thumbnail_url && (
                <img
                  src={reading.thumbnail_url}
                  alt={reading.title}
                  className="w-full aspect-video object-cover mb-6"
                />
              )}

              {reading.body_markdown && (
                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans tracking-wide">
                  {reading.body_markdown}
                </div>
              )}

              {reading.file_url && (
                <div className="mt-8 pt-6 border-t border-border">
                  <SignedDownload bucket="education" path={reading.file_url} label="Download PDF" />
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <div>
        {/* Header */}
        <div className="mb-6">
          <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Education</p>
          <h1 className="font-serif text-3xl md:text-4xl">The Knowledge Vault</h1>
        </div>
        <div className="gold-line w-full mb-8" />

        {/* Type tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
          <TabsList className="bg-transparent h-auto p-0 flex-wrap gap-1">
            {TYPE_KEYS.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="font-sans-nav text-[10px] tracking-[0.2em] uppercase rounded-none border border-border data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground px-4 py-2 data-[state=active]:shadow-none"
              >
                {key === "all" ? "All" : TYPE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No content available in this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="bg-glass hover:bg-glass-strong transition-colors duration-300 overflow-hidden cursor-pointer group"
                onClick={() => openSheet(item)}
              >
                {item.thumbnail_url ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-secondary flex items-center justify-center">
                    <FileText size={32} className="text-primary/30" />
                  </div>
                )}

                <div className="p-5">
                  <p className="font-sans-nav text-[9px] tracking-[0.3em] uppercase text-primary mb-2">
                    {TYPE_LABELS[item.type]}
                  </p>
                  <h3 className="font-serif text-lg mb-3 group-hover:text-primary transition-colors duration-200">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    {item.duration_mins && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={11} />
                        <span className="text-xs">{item.duration_mins} min read</span>
                      </div>
                    )}
                    <span className="font-sans-nav text-[10px] tracking-[0.2em] uppercase text-primary ml-auto">
                      {item.file_url ? "Download PDF →" : "Read →"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TradeEducation;
