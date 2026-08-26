import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">404 - Page Not Found</h2>
      <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark">
        Return Home
      </Link>
    </div>
  );
}
