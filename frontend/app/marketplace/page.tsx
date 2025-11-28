'use client';

import { MarketplaceBrowser } from '@/components/marketplace/marketplace-browser';
import { ProtectedRoute } from '@/lib/auth/protected-route';

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <MarketplaceBrowser />
      </div>
    </ProtectedRoute>
  );
}
