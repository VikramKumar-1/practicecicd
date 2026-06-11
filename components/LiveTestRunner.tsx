"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, AlertTriangle, CheckCircle, Terminal, HelpCircle, ShieldAlert } from "lucide-react";

interface TestStatus {
  name: string;
  status: "idle" | "running" | "passed" | "failed";
}

export default function LiveTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Hardcoded expected list of test cases in our test files
  const [testCases, setTestCases] = useState<TestStatus[]>([
    { name: "auth.spec.ts > Login Flow (valid credentials)", status: "idle" },
    { name: "auth.spec.ts > Login Flow Error (invalid credentials)", status: "idle" },
    { name: "kanban.spec.ts > Task Lifecycle (create, move, delete)", status: "idle" },
    { name: "kanban.spec.ts > Filter and Search options", status: "idle" },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const runTests = () => {
    setIsRunning(true);
    setExitCode(null);
    setLogs(["Connecting to test runner API...\n"]);
    
    // Reset test statuses to idle
    setTestCases((prev) => prev.map((t) => ({ ...t, status: "idle" })));

    const eventSource = new EventSource("/api/run-tests");

    eventSource.addEventListener("log", (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, data.text]);
    });

    eventSource.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      const testNameParsed = data.testName;
      
      // Match received test name with our hardcoded list elements
      setTestCases((prev) =>
        prev.map((t) => {
          // If the streamed test label contains our spec file name/description, update it
          if (
            testNameParsed.toLowerCase().includes(t.name.split(" > ")[1].toLowerCase().slice(0, 15)) ||
            testNameParsed.toLowerCase().includes(t.name.split(" > ")[0].toLowerCase())
          ) {
            return { ...t, status: data.status };
          }
          return t;
        })
      );
    });

    eventSource.addEventListener("done", (e) => {
      const data = JSON.parse(e.data);
      setExitCode(data.code);
      setIsRunning(false);
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      setLogs((prev) => [...prev, "\nConnection error to runner backend. Ensure server is active.\n"]);
      setIsRunning(false);
      eventSource.close();
    };
  };

  const getStatusIcon = (status: TestStatus["status"]) => {
    switch (status) {
      case "idle":
        return <HelpCircle className="text-slate-600 animate-pulse" size={16} />;
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="text-blue-500" size={20} />
            <span>Local Playwright E2E Runner</span>
          </h2>
          <p className="text-xs text-slate-400">Trigger tests locally on your host and watch stdout stream</p>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-lg"
        >
          {isRunning ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>Run Playwright Tests</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Test Cases Checklist */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Suite Cases</h3>
          <div className="bg-slate-950/60 border border-slate-850 rounded-lg p-3 space-y-2">
            {testCases.map((test, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-md hover:bg-slate-900 text-xs border border-transparent hover:border-slate-800 transition-all"
              >
                <div className="space-y-0.5 pr-2">
                  <p className="font-semibold text-slate-200">{test.name.split(" > ")[1]}</p>
                  <p className="text-[10px] text-slate-500">{test.name.split(" > ")[0]}</p>
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
        <div className="lg:col-span-3 flex flex-col h-[280px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Console Stream</h3>
          <div className="flex-1 bg-slate-950 font-mono text-xs text-slate-300 p-4 rounded-lg overflow-y-auto border border-slate-850 whitespace-pre-wrap select-text leading-relaxed">
            {logs.length === 0 ? (
              <span className="text-slate-600 italic">Logs will stream here when Playwright starts...</span>
            ) : (
              logs.join("")
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
