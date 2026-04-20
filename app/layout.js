import {Inter} from "next/font/google"
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";


const inter = Inter({subsets:["latin"]});

export const metadata = {
  title: "Wealth Management",
  description: "By Naman Chaturvedi",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header/>
          <main className="min-h-screen">{children}</main>
          <Toaster richColors/>
          <footer className="bg-blue-50 dark:bg-gray-900 py-12">
            <div className="container mx-auto px-4 text-center text-gray-400">
              <p>Made by Naman Chaturvedi</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
