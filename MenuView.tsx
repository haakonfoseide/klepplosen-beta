
import React, { useState, useEffect } from 'react';
import { PenTool, Archive, BookOpen, Mic2, ChevronRight, Briefcase, Anchor, Compass, Monitor, Microscope, AlertTriangle } from 'lucide-react';
import { SafeImage } from './CommonComponents';
import { generateDailyKaiGreetings } from './services/geminiService';
import { Card } from './components/ui/Card';

const KAI_IMAGE_URL = "https://sfuwzuifxvovowoicrcp.supabase.co/storage/v1/object/public/Bilder/kaibrygge.png";

interface MenuViewProps {
  t: any;
  onNavigate: (view: any) => void;
  currentUser?: any;
  guestName?: string;
}

export const MenuView: React.FC<MenuViewProps> = ({ t, onNavigate, currentUser, guestName }) => {
  const [greeting, setGreeting] = useState<{title: string, sub: string}>({ 
      title: t.kaiGreeting, 
      sub: "Laster inn dagens visdomsord..." 
  });
  const [isGreetingLoading, setIsGreetingLoading] = useState(true);

  useEffect(() => {
    const fetchGreeting = async () => {
        try {
            const name = currentUser?.name || guestName || "Landkrabbe";
            const today = new Date().toDateString();
            
            // Use localStorage for daily rotation instead of sessionStorage (persists across tabs)
            const storageKey = `kai_greetings_v2_${currentUser?.id || 'guest'}`;
            const storedData = localStorage.getItem(storageKey);
            
            const parsedData = storedData ? JSON.parse(storedData) : null;

            // Check if we have valid data for TODAY
            if (parsedData && parsedData.date === today && Array.isArray(parsedData.greetings) && parsedData.greetings.length > 0) {
                // Rotate to the next greeting
                const nextIndex = (parsedData.lastIndex + 1) % parsedData.greetings.length;
                const selectedGreeting = parsedData.greetings[nextIndex];
                
                setGreeting({ title: selectedGreeting.greeting, sub: selectedGreeting.subtext });
                setIsGreetingLoading(false);

                // Update index for next visit
                localStorage.setItem(storageKey, JSON.stringify({
                    ...parsedData,
                    lastIndex: nextIndex
                }));
            } else {
                // Fetch 3 NEW greetings from AI
                const newGreetings = await generateDailyKaiGreetings(name, 'nynorsk');
                
                if (newGreetings && newGreetings.length > 0) {
                    const firstGreeting = newGreetings[0];
                    setGreeting({ title: firstGreeting.greeting, sub: firstGreeting.subtext });
                    
                    // Save to localStorage with today's date
                    localStorage.setItem(storageKey, JSON.stringify({
                        date: today,
                        greetings: newGreetings,
                        lastIndex: 0
                    }));
                } else {
                    // Fallback if AI fails
                    setGreeting({ title: t.kaiGreeting, sub: t.kaiSubGreeting });
                }
                setIsGreetingLoading(false);
            }
        } catch (e) {
            console.error("Could not fetch greeting", e);
            setGreeting({ title: t.kaiGreeting, sub: t.kaiSubGreeting });
            setIsGreetingLoading(false);
        }
    };
    fetchGreeting();
  }, [t, currentUser, guestName]);

  const menuItems = [
    { id: 'dashboard', title: 'Hjemskjerm', sub: 'Lærerens cockpit', icon: Monitor, color: 'bg-slate-900', gradient: 'from-slate-900 to-slate-800', shadow: 'shadow-slate-300' },
    { id: 'plan', title: t.newPlan, sub: t.newPlanSub, icon: PenTool, color: 'bg-indigo-600', gradient: 'from-indigo-600 to-indigo-500', shadow: 'shadow-indigo-200' },
    { id: 'lesson_study', title: 'Lesson Study', sub: 'Skoleutvikling & Forskning', icon: Microscope, color: 'bg-teal-600', gradient: 'from-teal-600 to-teal-500', shadow: 'shadow-teal-200' },
    { id: 'archive', title: t.archive, sub: t.archiveSub, icon: Archive, color: 'bg-emerald-600', gradient: 'from-emerald-600 to-emerald-500', shadow: 'shadow-emerald-200' },
    { id: 'guide', title: t.clGuide, sub: t.clGuideSub, icon: BookOpen, color: 'bg-amber-500', gradient: 'from-amber-500 to-amber-400', shadow: 'shadow-amber-200' },
    { id: 'oracy', title: t.oracyGuide, sub: t.oracyGuideSub, icon: Mic2, color: 'bg-pink-600', gradient: 'from-pink-600 to-pink-500', shadow: 'shadow-pink-200' },
    { id: 'tools', title: 'Kais verktøykasse', sub: 'Interaktive verktøy & AI-hjelp', icon: Briefcase, color: 'bg-slate-800', gradient: 'from-slate-800 to-slate-700', shadow: 'shadow-slate-300' },
    { id: 'bti_guide', title: "Navigasjon", sub: "BTI-Rettleiing", icon: Compass, color: 'bg-sky-600', gradient: 'from-sky-600 to-sky-500', shadow: 'shadow-sky-200' }
  ];

  if (currentUser?.role === 'admin') {
    menuItems.push({
      id: 'seilasplan',
      title: 'Seilasplan',
      sub: 'Ukeplanlegging (Beta)',
      icon: Anchor,
      color: 'bg-cyan-600',
      gradient: 'from-cyan-600 to-cyan-500',
      shadow: 'shadow-cyan-200'
    });
  }

  return (
    <div className="space-y-10 text-center pb-10 w-full overflow-visible max-w-6xl mx-auto relative">
      
      {/* Guest Mode Warning Banner */}
      {!currentUser && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-6 animate-in slide-in-from-top-4">
          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4 text-amber-800">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-black uppercase text-xs tracking-widest mb-1">Gjestemodus</h3>
                <p className="text-xs font-medium">Ingenting du gjør blir lagret. Lag en konto for å ta vare på arbeidet ditt.</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('auth')}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 whitespace-nowrap"
            >
              Lag Konto
            </button>
          </div>
        </div>
      )}

      {/* Hero Section - Compact & Modern */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 py-4 sm:py-8 animate-in zoom-in-95 duration-700 relative px-4">
        <div className="relative group cursor-pointer flex-shrink-0" onClick={() => onNavigate('easter-egg')}>
            <div className="absolute inset-0 bg-indigo-400 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 scale-110"></div>
            <SafeImage src={KAI_IMAGE_URL} alt="Kai" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-[2rem] shadow-xl border-4 border-white relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2" />
            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg z-20 animate-bounce-subtle">
                <Anchor className="text-indigo-600 w-4 h-4" />
            </div>
        </div>
        
        <div className="space-y-2 text-center sm:text-left max-w-xl">
            <h2 className={`text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter transition-all duration-700 ${isGreetingLoading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
                {greeting.title}
            </h2>
            <div className={`transition-all duration-700 delay-100 ${isGreetingLoading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                <p className="text-slate-500 font-medium text-sm sm:text-base italic leading-relaxed bg-white/40 inline-block px-4 py-1.5 rounded-xl border border-white/40 backdrop-blur-sm shadow-sm">
                    "{greeting.sub}"
                </p>
            </div>
        </div>
      </div>
      
      {/* Grid Menu - Compact Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-4 w-full">
        {menuItems.map((item, i) => {
          const ItemIcon = item.icon;
          return (
          <button 
            key={item.id} 
            onClick={() => onNavigate(item.id)} 
            className="group relative text-left h-full w-full focus:outline-none"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Card className="h-full hover:-translate-y-1 transition-all duration-200 hover:shadow-xl border-white/50 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group-active:scale-[0.98] group-active:shadow-sm" noPadding>
                <div className="relative z-10 p-4 sm:p-5 flex items-center gap-4 h-full">
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${item.gradient} text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        {ItemIcon && <ItemIcon size={22} strokeWidth={2.5} />}
                    </div>
                    
                    <div className="flex-grow min-w-0 space-y-0.5">
                        <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-900 transition-colors truncate">{item.title}</h3>
                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest leading-none truncate">
                            {item.sub}
                        </p>
                    </div>

                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </Card>
          </button>
        )})}
      </div>

      <div className="pt-8 opacity-40 hover:opacity-100 transition-opacity">
        <button 
          className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-indigo-500 transition-colors"
        >
          V 4.0 Kai
        </button>
      </div>
    </div>
  );
};