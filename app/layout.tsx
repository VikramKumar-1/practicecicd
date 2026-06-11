import "./globals.css";
import { ThemeProvider } from "./providers";

export const metadata = {
  title: "CI/CD & Playwright Practice Dashboard",
  description: "Learn and practice E2E testing and automation live",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
