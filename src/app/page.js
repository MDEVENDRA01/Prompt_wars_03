'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Leaf, ArrowRight, BarChart3, ShieldAlert, Cpu, Sparkles, Sliders } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#020705] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-6 uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Powered by Gemini 2.5 Flash
              </div>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
                Understand, Track, and <span className="text-gradient">Reduce</span> Your Carbon Footprint
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed">
                Empower your sustainability journey. Complete a quick lifestyle assessment, receive custom AI coaching insights, and simulate the ecological impact of your daily choices.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={user ? "/assessment" : "/auth?tab=signup"}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Start Footprint Assessment
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/what-if"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  Try What-If Simulator
                </Link>
              </div>
            </div>

            {/* Premium Hero Visual / Glass Card */}
            <div className="mt-16 sm:mt-24 max-w-5xl mx-auto glass-card rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl relative animate-fade-in-up duration-700">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-teal-500/10 rounded-2xl pointer-events-none" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-center">
                <div className="p-6 bg-black/35 rounded-xl border border-white/5">
                  <div className="text-emerald-400 text-3xl font-bold mb-2">10 min</div>
                  <div className="text-slate-300 font-semibold mb-1">Interactive Assessment</div>
                  <p className="text-xs text-slate-500">Quickly estimate emissions across travel, diet, energy, and shopping.</p>
                </div>
                <div className="p-6 bg-black/35 rounded-xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-300" />
                  <div className="text-emerald-400 text-3xl font-bold mb-2 flex justify-center items-center gap-1">
                    Gemini AI
                  </div>
                  <div className="text-slate-300 font-semibold mb-1">Personalized Coaching</div>
                  <p className="text-xs text-slate-500">Instant generation of customized weekly challenges and reduction strategies.</p>
                </div>
                <div className="p-6 bg-black/35 rounded-xl border border-white/5">
                  <div className="text-emerald-400 text-3xl font-bold mb-2">Realtime</div>
                  <div className="text-slate-300 font-semibold mb-1">What-If Simulation</div>
                  <p className="text-xs text-slate-500">Slide dials to immediately see trees saved, dollars kept, and CO₂ reduced.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Overview & Features */}
        <section className="py-20 bg-black/30 border-y border-emerald-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Designed for Individuals Who Care
              </h2>
              <p className="text-slate-400">
                EcoMind AI provides the tools you need to build long-term sustainability habits without compromising your lifestyle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[#05110d]/50 border border-emerald-950/30 hover:border-emerald-500/30 transition-all duration-300">
                <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                  <BarChart3 className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Emission Analytics</h3>
                <p className="text-sm text-slate-400">
                  See a precise breakdown of your lifestyle footprint. Visualize data using charts for flights, home electricity, and food.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[#05110d]/50 border border-emerald-950/30 hover:border-emerald-500/30 transition-all duration-300">
                <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                  <Cpu className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Gemini AI Engine</h3>
                <p className="text-sm text-slate-400">
                  Let Gemini analyze your raw assessment. Receive 3 actionable, structured suggestions tailored directly to your habits.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[#05110d]/50 border border-emerald-950/30 hover:border-emerald-500/30 transition-all duration-300">
                <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                  <Sliders className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">What-If Simulator</h3>
                <p className="text-sm text-slate-400">
                  Simulate dynamic changes like swapping driving for cycling or swapping beef for tofu. Check instant cost and carbon savings.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-[#05110d]/50 border border-emerald-950/30 hover:border-emerald-500/30 transition-all duration-300">
                <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                  <ShieldAlert className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Weekly Challenges</h3>
                <p className="text-sm text-slate-400">
                  Stay motivated with custom, actionable, AI-suggested weekly challenges. Mark them complete to build positive impact.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="glass-card rounded-3xl border border-white/10 p-10 sm:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 pointer-events-none" />
              <Leaf className="h-12 w-12 text-emerald-400 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to make a real difference?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Join thousands of environmentally conscious students and professionals tracking emissions and driving global impact today.
              </p>
              <Link
                href={user ? "/assessment" : "/auth?tab=signup"}
                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/15 cursor-pointer"
              >
                Sign Up & Calculate Footprint
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
