import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface SignedDownloadProps {
  bucket: string;
  path: string;
  label: string;
  className?: string;
  expiresIn?: number; // seconds, default 60
}

export const SignedDownload = ({
  bucket,
  path,
  label,
  className,
  expiresIn = 60,
}: SignedDownloadProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error || !data?.signedUrl) {
        console.error("Signed URL error:", error);
        return;
      }

      // Trigger browser download
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = path.split("/").pop() ?? label;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsLoading(false);
    }
  }, [bucket, path, expiresIn]);

  return (
    <motion.button
      onClick={handleDownload}
      disabled={isLoading}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "inline-flex items-center gap-2 font-sans-nav text-[11px] tracking-[0.2em] uppercase",
        "text-primary border-b border-primary/40 hover:border-primary pb-0.5",
        "transition-colors duration-200 disabled:opacity-50",
        className
      )}
    >
      {isLoading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Download size={12} />
      )}
      {label}
    </motion.button>
  );
};
