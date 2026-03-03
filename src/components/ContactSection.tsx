import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Send, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    region: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Inquiry Received",
      description: "Our concierge team will respond within 24 hours.",
    });
    setFormData({ name: "", company: "", region: "", message: "" });
  };

  return (
    <section id="contact" className="section-padding relative" ref={ref}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-4">
            Access
          </p>
          <h2 className="font-serif text-4xl md:text-6xl">Private Concierge</h2>
          <div className="gold-line w-16 mx-auto mt-6 mb-6" />
          <p className="text-sm text-muted-foreground tracking-wider">
            Request private access to our curated portfolio
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {[
            { key: "name", label: "Full Name", type: "text" },
            { key: "company", label: "Company / Organization", type: "text" },
            { key: "region", label: "Market Region of Interest", type: "text" },
          ].map((field) => (
            <div key={field.key} className="group">
              <label className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2 block">
                {field.label}
              </label>
              <input
                type={field.type}
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                required
                className="w-full bg-transparent border-b border-border py-3 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-500 placeholder:text-muted-foreground/40"
              />
            </div>
          ))}

          <div className="group">
            <label className="font-sans-nav text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2 block">
              Your Inquiry
            </label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              className="w-full bg-transparent border-b border-border py-3 text-sm text-foreground tracking-wider focus:outline-none focus:border-primary transition-colors duration-500 resize-none placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock size={12} />
              <span className="text-[10px] tracking-wider">Encrypted & Confidential</span>
            </div>
            <button
              type="submit"
              className="font-sans-nav text-xs tracking-[0.2em] uppercase border border-primary text-primary px-8 py-3 flex items-center gap-3 transition-all duration-500 hover:bg-primary hover:text-primary-foreground group"
            >
              Submit Inquiry
              <Send size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
