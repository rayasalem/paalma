
import React, { useState, useEffect } from 'react';
import { Language, translations } from '../translations';
import { ArrowRight, ShoppingBag, TrendingUp, Store } from 'lucide-react';

interface Props {
  lang: Language;
  onJoinMerchant: () => void;
  onExploreProducts: () => void;
  onRegister: () => void;
}

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=2274", // Business Meeting
  "https://images.unsplash.com/photo-1472851294608-415522184d44?auto=format&fit=crop&q=80&w=2070", // Marketplace / Store
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2070", // Logistics / Shipping
  "https://images.unsplash.com/photo-1556740758-90de29285627?auto=format&fit=crop&q=80&w=2070", // Digital Payment / Commerce
];

const ComingSoonHero: React.FC<Props> = ({ lang, onJoinMerchant, onExploreProducts, onRegister }) => {
  const t = translations[lang];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Image Rotation Effect
  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(imageInterval);
  }, []);

  // Timer Logic
  // Using an empty dependency array [] ensures this effect runs once on mount.
  // This guarantees the 'targetDate' is set once and the interval persists
  // even when the component re-renders due to image changes.
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    
    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      if (distance < 0) {
        clearInterval(timerInterval);
        return;
      }
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const TimerUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-lg hover:bg-white/20 transition-all duration-300 ring-1 ring-white/10">
         <span className="text-xl sm:text-2xl md:text-4xl font-black text-white font-mono tracking-tighter">
           {value.toString().padStart(2, '0')}
         </span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">{label}</span>
    </div>
  );

  return (
    <section className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-palma-navy">
      
      {/* Background Images with Cross-fade */}
      <div className="absolute inset-0 z-0">
        {HERO_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src={img} 
              className="w-full h-full object-cover"
              alt={`Palma Background ${index + 1}`}
            />
          </div>
        ))}
        {/* Overlays */}
        <div className="absolute inset-0 bg-palma-navy/80 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-palma-navy via-palma-navy/60 to-transparent z-10" />
      </div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-palma-green/30 rounded-full blur-[100px] animate-pulse z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] z-10" />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col items-center text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full shadow-lg">
           <span className="relative flex h-2.5 w-2.5">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
           </span>
           <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{t.comingSoon.earlyAccess}</span>
        </div>
        
        {/* Headlines */}
        <div className="space-y-6 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] drop-shadow-2xl">
            {lang === 'ar' ? (
              <>
                أكبر متجر إلكتروني متكامل في
                <br />
                <span className="block mt-2">فلسطين</span>
              </>
            ) : (
              t.comingSoon.headline
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            {t.comingSoon.subheadline}
          </p>
        </div>

        {/* Timer */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6" dir="ltr">
           <TimerUnit value={timeLeft.days} label={t.comingSoon.days} />
           <TimerUnit value={timeLeft.hours} label={t.comingSoon.hours} />
           <TimerUnit value={timeLeft.minutes} label={t.comingSoon.mins} />
           <TimerUnit value={timeLeft.seconds} label={t.comingSoon.secs} />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full sm:w-auto">
          <button onClick={onRegister} className="group flex items-center justify-center gap-3 bg-white text-palma-navy px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-slate-50 hover:scale-105 transition-all active:scale-95">
            <span>{t.hero.registerNow}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
          </button>
          
          <button onClick={onJoinMerchant} className="flex items-center justify-center gap-3 bg-palma-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl border border-white/10 hover:brightness-110 transition-all active:scale-95">
            <Store className="w-4 h-4" />
            <span>{t.hero.join}</span>
          </button>
          
          <button onClick={onExploreProducts} className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg border border-white/10 hover:bg-white/20 transition-all active:scale-95">
            <ShoppingBag className="w-4 h-4" />
            <span>{t.hero.explore}</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl pt-10 border-t border-white/10 mt-8">
           {[
             { icon: Store, title: t.comingSoon.ctaMerchant, desc: t.comingSoon.growth },
             { icon: ShoppingBag, title: t.comingSoon.ctaCustomer, desc: t.comingSoon.exclusiveInventory },
             { icon: TrendingUp, title: 'FlashLine Logistics', desc: 'Integrated shipping & tracking across Palestine' }
           ].map((item, idx) => (
             <div key={idx} className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/5 text-left rtl:text-right hover:bg-white/10 transition-all group hover:-translate-y-1">
                <div className="mb-4 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-inner ring-1 ring-white/10">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-white text-sm font-black uppercase tracking-widest mb-2">{item.title}</h4>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>

      </div>
    </section>
  );
};

export default ComingSoonHero;
