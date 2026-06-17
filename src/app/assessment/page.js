'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Car, Plane, Utensils, Home, ShoppingBag, 
  ArrowLeft, ArrowRight, CheckCircle, Sparkles, Leaf 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function AssessmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Transport
    hasCar: 'yes',
    carType: 'sedan',
    weeklyMiles: '100',
    publicTransitHours: '2',
    annualFlights: '1',

    // Step 2: Food
    diet: 'average',
    foodWaste: 'occasionally',
    localFoodPreference: 'sometimes',

    // Step 3: Energy
    homeSize: 'medium',
    heatingSource: 'electric',
    cleanEnergyShare: '25',

    // Step 4: Shopping
    shoppingFrequency: 'monthly',
    recycleHabits: 'sometimes',
    secondhandPreference: 'occasionally'
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateEmissions = () => {
    // 1. Transportation
    let carEmissions = 0;
    if (formData.hasCar === 'yes') {
      const miles = parseFloat(formData.weeklyMiles || 0);
      let factor = 0.35; // Sedan
      if (formData.carType === 'suv') factor = 0.45;
      else if (formData.carType === 'compact') factor = 0.25;
      else if (formData.carType === 'electric') factor = 0.10;
      
      carEmissions = (miles * 52 * factor) / 1000; // metric tons CO2/year
    }

    const transitHours = parseFloat(formData.publicTransitHours || 0);
    const transitEmissions = (transitHours * 52 * 1.6) / 1000; // 1.6 kg/hour

    const flights = parseFloat(formData.annualFlights || 0);
    const flightEmissions = flights * 1.2; // 1.2 metric tons/flight

    const transportEmissionsTotal = carEmissions + transitEmissions + flightEmissions;

    // 2. Food Habits
    let dietBase = 2.2; // Average meat
    if (formData.diet === 'heavy-meat') dietBase = 3.2;
    else if (formData.diet === 'vegetarian') dietBase = 1.5;
    else if (formData.diet === 'vegan') dietBase = 0.9;

    let foodWasteAdj = 0.2; // Occasionally
    if (formData.foodWaste === 'frequently') foodWasteAdj = 0.6;
    else if (formData.foodWaste === 'rarely') foodWasteAdj = 0;

    let localFoodAdj = 0.1; // Sometimes
    if (formData.localFoodPreference === 'rarely') localFoodAdj = 0.3;
    else if (formData.localFoodPreference === 'always') localFoodAdj = 0;

    const foodEmissionsTotal = dietBase + foodWasteAdj + localFoodAdj;

    // 3. Home Energy
    let homeBase = 2.5; // Medium house
    if (formData.homeSize === 'apartment') homeBase = 1.2;
    else if (formData.homeSize === 'large') homeBase = 4.8;

    const cleanEnergyShareNum = parseFloat(formData.cleanEnergyShare || 0);
    const renewableMultiplier = 1 - (cleanEnergyShareNum / 100);
    let energyEmissions = homeBase * renewableMultiplier;

    let heatAdj = 1.6; // Electric
    if (formData.heatingSource === 'gas') heatAdj = 1.2;
    else if (formData.heatingSource === 'heatpump') heatAdj = 0.3;
    else if (formData.heatingSource === 'wood') heatAdj = 0.6;

    const energyEmissionsTotal = energyEmissions + heatAdj;

    // 4. Shopping Habits
    let shoppingBase = 1.1; // Monthly
    if (formData.shoppingFrequency === 'weekly') shoppingBase = 2.4;
    else if (formData.shoppingFrequency === 'rarely') shoppingBase = 0.3;

    let recycleAdj = 0.2; // Sometimes
    if (formData.recycleHabits === 'none') recycleAdj = 0.6;
    else if (formData.recycleHabits === 'always') recycleAdj = 0;

    let secondhandAdj = 0.1; // Occasionally
    if (formData.secondhandPreference === 'never') secondhandAdj = 0.4;
    else if (formData.secondhandPreference === 'frequently') secondhandAdj = 0;

    const shoppingEmissionsTotal = shoppingBase + recycleAdj + secondhandAdj;

    // Totals
    const annualEmissions = parseFloat((transportEmissionsTotal + foodEmissionsTotal + energyEmissionsTotal + shoppingEmissionsTotal).toFixed(2));
    
    // Sustainability Score: 0 to 100 (higher is better)
    // Formula maps average ~16 tons to a score of ~44, excellent 4 tons to ~86, heavy emissions to lower scores.
    const totalScore = Math.max(10, Math.min(100, Math.round(100 - (annualEmissions * 3.5))));

    // Category Footprint Scores (scaled to 0-100, higher is worse footprint)
    const transportScore = Math.min(100, Math.round(transportEmissionsTotal * 8));
    const foodScore = Math.min(100, Math.round(foodEmissionsTotal * 20));
    const energyScore = Math.min(100, Math.round(energyEmissionsTotal * 15));
    const shoppingScore = Math.min(100, Math.round(shoppingEmissionsTotal * 25));

    return {
      annualEmissions,
      totalScore,
      transportScore,
      foodScore,
      energyScore,
      shoppingScore
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scores = calculateEmissions();
      const assessmentData = {
        transport_score: scores.transportScore,
        food_score: scores.foodScore,
        energy_score: scores.energyScore,
        shopping_score: scores.shoppingScore,
        total_score: scores.totalScore,
        annual_emissions: scores.annualEmissions,
        answers: formData
      };

      // 1. Call Gemini AI API for Analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { ...formData, ...scores } })
      });

      let aiAnalysis = null;
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success) {
          aiAnalysis = resJson.data;
        }
      }

      const finalRecord = {
        ...assessmentData,
        ai_analysis: aiAnalysis
      };

      // 2. Save Assessment
      if (user) {
        // Logged-in user: save to DB
        const { error: dbErr } = await supabase.from('assessments').insert({
          user_id: user.id,
          ...finalRecord
        });
        if (dbErr) throw dbErr;
      } else {
        // Guest user: save to LocalStorage
        const localAssessments = JSON.parse(localStorage.getItem('ecomind_assessments') || '[]');
        const mockAssessment = {
          id: 'guest_' + Math.random().toString(36).substring(2, 9),
          user_id: 'guest',
          created_at: new Date().toISOString(),
          ...finalRecord
        };
        localAssessments.push(mockAssessment);
        localStorage.setItem('ecomind_assessments', JSON.stringify(localAssessments));
        localStorage.setItem('ecomind_guest_session', 'true');
      }

      // Fire confetti
      const confettiMod = await import('canvas-confetti');
      confettiMod.default({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669', '#3b82f6']
      });

      // Redirect to Dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err) {
      console.error('Submission failed:', err);
      alert('Something went wrong, but we calculated your score locally! Redirecting to Dashboard.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen flex flex-col bg-[#020705] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Progress Indicators */}
          <div className="mb-8 relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
              <span className={currentStep === 1 ? 'text-emerald-400 font-bold' : ''}>1. Transport</span>
              <span className={currentStep === 2 ? 'text-emerald-400 font-bold' : ''}>2. Food</span>
              <span className={currentStep === 3 ? 'text-emerald-400 font-bold' : ''}>3. Home Energy</span>
              <span className={currentStep === 4 ? 'text-emerald-400 font-bold' : ''}>4. Shopping</span>
            </div>
            <div className="h-2 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Container */}
          <div className="glass-card rounded-2xl border border-white/10 p-6 sm:p-10 shadow-2xl relative bg-black/45 z-10">
            
            {loading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                  <Leaf className="h-6 w-6 text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    Gemini AI Analyst at Work
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm">
                    Analyzing your lifestyle patterns to calculate emissions and build custom sustainability plans...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* STEP 1: TRANSPORTATION */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center gap-3 border-b border-emerald-950/30 pb-4 mb-6">
                      <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Transportation Habits</h2>
                        <p className="text-xs text-slate-400">Tell us how you commute and travel.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Do you drive a personal vehicle?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => handleChange({ target: { name: 'hasCar', value: 'yes' } })}
                            className={`p-3.5 rounded-xl border text-sm font-medium transition-all text-center cursor-pointer ${
                              formData.hasCar === 'yes'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            Yes, I drive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChange({ target: { name: 'hasCar', value: 'no' } })}
                            className={`p-3.5 rounded-xl border text-sm font-medium transition-all text-center cursor-pointer ${
                              formData.hasCar === 'no'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            No, I do not
                          </button>
                        </div>
                      </div>

                      {formData.hasCar === 'yes' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Vehicle Type
                            </label>
                            <select
                              name="carType"
                              value={formData.carType}
                              onChange={handleChange}
                              className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                              <option className="bg-[#050f0c]" value="suv">SUV / Pickup Truck</option>
                              <option className="bg-[#050f0c]" value="sedan">Standard Sedan</option>
                              <option className="bg-[#050f0c]" value="compact">Compact / Hybrid Car</option>
                              <option className="bg-[#050f0c]" value="electric">Electric Vehicle (EV)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Weekly Commute Distance (Miles)
                            </label>
                            <input
                              type="number"
                              name="weeklyMiles"
                              value={formData.weeklyMiles}
                              onChange={handleChange}
                              min="0"
                              className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Public Transit Usage (Hours/Week)
                          </label>
                          <input
                            type="number"
                            name="publicTransitHours"
                            value={formData.publicTransitHours}
                            onChange={handleChange}
                            min="0"
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Flights Taken in Past Year
                          </label>
                          <input
                            type="number"
                            name="annualFlights"
                            value={formData.annualFlights}
                            onChange={handleChange}
                            min="0"
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: FOOD HABITS */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center gap-3 border-b border-emerald-950/30 pb-4 mb-6">
                      <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <Utensils className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Food & Diet habits</h2>
                        <p className="text-xs text-slate-400">How does your food choice affect emissions?</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Diet Profile
                        </label>
                        <select
                          name="diet"
                          value={formData.diet}
                          onChange={handleChange}
                          className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option className="bg-[#050f0c]" value="heavy-meat">Frequent Meat-Eater (beef, pork daily)</option>
                          <option className="bg-[#050f0c]" value="average">Average Meat-Eater (poultry, occasional red meat)</option>
                          <option className="bg-[#050f0c]" value="vegetarian">Vegetarian (no meat, consumes dairy/eggs)</option>
                          <option className="bg-[#050f0c]" value="vegan">Vegan (strictly plant-based)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            How often do you throw away food?
                          </label>
                          <select
                            name="foodWaste"
                            value={formData.foodWaste}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option className="bg-[#050f0c]" value="frequently">Frequently (multiple times a week)</option>
                            <option className="bg-[#050f0c]" value="occasionally">Occasionally (leftovers now and then)</option>
                            <option className="bg-[#050f0c]" value="rarely">Rarely / Never (mostly eat/compost everything)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Do you prioritize local/organic food?
                          </label>
                          <select
                            name="localFoodPreference"
                            value={formData.localFoodPreference}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option className="bg-[#050f0c]" value="always">Always (actively source local)</option>
                            <option className="bg-[#050f0c]" value="sometimes">Sometimes (supermarket blend)</option>
                            <option className="bg-[#050f0c]" value="rarely">Rarely / Never (mostly generic)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: HOME ENERGY */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center gap-3 border-b border-emerald-950/30 pb-4 mb-6">
                      <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <Home className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Home Energy Usage</h2>
                        <p className="text-xs text-slate-400">Evaluate utility carbon contributions.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Home Size
                          </label>
                          <select
                            name="homeSize"
                            value={formData.homeSize}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option className="bg-[#050f0c]" value="apartment">Apartment / Studio</option>
                            <option className="bg-[#050f0c]" value="medium">Small to Medium Detached House</option>
                            <option className="bg-[#050f0c]" value="large">Large Family Estate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Primary Heating Source
                          </label>
                          <select
                            name="heatingSource"
                            value={formData.heatingSource}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option className="bg-[#050f0c]" value="gas">Natural Gas Furnace</option>
                            <option className="bg-[#050f0c]" value="electric">Standard Electric Baseboards</option>
                            <option className="bg-[#050f0c]" value="heatpump">Energy-Efficient Heat Pump</option>
                            <option className="bg-[#050f0c]" value="wood">Wood/Pellets Burner</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Renewable/Clean Energy Share: <span className="text-emerald-400">{formData.cleanEnergyShare}%</span>
                        </label>
                        <input
                          type="range"
                          name="cleanEnergyShare"
                          min="0"
                          max="100"
                          step="25"
                          value={formData.cleanEnergyShare}
                          onChange={handleChange}
                          className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>0% (Standard Grid)</span>
                          <span>50%</span>
                          <span>100% (Full Solar/Wind)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: SHOPPING HABITS */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center gap-3 border-b border-emerald-950/30 pb-4 mb-6">
                      <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Shopping & Consumer habits</h2>
                        <p className="text-xs text-slate-400">Calculate emissions from purchased items.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Shopping Frequency (New clothes, electronics, goods)
                        </label>
                        <select
                          name="shoppingFrequency"
                          value={formData.shoppingFrequency}
                          onChange={handleChange}
                          className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option className="bg-[#050f0c]" value="weekly">Frequent (Weekly purchases of fashion/gadgets)</option>
                          <option className="bg-[#050f0c]" value="monthly">Moderate (Monthly essential items)</option>
                          <option className="bg-[#050f0c]" value="rarely">Rarely (Only buy when absolutely necessary)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Recycling Habits
                          </label>
                          <select
                            name="recycleHabits"
                            value={formData.recycleHabits}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option className="bg-[#050f0c]" value="always">Recycle Everything (paper, plastic, metal, glass)</option>
                            <option className="bg-[#050f0c]" value="sometimes">Recycle Sometimes (if convenient)</option>
                            <option className="bg-[#050f0c]" value="none">Do Not Recycle</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Do you buy secondhand/refurbished?
                          </label>
                          <select
                            name="secondhandPreference"
                            value={formData.secondhandPreference}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option className="bg-[#050f0c]" value="frequently">Frequently (thrifting & refurbished tech first)</option>
                            <option className="bg-[#050f0c]" value="occasionally">Occasionally (some clothes/furniture)</option>
                            <option className="bg-[#050f0c]" value="never">Never (always brand new)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-5 py-2.5 rounded-lg border border-white/10 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg flex items-center gap-1.5 group transition-all cursor-pointer"
                    >
                      Next Step
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Submit Assessment
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
