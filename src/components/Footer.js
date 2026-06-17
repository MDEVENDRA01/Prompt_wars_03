import Link from 'next/link';
import { Leaf, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#010504] border-t border-emerald-950/20 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/10">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-md font-bold tracking-tight text-white">
              EcoMind<span className="text-emerald-400">AI</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <Link href="/assessment" className="hover:text-emerald-400 transition-colors">
              Assessment
            </Link>
            <Link href="/what-if" className="hover:text-emerald-400 transition-colors">
              Simulator
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} EcoMind AI. Hackathon Challenge Platform.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
