import './globals.css';
import React from 'react';
import { AuthProvider } from '../providers/auth-provider';
import { NavigationShell } from '../components/navigation-shell';

export const metadata = {
  title: 'TimeSwap - Skill Exchange Community',
  description: 'A community marketplace where 1 hour of help equals 1 time credit. Share what you know, get help with what you need.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#fcfdfd] text-[#191c1b] antialiased min-h-screen font-sans">
        <AuthProvider>
          <NavigationShell>{children}</NavigationShell>
        </AuthProvider>
      </body>
    </html>
  );
}
