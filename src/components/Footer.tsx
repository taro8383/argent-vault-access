import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import logo from "../assets/logo 1.svg";

const Footer = () => (
  <footer className="section-padding pt-12 pb-12 border-t border-border">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col items-center md:items-start gap-2">
        <motion.img
          src={logo}
          alt="GC Wines"
          className="h-8 w-auto cursor-pointer"
          whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
          transition={{ duration: 0.3 }}
        />
        {/* Contact email with hover reveal */}
        <motion.a
          href="mailto:concierge@gc-wines.com"
          className="group flex items-center gap-2 text-[10px] tracking-wider text-muted-foreground hover:text-primary transition-colors duration-300"
          initial={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
        >
          <Mail size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          <span>concierge@gc-wines.com</span>
        </motion.a>
      </div>
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        © {new Date().getFullYear()} GC Wines. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
