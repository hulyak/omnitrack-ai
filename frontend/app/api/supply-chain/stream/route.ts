import { NextRequest } from 'next/server';
import { getDemoDataStore } from '@/lib/demo-data-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const dataStore = getDemoDataStore();
  
  // Start simulation
  dataStore.startSimulation();

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const initialNodes = dataStore.getNodes();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ nodes: initialNodes })}\n\n`)
      );

      // Subscribe to updates
      const unsubscribe = dataStore.subscribe((nodes) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ nodes })}\n\n`)
          );
        } catch (error) {
          console.error('Error sending update:', error);
        }
      });

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
