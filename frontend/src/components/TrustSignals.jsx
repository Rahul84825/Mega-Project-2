import { ShieldCheck, Truck, Sparkles, Award } from "lucide-react";
import SectionContainer from "./home/SectionContainer";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Always Fresh",
    description: "Prepared daily in small batches to ensure maximum flavor and shelf life."
  },
  {
    icon: Award,
    title: "Authentic Taste",
    description: "Generational recipes using 100% pure desi ghee and premium ingredients."
  },
  {
    icon: Truck,
    title: "Swift Delivery",
    description: "Secure packaging and lightning fast delivery across your city."
  },
  {
    icon: ShieldCheck,
    title: "Quality Tested",
    description: "Strict hygiene standards and quality checks at every step of preparation."
  }
];

const TrustSignals = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-y border-[var(--surface-border)]">
      <SectionContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {FEATURES.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 rounded-3xl bg-[var(--cream)] flex items-center justify-center text-[var(--burgundy)] mb-6 transition-transform group-hover:scale-110 duration-300">
                <feature.icon size={32} strokeWidth={1.5} />
              </div>
              <h3 className="serif text-lg font-medium text-[var(--charcoal)] mb-3">{feature.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export default TrustSignals;
