import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SignedDownload } from "@/components/SignedDownload";
import { supabase } from "@/lib/supabase";

interface MarketReport {
  id: string;
  title: string;
  quarter: string;
  description: string | null;
  file_url: string;
  topics_json: string[] | null;
  published_at: string;
}

const TOPIC_FILTERS = ["All", "Trends", "Regulatory", "Hospitality", "Competitive"];

const TradeIntelligence = () => {
  const [reports, setReports]   = useState<MarketReport[]>([]);
  const [filter, setFilter]     = useState("All");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    supabase
      .from("market_reports")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setReports(data as MarketReport[]);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "All"
    ? reports
    : reports.filter((r) =>
        r.topics_json?.some((t) => t.toLowerCase() === filter.toLowerCase())
      );

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
      <div className="mb-6">
        <p className="font-sans-nav text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Market Intelligence</p>
        <h1 className="font-serif text-3xl md:text-4xl">Quarterly Reports</h1>
      </div>
      <div className="gold-line w-full mb-8" />

      {/* Filter */}
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => { if (v) setFilter(v); }}
        className="justify-start mb-8 flex-wrap gap-2"
      >
        {TOPIC_FILTERS.map((t) => (
          <ToggleGroupItem
            key={t}
            value={t}
            className="font-sans-nav text-[10px] tracking-[0.2em] uppercase data-[state=on]:text-primary data-[state=on]:border-primary border border-border text-muted-foreground hover:text-foreground rounded-none px-4 py-2"
          >
            {t}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="bg-glass p-6 flex flex-col"
            >
              <p className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-primary mb-3">
                {report.quarter}
              </p>
              <h3 className="font-serif text-xl mb-3">{report.title}</h3>

              {report.topics_json && report.topics_json.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {report.topics_json.map((topic) => (
                    <span
                      key={topic}
                      className="text-[9px] font-sans-nav tracking-[0.2em] uppercase bg-[hsl(var(--accent))]/30 border border-[hsl(var(--accent))]/40 text-foreground px-2 py-0.5"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {report.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
                  {report.description}
                </p>
              )}

              <SignedDownload
                bucket="market-reports"
                path={report.file_url}
                label="Download Report"
                className="mt-auto"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradeIntelligence;
