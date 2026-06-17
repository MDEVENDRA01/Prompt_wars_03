'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingDown, Sparkles, Award, ArrowRight, 
  Leaf, Info, Calendar, Flame, CheckCircle, RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [streak, setStreak] = useState(3); // Mock user streak to wow the user

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);

    async function loadData() {
      // Check challenge completion status from local storage
      if (typeof window !== 'undefined') {
        const completed = localStorage.getItem('ecomind_challenge_completed') === 'true';
        setChallengeCompleted(completed);
      }

      // 1. Get user session
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. Get assessments
      let dbAssessments = [];
      if (user) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          dbAssessments = data;
        }
      } else {
        // Fetch from LocalStorage for guest
        const localAssessments = localStorage.getItem('ecomind_assessments');
        if (localAssessments) {
          dbAssessments = JSON.parse(localAssessments);
        }
      }

      setAssessments(dbAssessments);

      // Redirect to assessment page if no data exists
      if (dbAssessments.length === 0) {
        router.push('/assessment');
      } else {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Handle challenge checkbox toggle
  const handleToggleChallenge = async () => {
    const nextState = !challengeCompleted;
    setChallengeCompleted(nextState);
    localStorage.setItem('ecomind_challenge_completed', nextState ? 'true' : 'false');
    
    if (nextState) {
      // Fire confetti
      const confettiMod = await import('canvas-confetti');
      confettiMod.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#10b981', '#3b82f6', '#fbbf24']
      });
      setStreak(prev => prev + 1);
    } else {
      setStreak(prev => Math.max(0, prev - 1));
    }
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#020705]">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">Loading your dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Current assessment (most recent)
  const currentAssessment = assessments[assessments.length - 1];

  // Pie chart data
  const pieData = [
    { name: 'Transportation', value: parseFloat((currentAssessment.transport_score / 8).toFixed(2)) },
    { name: 'Diet & Food', value: parseFloat((currentAssessment.food_score / 20).toFixed(2)) },
    { name: 'Home Energy', value: parseFloat((currentAssessment.energy_score / 15).toFixed(2)) },
    { name: 'Shopping Habits', value: parseFloat((currentAssessment.shopping_score / 25).toFixed(2)) }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#fbbf24', '#ec4899'];

  // Line chart data (Progress trends)
  const progressData = assessments.map((a, idx) => ({
    name: new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    Emissions: a.annual_emissions,
    Score: a.total_score
  }));

  // Fallback AI Recommendations if Gemini did not load successfully
  const aiData = currentAssessment.ai_analysis || {
    biggestEmissionSources: ["Transportation", "Diet Habits"],
    recommendations: [
      {
        title: "Swap Driving for Public Transit",
        description: "Your transport score is higher than average. Swapping just 2 commute days per week for transit reduces emissions by over 800kg CO2 per year.",
        impact: "High Impact"
      },
      {
        title: "Implement Meatless Mondays",
        description: "Cutting red meat and dairy once a week is one of the single most effective things you can do to lower your food emissions.",
        impact: "Medium Impact"
      },
      {
        title: "Unplug Standby Electronics",
        description: "Unplug devices when they aren't in use. Phantom electrical currents account for up to 10% of home energy bills.",
        impact: "Low Impact"
      }
    ],
    weeklyChallenge: {
      title: "Active Commuter",
      description: "Replace three car journeys under 3 miles this week with cycling or walking.",
      points: 150
    },
    motivationalInsight: "Every positive choice you make adds up. You are paving the path to a cleaner, greener earth!"
  };

  // Compare user emissions with US and global averages
  const usAverage = 16.0;
  const globalAverage = 4.5;
  const targetAverage = 2.0; // IPCC goal
  
  const emissionsVal = currentAssessment.annual_emissions;
  let comparisonText = "";
  let comparisonColor = "";

  if (emissionsVal < targetAverage) {
    comparisonText = "Excellent! You are meeting the IPCC target for carbon neutrality.";
    comparisonColor = "text-emerald-400";
  } else if (emissionsVal < globalAverage) {
    comparisonText = "Great! Your footprint is lower than the global average.";
    comparisonColor = "text-emerald-300";
  } else if (emissionsVal < usAverage) {
    comparisonText = "Good. Your footprint is below the US average, but has room to improve.";
    comparisonColor = "text-amber-400";
  } else {
    comparisonText = "Warning. Your footprint exceeds the US average. Let's make changes!";
    comparisonColor = "text-red-400";
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020705] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 space-y-8 animate-fade-in-up">
        {/* Welcome row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-950/30 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Your Sustainability <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Assessment calculated on {new Date(currentAssessment.created_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Retake Assessment
            </Link>
            {!user && (
              <Link
                href="/auth?tab=signup"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Save Progress (Sign Up)
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sustainability Score */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden bg-black/30">
            <div className="absolute top-0 right-0 p-3 text-emerald-500/20">
              <Leaf className="h-16 w-16" />
            </div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Sustainability Rating</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">{currentAssessment.total_score}</span>
              <span className="text-slate-400 text-sm">/ 100</span>
            </div>
            <div className="mt-4 text-xs text-emerald-400 flex items-center gap-1">
              <span>Higher score = lower footprint</span>
            </div>
          </div>

          {/* Annual Emissions */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden bg-black/30">
            <div className="absolute top-0 right-0 p-3 text-teal-500/20">
              <TrendingDown className="h-16 w-16" />
            </div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Annual Emissions</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">{currentAssessment.annual_emissions}</span>
              <span className="text-slate-400 text-sm">tCO₂e</span>
            </div>
            <div className={`mt-4 text-xs font-medium ${comparisonColor}`}>
              {comparisonText}
            </div>
          </div>

          {/* Clean energy status */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 bg-black/30">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Renewable Energy Share</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-emerald-400">
                {currentAssessment.answers?.cleanEnergyShare || 0}%
              </span>
            </div>
            <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              <span>Renewable power source ratio</span>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden bg-black/30">
            <div className="absolute top-0 right-0 p-3 text-amber-500/10">
              <Flame className="h-16 w-16" />
            </div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Challenge Streak</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-amber-400">{streak}</span>
              <span className="text-slate-400 text-sm">weeks</span>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Complete AI challenges to build your streak.
            </div>
          </div>
        </div>

        {/* Challenge Widget & AI recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Challenge Card */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-white/5 bg-black/35 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-950/20 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-white">AI Weekly Challenge</h3>
                </div>
                <div className="flex items-center gap-1 text-xs bg-emerald-950/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Weekly</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-bold text-emerald-300">
                  {aiData.weeklyChallenge?.title}
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {aiData.weeklyChallenge?.description}
                </p>
                <div className="text-xs text-amber-400 font-semibold mt-1">
                  Rewards: +{aiData.weeklyChallenge?.points} Eco Points
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-emerald-950/20 pt-4">
              <button
                onClick={handleToggleChallenge}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                  challengeCompleted
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 text-white shadow-lg shadow-emerald-500/10'
                }`}
              >
                {challengeCompleted ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Challenge Completed!
                  </>
                ) : (
                  'Mark as Completed'
                )}
              </button>
            </div>
          </div>

          {/* AI Recommendations Card */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 bg-black/35">
            <div className="flex items-center gap-2 border-b border-emerald-950/20 pb-4 mb-4">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-white">Gemini AI Coaching Plan</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-emerald-950/20 border border-emerald-500/10 p-4 rounded-xl text-xs text-emerald-300">
                <Info className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold">Main Emission Sources:</span> {aiData.biggestEmissionSources?.join(', ')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiData.recommendations?.map((rec, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs bg-emerald-950/30 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded font-medium">
                        {rec.impact}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2 mb-1">{rec.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart: Category breakdown */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 bg-black/30">
            <h3 className="font-bold text-white mb-4">Emissions Breakdown (tCO₂e)</h3>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#071411', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart: Historical Progress */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 bg-black/30">
            <h3 className="font-bold text-white mb-4">Historical Carbon Footprint Trends</h3>
            <div className="h-72 w-full">
              {assessments.length < 2 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-xl">
                  <TrendingDown className="h-10 w-10 text-emerald-500/30 mb-2" />
                  <p className="text-sm text-slate-400">Complete additional footprint assessments over time to track your progress line chart.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis stroke="#94a3b8" dataKey="name" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#071411', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#fff', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Emissions" stroke="#10b981" strokeWidth={2.5} name="Emissions (tCO₂)" />
                    <Line type="monotone" dataKey="Score" stroke="#fbbf24" strokeWidth={2.5} name="Sustainability Score" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Motivational Insight Quote block */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/10 bg-emerald-950/10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" />
          <div className="relative z-10 space-y-2 max-w-2xl mx-auto">
            <div className="text-emerald-400 font-bold text-sm tracking-wide uppercase">AI Motivational Insight</div>
            <blockquote className="text-lg italic text-slate-200">
              &ldquo;{aiData.motivationalInsight}&rdquo;
            </blockquote>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
