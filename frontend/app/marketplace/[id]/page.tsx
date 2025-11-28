'use client';

import { ScenarioDetail } from '@/components/marketplace/scenario-detail';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { use } from 'react';

export default function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <ScenarioDetail scenarioId={id} />
      </div>
    </ProtectedRoute>
  );
}
