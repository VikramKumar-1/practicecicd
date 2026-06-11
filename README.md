# 🚀 E2E Testing & CI/CD Practice Playground

Welcome to your hands-on practice playground for **Playwright E2E Testing** and **CI/CD Pipelines (GitHub Actions)**. This is a unified developer dashboard built using **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**.

---

## 🛠️ Quick Start Guide

To run this environment on your machine:

### 1. Install Dependencies
Open your terminal inside this project folder (`C:\Users\vikur\Downloads\practicecicd`) and run:
```bash
npm install
```

### 2. Install Playwright Browsers
Download and configure the headless Chromium test engine:
```bash
npx playwright install chromium
```

### 3. Run the Development Server
Start the local Next.js web application:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 How to Practice

### 1. The Target App
Under the **Target App** tab, you will find an interactive **Kanban Board** with a mock login wall:
* **Username**: `admin`
* **Password**: `password`
* Add tasks, move them between columns, or delete them to see how the app state behaves.

### 2. Run Tests Directly from the UI (No terminal needed!)
Go to the **CI/CD & Testing Dashboard** tab:
1. Click the **Run Playwright Tests** button.
2. Watch the live shell terminal stream output on the right.
3. Watch each test turn from a spinner to a green checkmark `✅` or red cross `❌` on the left as the runner processes them!

### 3. Intentionally Break the App to Test Failures
To practice troubleshooting failing E2E tests:
1. Go to the **Target App** tab.
2. In the **Failure Simulation Console**, check **Simulate Auth/DB Failure** or **Break Task Creation**.
3. Go back to the **CI/CD & Testing Dashboard** and run the tests.
4. Watch the tests fail and study the red terminal log outputs!

### 4. Hook up Real GitHub Actions Monitor
To monitor your real CI/CD pipeline runs:
1. Initialize a git repository and commit this codebase:
   ```bash
   git init
   git add .
   git commit -m "feat: init playwright playground"
   ```
2. Create a repository on GitHub, push your code to `main`.
3. In the **GitHub Actions CI/CD Monitor** panel on the page, type in your repository string (e.g. `your-github-username/your-repo-name`) and click **Track Repo**.
4. Push a new commit to trigger your pipeline and watch the status update live!

---

## 📂 Project Structure

* **`app/`**: Next.js App Router layout and pages.
* **`app/api/run-tests/route.ts`**: Server-Sent Events (SSE) backend runner that spawns Playwright and streams logs.
* **`components/`**: Clean React components for the Kanban board, terminal logs, and GitHub workflow pipelines.
* **`tests/`**: Real, raw Playwright E2E spec tests.
* **`playwright.config.ts`**: Configuration specifying testing ports, timeout settings, and automated development server start commands.
* **`.github/workflows/playwright.yml`**: Real GitHub Actions runner workflow steps.
