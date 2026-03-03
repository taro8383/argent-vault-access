const Footer = () => (
  <footer className="section-padding pt-12 pb-12 border-t border-border">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col items-center md:items-start">
        <span className="font-serif text-lg tracking-[0.15em] text-primary">GC WINES</span>
        <span className="text-[9px] tracking-[0.35em] uppercase text-muted-foreground">
          Global Curation
        </span>
      </div>
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        © {new Date().getFullYear()} GC Wines. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
