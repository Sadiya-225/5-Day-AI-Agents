import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import ThemedClerkProvider from "@/components/clerk-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MedSync AI",
  description: "Connect with Doctors Anytime, Anywhere",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo-single.png" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ThemedClerkProvider>
            <Header />
            <main>{children}</main>
            <Toaster richColors />

            <footer className="bg-muted/50 py-11 border-t border-border relative z-0">
              <div className="container mx-auto px-4 text-center text-muted-foreground text-md">
                <p>Developed by 🥼 Sadiya Maheen Siddiqui</p>
              </div>
            </footer>
          </ThemedClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
