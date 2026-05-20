import { Mail, Gift, ArrowRight } from "lucide-react";
import SectionContainer from "./home/SectionContainer";

const Newsletter = () => {
  return (
    <section className="py-20 bg-[var(--charcoal)] text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 border-2 border-[var(--gold)] rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 border border-[var(--saffron)] rounded-full" />
      </div>

      <SectionContainer>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[var(--saffron)] text-[10px] font-bold tracking-widest uppercase mb-8">
            <Gift size={14} /> Join the Festive Club
          </div>
          
          <h2 className="serif text-4xl md:text-5xl mb-6">Experience the sweetness of every occasion</h2>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto mb-12 leading-relaxed">
            Subscribe to our newsletter and be the first to know about seasonal launches, festive gift boxes, and exclusive member-only offers.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:border-[var(--saffron)] transition-colors placeholder:text-white/30"
              />
            </div>
            <button className="h-14 px-8 rounded-2xl bg-[var(--saffron)] text-[var(--charcoal)] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group">
              Subscribe <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <p className="mt-6 text-[10px] text-white/30 uppercase tracking-[0.2em]">
            No spam. Only sweetness. Unsubscribe at any time.
          </p>
        </div>
      </SectionContainer>
    </section>
  );
};

export default Newsletter;
