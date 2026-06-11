"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowRight, ArrowLeft, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  column: "todo" | "progress" | "done";
}

export default function KanbanBoard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Dev mode configurations (to inject test failures)
  const [breakLogin, setBreakLogin] = useState(false);
  const [breakTaskCreation, setBreakTaskCreation] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Add Task Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  // Load from local storage on client
  useEffect(() => {
    const savedLogin = localStorage.getItem("kanban_logged_in") === "true";
    setIsLoggedIn(savedLogin);
    
    const savedTasks = localStorage.getItem("kanban_tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Default tasks
      const defaultTasks: Task[] = [
        { id: "1", title: "Setup Playwright Tests", description: "Write initial E2E tests for authentication", priority: "high", column: "todo" },
        { id: "2", title: "Configure GitHub Actions", description: "Add playwright yaml workflow config", priority: "medium", column: "progress" },
        { id: "3", title: "Verify HTML report uploads", description: "Test artifact upload steps on workflow failure", priority: "low", column: "done" }
      ];
      setTasks(defaultTasks);
      localStorage.setItem("kanban_tasks", JSON.stringify(defaultTasks));
    }

    const savedBreakLogin = localStorage.getItem("dev_break_login") === "true";
    setBreakLogin(savedBreakLogin);
    const savedBreakTask = localStorage.getItem("dev_break_task") === "true";
    setBreakTaskCreation(savedBreakTask);
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("kanban_tasks", JSON.stringify(newTasks));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (breakLogin) {
      setLoginError("Database connection timed out (Simulated Failure)");
      return;
    }

    if (username === "admin" && password === "password") {
      setIsLoggedIn(true);
      setLoginError("");
      localStorage.setItem("kanban_logged_in", "true");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    localStorage.setItem("kanban_logged_in", "false");
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (breakTaskCreation) {
      // Fail silently or throw error to simulate test failure
      alert("Error: Failed to write to store (Simulated Failure)");
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      column: "todo",
    };

    const updated = [...tasks, newTask];
    saveTasks(updated);

    // Reset Form
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority("medium");
    setShowAddModal(false);
  };

  const moveTask = (taskId: string, direction: "next" | "prev") => {
    const columns: Task["column"][] = ["todo", "progress", "done"];
    const updated = tasks.map((task) => {
      if (task.id === taskId) {
        const currentIndex = columns.indexOf(task.column);
        let nextIndex = currentIndex + (direction === "next" ? 1 : -1);
        if (nextIndex >= 0 && nextIndex < columns.length) {
          return { ...task, column: columns[nextIndex] };
        }
      }
      return task;
    });
    saveTasks(updated);
  };

  const deleteTask = (taskId: string) => {
    const updated = tasks.filter((task) => task.id !== taskId);
    saveTasks(updated);
  };

  // Toggle developer settings
  const toggleBreakLogin = () => {
    const newVal = !breakLogin;
    setBreakLogin(newVal);
    localStorage.setItem("dev_break_login", String(newVal));
  };

  const toggleBreakTask = () => {
    const newVal = !breakTaskCreation;
    setBreakTaskCreation(newVal);
    localStorage.setItem("dev_break_task", String(newVal));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const getPriorityColor = (p: Task["priority"]) => {
    switch(p) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2" id="login-title">App Login under Test</h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Use username <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">admin</code> and password <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">password</code> to log in.
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase mb-1.5">Username</label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase mb-1.5">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          {loginError && (
            <div id="login-error" className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
              <AlertCircle size={14} />
              <span>{loginError}</span>
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Log In
          </button>
        </form>

        <div className="w-full border-t border-slate-800 mt-6 pt-4 space-y-3">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Developer Sandbox Controls</h3>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Simulate Auth/DB Failure</span>
            <input 
              id="toggle-break-login"
              type="checkbox" 
              checked={breakLogin} 
              onChange={toggleBreakLogin}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Dashboard Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Authenticated Dashboard</h2>
            <p className="text-xs text-slate-400">Logged in as admin</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            id="search-input"
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-48"
          />
          
          <select
            id="priority-filter"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Developer Control & Test Failure Simulators */}
      <div className="bg-slate-900/60 border border-dashed border-slate-800 p-3.5 rounded-xl flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="space-y-0.5">
          <h3 className="font-bold text-slate-300">Failure Simulation Console</h3>
          <p className="text-slate-500">Toggle these states to verify if Playwright tests catch the failure!</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer">
            <input 
              id="toggle-break-task"
              type="checkbox" 
              checked={breakTaskCreation} 
              onChange={toggleBreakTask}
              className="rounded bg-slate-800 border-slate-700 text-red-500"
            />
            <span>Break Task Creation</span>
          </label>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column Helper Builder */}
        {(["todo", "progress", "done"] as const).map((columnKey) => {
          const columnTasks = filteredTasks.filter((t) => t.column === columnKey);
          const columnLabels = {
            todo: { title: "To Do", bg: "bg-blue-500/10 text-blue-400" },
            progress: { title: "In Progress", bg: "bg-amber-500/10 text-amber-400" },
            done: { title: "Done", bg: "bg-emerald-500/10 text-emerald-400" },
          };

          return (
            <div 
              key={columnKey} 
              id={`column-${columnKey}`}
              className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${columnLabels[columnKey].bg}`}>
                    {columnLabels[columnKey].title}
                  </span>
                  <span className="text-slate-500 text-xs font-semibold">{columnTasks.length}</span>
                </div>
                {columnKey === "todo" && (
                  <button
                    id="add-task-btn"
                    onClick={() => setShowAddModal(true)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {/* Task List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-800 rounded-lg text-slate-600 text-xs">
                    No tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      data-testid={`task-${task.id}`}
                      className="bg-slate-950 border border-slate-850 p-3 rounded-lg shadow-sm hover:border-slate-700 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="font-semibold text-slate-200 text-sm">{task.title}</h4>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs mb-3 line-clamp-2">{task.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>

                        <div className="flex items-center gap-1">
                          {columnKey !== "todo" && (
                            <button
                              onClick={() => moveTask(task.id, "prev")}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                            >
                              <ArrowLeft size={12} />
                            </button>
                          )}
                          {columnKey !== "done" && (
                            <button
                              onClick={() => moveTask(task.id, "next")}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                            >
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for adding tasks */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Task Title</label>
                <input
                  id="new-task-title"
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Description</label>
                <textarea
                  id="new-task-desc"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Priority</label>
                <select
                  id="new-task-priority"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  id="submit-task-btn"
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
