"use client";

import React, { useState, useEffect } from "react";
import { GitBranch, GitPullRequest, CheckCircle2, XCircle, AlertCircle, RefreshCw, Github } from "lucide-react";

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_commit: {
    message: string;
    author: { name: string };
  };
  created_at: string;
}

export default function GithubWorkflowStatus() {
  const [repoInput, setRepoInput] = useState("");
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved repository path from localStorage
  useEffect(() => {
    const savedRepo = localStorage.getItem("github_practice_repo");
    if (savedRepo) {
      setRepoInput(savedRepo);
      setRepoPath(savedRepo);
    }
  }, []);

  const fetchWorkflowRuns = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.github.com/repos/${path}/actions/runs?per_page=1`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Repository not found or private." : "Failed to fetch runs.");
      }
      const data = await res.json();
      if (data.workflow_runs && data.workflow_runs.length > 0) {
        setLatestRun(data.workflow_runs[0]);
      } else {
        setLatestRun(null);
        setError("No workflow runs found in this repository. Ensure you have pushed a commit to trigger a workflow.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setLatestRun(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repoPath) {
      fetchWorkflowRuns(repoPath);
    }
  }, [repoPath]);

  const handleSaveRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPath = repoInput.trim().replace(/^https:\/\/github\.com\//, "");
    if (!cleanPath.includes("/")) {
      setError("Please enter repository in owner/repo format (e.g. username/practicecicd)");
      return;
    }
    setRepoPath(cleanPath);
    localStorage.setItem("github_practice_repo", cleanPath);
  };

  const handleRefresh = () => {
    if (repoPath) {
      fetchWorkflowRuns(repoPath);
    }
  };

  // Helper colors for status
  const getStatusBadgeClass = (status: string, conclusion: string | null) => {
    if (status !== "completed") return "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse";
    if (conclusion === "success") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (conclusion === "failure") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Github className="text-purple-400" size={20} />
            <span>GitHub Actions CI/CD Monitor</span>
          </h2>
          <p className="text-xs text-slate-400">Fetch and visualize workflow runs from your live GitHub repo</p>
        </div>

        {repoPath && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* GitHub Repository Selector */}
      <form onSubmit={handleSaveRepo} className="flex gap-2 w-full max-w-lg">
        <input
          type="text"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          placeholder="github-username/repository-name"
          className="flex-1 bg-slate-850 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Track Repo
        </button>
      </form>

      {/* Workflow Run Details */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400 text-xs gap-2">
          <RefreshCw className="animate-spin text-purple-400" size={16} />
          <span>Polling GitHub API...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg text-xs text-red-400 flex items-start gap-2.5">
          <AlertCircle size={16} className="mt-0.5" />
          <div>
            <p className="font-bold">Error</p>
            <p className="text-[11px] text-slate-500 mt-1">{error}</p>
          </div>
        </div>
      ) : latestRun ? (
        <div className="space-y-6">
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadgeClass(latestRun.status, latestRun.conclusion)}`}>
                  {latestRun.status !== "completed" ? "In Progress" : latestRun.conclusion}
                </span>
                <span className="text-slate-400 text-xs font-semibold">Run #{latestRun.id.toString().slice(-4)}</span>
              </div>
              <span className="text-[10px] text-slate-500">{new Date(latestRun.created_at).toLocaleString()}</span>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-white font-bold text-sm">"{latestRun.head_commit.message}"</p>
              <p className="text-slate-400">By {latestRun.head_commit.author.name}</p>
            </div>

            <div className="flex items-center gap-3 text-xs pt-1">
              <div className="flex items-center gap-1 text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                <GitBranch size={12} />
                <span>{latestRun.head_branch}</span>
              </div>
              <a
                href={latestRun.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                View Workflow on GitHub →
              </a>
            </div>
          </div>

          {/* Visual Pipeline Graph */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">CI/CD Pipeline Flow</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Trigger Event", status: "success" },
                { label: "Check Out Repo", status: "success" },
                { label: "Install Packages", status: latestRun.status === "completed" ? "success" : "running" },
                { 
                  label: "Playwright E2E", 
                  status: latestRun.conclusion === "failure" ? "failed" : latestRun.status === "completed" ? "success" : "idle" 
                },
                { 
                  label: "Deploy Target", 
                  status: latestRun.conclusion === "success" ? "success" : latestRun.conclusion === "failure" ? "idle" : "idle" 
                }
              ].map((stage, i) => {
                const getStageColor = (status: string) => {
                  switch(status) {
                    case "success": return "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
                    case "failed": return "bg-red-500/10 border-red-500/40 text-red-400";
                    case "running": return "bg-blue-500/10 border-blue-500/40 text-blue-400 animate-pulse";
                    default: return "bg-slate-950 border-slate-850 text-slate-600";
                  }
                };

                const getStageIcon = (status: string) => {
                  switch(status) {
                    case "success": return <CheckCircle2 size={14} className="text-emerald-500" />;
                    case "failed": return <XCircle size={14} className="text-red-500" />;
                    case "running": return <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
                    default: return <div className="h-3 w-3 bg-slate-800 rounded-full" />;
                  }
                };

                return (
                  <div key={i} className={`p-3 rounded-lg border text-center flex flex-col items-center justify-between gap-2.5 ${getStageColor(stage.status)}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{`Step ${i+1}`}</span>
                    <span className="text-xs font-semibold">{stage.label}</span>
                    <div>{getStageIcon(stage.status)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-slate-800 rounded-xl">
          <Github className="text-slate-700 mb-3" size={32} />
          <p className="text-slate-300 text-xs font-bold mb-1">No Repository Tracked Yet</p>
          <p className="text-slate-500 text-[11px] max-w-sm mb-3">
            Enter your GitHub repo path above (like <code className="bg-slate-950 p-0.5 rounded text-slate-400">username/practicecicd</code>) to fetch real status.
          </p>
          
          {/* Static Pipeline Flow Demo */}
          <div className="w-full max-w-md pt-4 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-3">Interactive Demo Pipeline Preview</p>
            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
              <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-emerald-400">1. Trigger (Commit)</span>
              <span className="text-slate-700">→</span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-emerald-400">2. Install Packages</span>
              <span className="text-slate-700">→</span>
              <span className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-blue-400 animate-pulse">3. Run Playwright</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
