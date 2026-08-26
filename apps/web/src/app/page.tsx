import React from 'react';
import { Button } from '@timeswap/ui';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <h1 className="text-4xl font-bold text-teal-800 mb-4">
        TimeSwap Platform Foundation
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-8">
        Non-monetary, community-driven skill exchange and mutual aid marketplace.
      </p>
      <Button variant="primary">Explore Foundation</Button>
    </main>
  );
}
