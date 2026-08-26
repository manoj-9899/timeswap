import './globals.css';
import React from 'react';

export const metadata = {
  title: 'TimeSwap - Skill Exchange & Mutual Aid Marketplace',
  description: 'A non-monetary, community-driven skill exchange and mutual aid marketplace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
