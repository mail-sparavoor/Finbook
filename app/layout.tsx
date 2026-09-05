import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { PersonalFinanceProvider } from "@/lib/personal-context";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "MyFinBook | Personal Finance & CashBook",
  description: "Simple, minimalist personal income, expense, and lending tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        <AuthProvider>
          <PersonalFinanceProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </PersonalFinanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
