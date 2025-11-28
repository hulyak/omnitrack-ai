'use client';

import { ScenarioSimulator } from '@/components/scenarios/scenario-simulator';
import { ProtectedRoute } from '@/lib/auth/protected-route';

export default function ScenariosPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <ScenarioSimulator />
      </div>
    </ProtectedRoute>
  );
}
