'use client';

import { useState, useEffect } from 'react';
import { 
  Sliders, Trees, DollarSign, Leaf, Car, 
  Utensils, Zap, Milestone, Smartphone, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function WhatIfPage() {
  const [mounted, setMounted] = useState(false);
  const [baseEmissions, setBaseEmissions] = useState(12.5); // Default fallback

  // Simulator States
  const [cycleMiles, setCycleMiles] = useState(25); // Car miles replaced by bike/week
  const [transitMiles, setTransitMiles] = useState(50); // Car miles replaced by transit/week
  const [vegDays, setVegDays] = useState(3); // Vegetarian days/week
  const [energyEfficient, setEnergyEfficient] = useState(true); // Toggle efficiency

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
    
    // Fetch last assessment to set a realistic base emissions value
    async function fetchBase() {
      const { data: { user } } = await supabase.auth.getUser();
      let lastVal = null;
      
      if (user) {
        const { data } = await supabase
          .from('assessments')
          .select('annual_emissions')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) {
          lastVal = parseFloat(data[0].annual_emissions);
        }
      } else {
        const local = localStorage.getItem('ecomind_assessments');
        if (local) {
          const list = JSON.parse(local);
          if (list.length > 0) {
            lastVal = parseFloat(list[list.length - 1].annual_emissions);
          }
        }
      }

      if (lastVal) {
        setBaseEmissions(lastVal);
      }
    }
    fetchBase();
  }, []);

  // Calculate Savings
  // 1. Cycling savings: 0.35 kg CO2/mile saved (replacing standard car)
  const co2SavedCycle = (cycleMiles * 52 * 0.35) / 1000;
  const moneySavedCycle = cycleMiles * 52 * 0.20; // 20 cents/mile gas/wear

  // 2. Transit savings: 0.27 kg CO2/mile saved (0.35 standard car - 0.08 transit)
  const co2SavedTransit = (transitMiles * 52 * 0.27) / 1000;
  const moneySavedTransit = transitMiles * 52 * 0.12; // 12 cents/mile net saving

  // 3. Diet savings: 0.25 tons/year saved per vegetarian day/week
  const co2SavedDiet = vegDays * 0.25;
  const moneySavedDiet = vegDays * 120; // $120/year saved per day

  // 4. Energy savings: 0.8 tons/year and $240/year saved
  const co2SavedEnergy = energyEfficient ? 0.8 : 0;
  const moneySavedEnergy = energyEfficient ? 240 : 0;

  // Totals
  const totalCo2Saved = parseFloat((co2SavedCycle + co2SavedTransit + co2SavedDiet + co2SavedEnergy).toFixed(2));
  const totalMoneySaved = Math.round(moneySavedCycle + moneySavedTransit + moneySavedDiet + moneySavedEnergy);

  // Future emissions estimation (ensure it doesn't go below 0)
  const futureEmissions = Math.max(0.5, parseFloat((baseEmissions - totalCo2Saved).toFixed(2)));

  // Equivalencies
  const treesPlanted = Math.round(totalCo2Saved * 45); // 1 ton CO2 = 45 mature trees absorption
  const carMilesAvoided = Math.round(totalCo2Saved * 2500); // 1 ton CO2 = 2,500 car miles
  const phonesCharged = Math.round(totalCo2Saved * 120000); // 1 ton CO2 = 120,000 phone charges

  // Chart Data
  const chartData = [
    { name: 'Current Footprint', value: baseEmissions, color: '#ef4444' },
    { name: 'Future Footprint', value: futureEmissions, color: '#10b981' }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#020705] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="border-b border-emerald-950/30 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Sliders className="h-7 w-7 text-emerald-400" />
            What-If <span className="text-gradient">Lifestyle Simulator</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Toggle switches and slide dials to estimate how changes in travel, diet, and home efficiency reduce your annual carbon footprint.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sliders (Controls Column) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Travel Card */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-black/35 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                <Car className="h-5 w-5 text-emerald-400" />
                <h2 className="font-bold text-white">Travel Adjustments</h2>
              </div>

              {/* Cycle Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">Drive Less: Cycle / Walk instead</span>
                  <span className="text-emerald-400 font-bold">{cycleMiles} miles / week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={cycleMiles}
                  onChange={(e) => setCycleMiles(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg cursor-pointer"
                />
                <p className="text-xs text-slate-500">Replaces short vehicular drives with carbon-zero biking or walking.</p>
              </div>

              {/* Transit Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">Drive Less: Ride Public Transit</span>
                  <span className="text-emerald-400 font-bold">{transitMiles} miles / week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="10"
                  value={transitMiles}
                  onChange={(e) => setTransitMiles(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg cursor-pointer"
                />
                <p className="text-xs text-slate-500">Replaces car travel with electric/diesel buses, subways, or passenger trains.</p>
              </div>
            </div>

            {/* Diet Card */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-black/35 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                <Utensils className="h-5 w-5 text-emerald-400" />
                <h2 className="font-bold text-white">Diet & Meal Adjustments</h2>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">Vegetarian / Vegan Days</span>
                  <span className="text-emerald-400 font-bold">{vegDays} days / week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={vegDays}
                  onChange={(e) => setVegDays(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg cursor-pointer"
                />
                <p className="text-xs text-slate-500">Swaps heavy meat consumption with plant-based products (saving ~250kg CO₂ per year per day).</p>
              </div>
            </div>

            {/* Energy Card */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-black/35 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                <Zap className="h-5 w-5 text-emerald-400" />
                <h2 className="font-bold text-white">Home Energy adjustments</h2>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm text-slate-300 font-medium block">Energy Efficient Appliances & LEDs</span>
                  <span className="text-xs text-slate-500">Swapping legacy lighting and heating appliances for EnergyStar ratings.</span>
                </div>
                <button
                  onClick={() => setEnergyEfficient(!energyEfficient)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    energyEfficient ? 'bg-emerald-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      energyEfficient ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

          </div>

          {/* Results (Display Column) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Impact display */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 bg-black/45 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center pb-4 border-b border-white/5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulated Annual Impact</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-center mb-1">
                    <Leaf className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400">-{totalCo2Saved}</div>
                  <div className="text-xs text-slate-400 font-medium">Tons CO₂ / Year</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-center mb-1">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">${totalMoneySaved}</div>
                  <div className="text-xs text-slate-400 font-medium">Saved / Year</div>
                </div>
              </div>

              {/* Chart Comparison */}
              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10, top: 10, bottom: 10 }}>
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, Math.max(15, baseEmissions + 2)]} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={110} />
                    <Tooltip contentStyle={{ backgroundColor: '#071411', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Equivalency stats */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">
                  Environmental Equivalency
                </h3>
                
                <div className="flex items-center gap-3.5 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Trees className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{treesPlanted} trees</div>
                    <div className="text-xs text-slate-400">Equivalent annual absorption of growing trees</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Milestone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{carMilesAvoided.toLocaleString()} miles</div>
                    <div className="text-xs text-slate-400">Standard passenger car miles avoided</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{phonesCharged.toLocaleString()} charges</div>
                    <div className="text-xs text-slate-400">Equivalent smartphone battery recharges</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
