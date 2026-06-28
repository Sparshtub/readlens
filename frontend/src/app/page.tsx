"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useReaderStore } from "@/store/readerStore";
import Sidebar from "@/components/Sidebar";
import Library from "@/components/Library";
import { api } from "@/lib/api";
import { useAppAuth } from "@/hooks/useAppAuth";
import { 
  ArrowLeft, 
  StickyNote, 
  Trash2, 
  Calendar, 
  Award, 
  TrendingUp,
  Loader2
} from "lucide-react";


// Dynamically import PDF Reader (needs window and canvas client-side APIs)
const Reader = dynamic(() => import("@/components/Reader"), { ssr: false });

export default function Home() {
  const { getToken } = useAppAuth();
  const { 
    activeDocument, 
    setActiveDocument, 
    highlights, 
    setHighlights, 
    removeHighlight,
    theme 
  } = useReaderStore();
  
  const [currentView, setCurrentView] = useState<"library" | "notes" | "analytics">("library");
  
  // Analytics State
  interface DailyLogItem {
    date: string;
    seconds: number;
  }
  interface AnalyticsData {
    streak_days: number;
    total_highlights: number;
    total_documents: number;
    total_reading_time_seconds: number;
    daily_logs: DailyLogItem[];
  }
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  // Load user highlights globally
  useEffect(() => {
    async function loadHighlights() {
      try {
        const token = await getToken();
        const hls = await api.getHighlights(undefined, token);
        setHighlights(hls);
      } catch (err) {
        console.error("Failed to load highlights:", err);
      }
    }
    loadHighlights();
  }, [setHighlights, getToken]);

  // Load analytics when view shifts to analytics tab
  useEffect(() => {
    if (currentView !== "analytics") return;
    
    async function loadAnalytics() {
      setLoadingAnalytics(true);
      try {
        const token = await getToken();
        const data = await api.getAnalytics(token);
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    }
    loadAnalytics();
  }, [currentView, getToken]);

  // Handle active document change to switch view
  useEffect(() => {
    if (activeDocument) {
      setCurrentView("library"); // library is default, but Reader takes priority if activeDocument is set
    }
  }, [activeDocument]);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    if (theme === "dark") {
      root.classList.add("dark");
    }
  }, [theme]);

  const handleDeleteHighlight = async (id: string) => {
    try {
      const token = await getToken();
      await api.deleteHighlight(id, token);
      removeHighlight(id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete highlight");
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
        {activeDocument ? (
          /* Reader Mode */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Reader Return Bar */}
            <div className="h-14 border-b flex items-center px-6 gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setActiveDocument(null)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Library
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-500 font-medium">Currently Reading</span>
            </div>
            {/* Embedded PDF Canvas Reader */}
            <Reader />
          </div>
        ) : (
          /* Main Views */
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentView === "library" && <Library />}
            
            {currentView === "notes" && (
              <div className="flex-1 overflow-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
                <div className="border-b pb-5 border-slate-200 dark:border-slate-800 mb-8">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saved Notes</h1>
                  <p className="mt-2 text-sm text-slate-500">Every highlight you save is organized here.</p>
                </div>

                {highlights.length === 0 ? (
                  <div className="text-center py-20 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400">
                    <StickyNote className="mx-auto mb-3 opacity-50" size={36} />
                    <p className="text-sm font-medium">No highlights saved yet.</p>
                    <p className="text-xs mt-1">Open a PDF and highlight text passages to see them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {highlights.map((hl) => (
                      <div 
                        key={hl.id} 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded">
                            Page {hl.page_index}
                          </span>
                          <button 
                            onClick={() => handleDeleteHighlight(hl.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <blockquote className="mt-3 text-sm italic border-l-2 border-indigo-400 pl-3 text-slate-700 dark:text-slate-300">
                          "{hl.text}"
                        </blockquote>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t pt-3 border-slate-100 dark:border-slate-800">
                          <span>Highlight ID: {hl.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentView === "analytics" && (
              <div className="flex-1 overflow-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
                <div className="border-b pb-5 border-slate-200 dark:border-slate-800 mb-8">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics Dashboard</h1>
                  <p className="mt-2 text-sm text-slate-500">Track your daily reading stats and highlights progress.</p>
                </div>

                {loadingAnalytics || !analytics ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Streak Card */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center gap-4">
                        <div className="bg-orange-50 dark:bg-orange-950/30 text-orange-600 p-3.5 rounded-xl">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reading Streak</p>
                          <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                            {analytics.streak_days} {analytics.streak_days === 1 ? "Day" : "Days"}
                          </h3>
                        </div>
                      </div>

                      {/* Highlights Card */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center gap-4">
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 p-3.5 rounded-xl">
                          <StickyNote size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Highlights</p>
                          <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                            {analytics.total_highlights} {analytics.total_highlights === 1 ? "Note" : "Notes"}
                          </h3>
                        </div>
                      </div>

                      {/* Total Reading Time Card */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 p-3.5 rounded-xl">
                          <Award size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Reading Time</p>
                          <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                            {Math.round(analytics.total_reading_time_seconds / 60)} Min
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* CSS Custom Barchart Log */}
                    <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                      <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-indigo-500" />
                        Reading Activity Log
                      </h3>
                      
                      <div className="h-56 flex items-end justify-between px-2 pt-6 border-b border-slate-200 dark:border-slate-800">
                        {analytics.daily_logs.map((log, idx) => {
                          const maxSeconds = Math.max(...analytics.daily_logs.map(l => l.seconds), 1);
                          const heightPercent = Math.min(100, Math.max(5, (log.seconds / maxSeconds) * 90)); // Max 90% height
                          const minutes = Math.round(log.seconds / 60);

                          return (
                            <div key={idx} className="flex flex-col items-center w-full gap-2 h-full justify-end">
                              <div 
                                style={{ height: `${heightPercent}%` }}
                                className="bg-indigo-500 dark:bg-indigo-700 w-10 sm:w-16 rounded-t-md hover:bg-indigo-400 dark:hover:bg-indigo-600 transition-all flex items-center justify-center text-[9px] text-white font-bold cursor-help"
                                title={`${minutes} minute(s)`}
                              >
                                {minutes > 0 ? `${minutes}m` : ""}
                              </div>
                              <span className="text-[10px] text-slate-400 mb-1">{log.date}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
