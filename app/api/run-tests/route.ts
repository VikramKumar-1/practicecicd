import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      sendEvent("log", { text: "Starting Playwright test suite...\n" });

      // Run playwright test using spawn
      // We pass --reporter=list so we can easily parse the list of tests
      const projectRoot = path.resolve(process.cwd());
      
      // On Windows, npm commands need to run via shell
      const isWindows = process.platform === "win32";
      const cmd = isWindows ? "cmd.exe" : "npx";
      const args = isWindows 
        ? ["/c", "npx playwright test --reporter=list"] 
        : ["playwright", "test", "--reporter=list"];

      const child = spawn(cmd, args, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: "0" }, // Keep it clean of ANSI escape sequences
      });

      let buffer = "";

      const handleOutput = (data: Buffer) => {
        const text = data.toString();
        buffer += text;
        
        // Split by lines
        const lines = buffer.split("\n");
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          // Send raw log line
          sendEvent("log", { text: line + "\n" });

          // Parse line for E2E test state changes
          // Playwright list reporter formats:
          // "  1  ✓ [chromium] › auth.spec.ts:15:3 › ... (500ms)"
          // "  2  ✘ [chromium] › auth.spec.ts:25:3 › ... (1s)"
          // "  3  - [chromium] › auth.spec.ts:40:3 › ..."
          
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          // Check for pass
          if (cleanLine.includes("✓")) {
            const parts = cleanLine.split("✓");
            if (parts[1]) {
              const testLabel = parts[1].split("(")[0].trim();
              sendEvent("status", { testName: testLabel, status: "passed" });
            }
          }
          // Check for fail
          else if (cleanLine.includes("✘")) {
            const parts = cleanLine.split("✘");
            if (parts[1]) {
              const testLabel = parts[1].split("(")[0].trim();
              sendEvent("status", { testName: testLabel, status: "failed" });
            }
          }
          // Check for running
          else if (cleanLine.includes(" - ")) {
            const parts = cleanLine.split(" - ");
            if (parts[1]) {
              const testLabel = parts[1].trim();
              sendEvent("status", { testName: testLabel, status: "running" });
            }
          }
        }
      };

      child.stdout.on("data", handleOutput);
      child.stderr.on("data", handleOutput);

      child.on("close", (code) => {
        // Send final buffer if any
        if (buffer) {
          sendEvent("log", { text: buffer + "\n" });
        }
        sendEvent("done", { code: code ?? 0 });
        controller.close();
      });

      child.on("error", (err) => {
        sendEvent("log", { text: `System execution error: ${err.message}\n` });
        sendEvent("done", { code: -1 });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
