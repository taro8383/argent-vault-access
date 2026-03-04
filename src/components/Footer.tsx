import logo from "../assets/logo 1.svg";

const Footer = () => (
  <footer className="section-padding pt-12 pb-12 border-t border-border">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col items-center md:items-start">
        <img src={logo} alt="GC Wines" className="h-8 w-auto" />
      </div>
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        © {new Date().getFullYear()} GC Wines. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
