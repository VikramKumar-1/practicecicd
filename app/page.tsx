"use client";

import React, { useState } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import LiveTestRunner from "@/components/LiveTestRunner";
import GithubWorkflowStatus from "@/components/GithubWorkflowStatus";
import { Kanban, Flame, HelpCircle, GraduationCap } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"app" | "testing">("app");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-xl text-white">
              <Flame size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-wide uppercase">CI/CD & E2E Playground</h1>
              <p className="text-[10px] text-slate-400 font-medium">Practice and master E2E Automation</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("app")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "app"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Kanban size={13} />
              <span>Target App</span>
            </button>
            <button
              onClick={() => setActiveTab("testing")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === "testing"
                  ? "bg-slate-850 text-white shadow border border-slate-750"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap size={13} />
              <span>CI/CD & Testing Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "app" ? (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl text-xs flex items-start gap-3">
              <div className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg">
                <HelpCircle size={18} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-white">Interactive Sandbox Application</p>
                <p className="text-slate-400 leading-relaxed">
                  This Kanban board is the target of your tests. You can interact with it, create tasks, and switch themes. 
                  Use the **Failure Simulation Console** below to break parts of the app, then go to the 
                  **CI/CD & Testing** tab to trigger a real local run and see how Playwright reports the bugs live!
                </p>
              </div>
            </div>
            
            <KanbanBoard />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Live local test outputs */}
            <LiveTestRunner />

            {/* Live GitHub pipelines */}
            <GithubWorkflowStatus />
          </div>
        )}
      </div>

      {/* Footer Info bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 CI/CD & E2E Testing Practice Environment.</p>
          <div className="flex justify-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>Local Web Server: http://localhost:3000</span>
            <span>|</span>
            <span>Run local CLI: npx playwright test</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
