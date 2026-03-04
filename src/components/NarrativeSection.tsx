import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import img1 from "../assets/1.png";
import img2 from "../assets/2.png";
import img3 from "../assets/3.png";

const NarrativeSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const paragraphs = [
    {
      title: "Rooted in the Andes",
      text: "Our founders Argentine heritage runs deep through the vineyards of Mendoza and the high-altitude terroirs of Gualtallary. Every bottle in our curation carries the soul of the Andes: Intense, complex, and profoundly authentic.",
      image: img1,
    },
    {
      title: "The Last Mile Advantage",
      text: "What sets GC Wines apart is exclusive 'Last Mile' access to F&B decision-makers across Asia, the Balkans, and beyond. Our network isn't built on cold outreach; it's forged through years of trust, cultural fluency, and shared dining tables.",
      image: img2,
    },
    {
      title: "Three Continents, One Vision",
      text: "From the financial infrastructure of the United States to the Balkan's gateway of Montenegro, every node in our operation is designed for one purpose: delivering Argentina's finest wines to the world's most discerning palates.",
      image: img3,
    },
  ];

  return (
    <section id="narrative" className="section-padding relative" ref={ref}>
      <div className="max-w-4xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="font-sans-nav text-xs tracking-[0.4em] uppercase text-primary mb-4">
            The Narrative
          </p>
          <h2 className="font-serif text-4xl md:text-6xl">The Bridge</h2>
          <motion.div
            className="gold-line w-16 mx-auto mt-6"
            animate={{ scaleX: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Paragraphs */}
        <div className="space-y-24">
          {paragraphs.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.2, duration: 0.8 }}
              className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.2, duration: 0.8 }}
                className="w-full md:w-1/2"
              >
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-auto rounded-sm"
                  style={{
                    filter: "drop-shadow(0 0 20px hsla(39, 52%, 56%, 0.15))",
                    border: "1px solid hsla(39, 52%, 56%, 0.1)",
                  }}
                />
              </motion.div>

              {/* Text Content */}
              <div className={`w-full md:w-1/2 flex flex-col ${i % 2 === 1 ? "md:items-end md:text-right" : ""}`}>
                <h3 className="font-serif text-2xl md:text-3xl text-primary mb-4">
                  {p.title}
                </h3>
                <p className="font-sans text-sm md:text-base leading-relaxed text-muted-foreground max-w-xl">
                  {p.text}
                </p>
                <motion.div
                  className={`gold-line w-12 mt-6 ${i % 2 === 1 ? "ml-auto" : ""}`}
                  animate={{ scaleX: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NarrativeSection;
