"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Terminal, 
  HelpCircle, 
  ShieldAlert, 
  History, 
  BarChart2, 
  Database,
  Activity
} from "lucide-react";

interface TestStatus {
  name: string;
  status: "idle" | "running" | "passed" | "failed";
}

interface RunRecord {
  id: string;
  timestamp: string;
  exitCode: number;
  testResults: TestStatus[];
  logs: string[];
}

export default function LiveTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<string | null>(null);

  // Expected list of test cases in our test suite
  const [testCases, setTestCases] = useState<TestStatus[]>([
    { name: "auth.spec.ts > Login Flow (valid credentials)", status: "idle" },
    { name: "auth.spec.ts > Login Flow Error (invalid credentials)", status: "idle" },
    { name: "kanban.spec.ts > Task Lifecycle (create, move, delete)", status: "idle" },
    { name: "kanban.spec.ts > Filter and Search options", status: "idle" },
    { name: "sandbox.spec.ts > Session Persistence & Logout Flow", status: "idle" },
    { name: "sandbox.spec.ts > Failure Simulation - Task Creation failure", status: "idle" },
  ]);

  // Track pipeline stages
  const [pipelineStage, setPipelineStage] = useState<"idle" | "init" | "testing" | "analytics">("idle");

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("playwright_test_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const runTests = () => {
    setIsRunning(true);
    setExitCode(null);
    setSelectedHistoryRun(null);
    setPipelineStage("init");
    
    const initialLog = "Connecting to test runner API...\nInitializing environment...\n";
    setLogs([initialLog]);
    
    // Reset test statuses to idle
    const resetTests = testCases.map((t) => ({ ...t, status: "idle" as const }));
    setTestCases(resetTests);

    const eventSource = new EventSource("/api/run-tests");
    let currentLogs = [initialLog];
    let currentTestCases = [...resetTests];

    eventSource.addEventListener("log", (e) => {
      const data = JSON.parse(e.data);
      currentLogs.push(data.text);
      setLogs([...currentLogs]);
    });

    eventSource.addEventListener("status", (e) => {
      setPipelineStage("testing");
      const data = JSON.parse(e.data);
      const testNameParsed = data.testName.toLowerCase();
      
      currentTestCases = currentTestCases.map((t) => {
        const cleanName = t.name.toLowerCase();
        const specPart = cleanName.split(" > ")[0];
        const descPart = cleanName.split(" > ")[1] || "";
        
        if (
          testNameParsed.includes(descPart.slice(0, 15)) ||
          testNameParsed.includes(specPart)
        ) {
          return { ...t, status: data.status };
        }
        return t;
      });
      setTestCases(currentTestCases);
    });

    eventSource.addEventListener("done", (e) => {
      const data = JSON.parse(e.data);
      setExitCode(data.code);
      setIsRunning(false);
      setPipelineStage("analytics");
      eventSource.close();

      // Save to History
      const newRecord: RunRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
        exitCode: data.code,
        testResults: currentTestCases,
        logs: currentLogs,
      };

      const updatedHistory = [newRecord, ...history].slice(0, 20); // Keep last 20 runs
      setHistory(updatedHistory);
      localStorage.setItem("playwright_test_history", JSON.stringify(updatedHistory));
    });

    eventSource.onerror = (err) => {
      const errorMsg = "\nConnection error to runner backend. Ensure server is active.\n";
      currentLogs.push(errorMsg);
      setLogs([...currentLogs]);
      setIsRunning(false);
      setPipelineStage("idle");
      eventSource.close();
    };
  };

  const clearHistory = () => {
    localStorage.removeItem("playwright_test_history");
    setHistory([]);
    setSelectedHistoryRun(null);
  };

  const loadHistoricalRun = (run: RunRecord) => {
    setSelectedHistoryRun(run.id);
    setLogs(run.logs);
    setTestCases(run.testResults);
    setExitCode(run.exitCode);
  };

  const getStatusIcon = (status: TestStatus["status"]) => {
    switch (status) {
      case "idle":
        return <HelpCircle className="text-slate-650" size={16} />;
      case "running":
        return (
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case "passed":
        return <CheckCircle className="text-emerald-500" size={16} />;
      case "failed":
        return <ShieldAlert className="text-red-500" size={16} />;
    }
  };

  // Metrics calculations
  const totalRuns = history.length;
  const passedRuns = history.filter(h => h.exitCode === 0).length;
  const successRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 w-full relative">
      <style>{`
        @keyframes flow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow {
          animation: flow 0.8s linear infinite;
        }
      `}</style>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500" size={20} />
            <span>Interactive CI/CD Pipelines & Testing</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Trigger real local E2E test runs with beautiful flowing visualization</p>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-blue-800 disabled:to-purple-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-lg"
        >
          {isRunning ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Pipeline Running...</span>
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>Trigger Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Flowing Pipeline Graph */}
      <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">CI/CD Pipeline Flow</h3>
        
        <div className="relative flex justify-between items-center w-full max-w-2xl mx-auto px-4">
          
          {/* Animated Connecting Flowing Line */}
          <svg className="absolute w-[85%] h-2 top-[22px] left-[7%] pointer-events-none" style={{ zIndex: 0 }}>
            {/* Background Base Line */}
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            {/* Glowing Active Flow Line */}
            {isRunning && (
              <line
                x1="0%"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="url(#flowGradient)"
                strokeWidth="4"
                strokeDasharray="8 6"
                strokeLinecap="round"
                className="animate-flow"
              />
            )}
          </svg>

          {/* Gradient Definition */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Node 1: Trigger */}
          <div className="flex flex-col items-center z-10">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
              isRunning || pipelineStage === "analytics"
                ? "bg-blue-500/10 border-blue-500/60 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              <Play size={16} className={isRunning ? "animate-pulse" : ""} />
            </div>
            <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-400">Trigger</span>
          </div>

          {/* Node 2: Environment */}
          <div className="flex flex-col items-center z-10">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
              pipelineStage === "init" 
                ? "bg-yellow-500/10 border-yellow-500/60 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse"
                : pipelineStage === "testing" || pipelineStage === "analytics"
                ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              <Database size={16} />
            </div>
            <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-400">Environment</span>
          </div>

          {/* Node 3: Run Tests */}
          <div className="flex flex-col items-center z-10">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
              pipelineStage === "testing" 
                ? "bg-purple-500/10 border-purple-500/60 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse"
                : pipelineStage === "analytics"
                ? exitCode === 0
                  ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400"
                  : "bg-red-500/10 border-red-500/60 text-red-400"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              <Terminal size={16} />
            </div>
            <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-400">Run Tests</span>
          </div>

          {/* Node 4: Save Analytics */}
          <div className="flex flex-col items-center z-10">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
              pipelineStage === "analytics"
                ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}>
              <BarChart2 size={16} />
            </div>
            <span className="text-[10px] font-bold mt-2 uppercase tracking-wide text-slate-400">Reporting</span>
          </div>

        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Pipeline Runs</p>
            <p className="text-2xl font-black text-white">{totalRuns}</p>
          </div>
          <History className="text-blue-500" size={24} />
        </div>

        <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pipeline Success Rate</p>
            <p className="text-2xl font-black text-emerald-400">{successRate}%</p>
          </div>
          <BarChart2 className="text-emerald-500" size={24} />
        </div>

        <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Last Exit Code</p>
            <p className={`text-2xl font-black ${exitCode === 0 ? "text-emerald-400" : exitCode === null ? "text-slate-400" : "text-red-400"}`}>
              {exitCode === null ? "N/A" : exitCode}
            </p>
          </div>
          <AlertTriangle className={exitCode === 0 ? "text-emerald-500" : "text-red-500"} size={24} />
        </div>
      </div>

      {/* Main Suite & Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Test Cases Checklist */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Suite Cases</h3>
          <div className="bg-slate-950/60 border border-slate-850 rounded-lg p-3 space-y-2">
            {testCases.map((test, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-900 text-xs border border-transparent hover:border-slate-800 transition-all"
              >
                <div className="space-y-0.5 pr-2">
                  <p className="font-semibold text-slate-200 leading-tight">{test.name.split(" > ")[1] || test.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{test.name.split(" > ")[0]}</p>
                </div>
                <div>{getStatusIcon(test.status)}</div>
              </div>
            ))}
          </div>

          {exitCode !== null && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                exitCode === 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {exitCode === 0 ? (
                <>
                  <CheckCircle size={16} />
                  <span>Suite passed successfully (exit code 0)!</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Suite failed or crashed (exit code {exitCode}). check logs.</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Live Terminal Terminal Output */}
        <div className="lg:col-span-3 flex flex-col h-[300px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {selectedHistoryRun ? "Viewing Historical Run Console" : "Live Console Stream"}
          </h3>
          <div className="flex-1 bg-slate-950 font-mono text-[11px] text-slate-350 p-4 rounded-lg overflow-y-auto border border-slate-850 whitespace-pre-wrap select-text leading-relaxed">
            {logs.length === 0 ? (
              <span className="text-slate-600 italic">Logs will stream here when Playwright starts...</span>
            ) : (
              logs.join("")
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* History log database */}
      {history.length > 0 && (
        <div className="pt-4 border-t border-slate-850">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Run History Database</h3>
            <button 
              onClick={clearHistory}
              className="text-[10px] text-slate-550 hover:text-red-400 font-semibold transition-colors"
            >
              Clear Records
            </button>
          </div>
          <div className="bg-slate-950/40 border border-slate-850 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-bold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Passed Tests</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {history.map((record) => {
                  const passedCount = record.testResults.filter(t => t.status === "passed").length;
                  const totalCount = record.testResults.length;
                  const isSelected = selectedHistoryRun === record.id;
                  
                  return (
                    <tr 
                      key={record.id} 
                      className={`hover:bg-slate-900/40 transition-colors ${isSelected ? "bg-blue-500/5 font-semibold" : ""}`}
                    >
                      <td className="p-3 text-[11px] font-mono text-slate-400">{record.timestamp}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          record.exitCode === 0 
                            ? "bg-emerald-500/10 text-emerald-450" 
                            : "bg-red-500/10 text-red-450"
                        }`}>
                          {record.exitCode === 0 ? "Success" : "Failure"}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {passedCount} / {totalCount} tests passed
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => loadHistoricalRun(record)}
                          className="text-blue-400 hover:underline"
                        >
                          {isSelected ? "Active View" : "Load Logs"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
