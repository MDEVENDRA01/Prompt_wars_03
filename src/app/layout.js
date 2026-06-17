import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "EcoMind AI | Carbon Footprint Tracker & AI Advisor",
  description: "Assess your carbon footprint, receive personalized AI recommendations powered by Gemini 2.5 Flash, complete challenges, and simulate carbon reduction.",
  keywords: "sustainability, carbon footprint, tracking, AI recommendations, climate change, green energy",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#020806] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
