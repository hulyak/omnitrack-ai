# Frontend Library Documentation

This directory contains the core infrastructure for the OmniTrack AI frontend application.

## Structure

```
lib/
├── auth/              # Authentication and authorization
│   ├── auth-context.tsx      # Auth context provider and hooks
│   └── protected-route.tsx   # Protected route wrapper component
├── api/               # API client and data fetching
│   ├── client.ts             # HTTP client with error handling
│   └── hooks.ts              # SWR hooks for data fetching
└── websocket/         # Real-time WebSocket connection
    └── websocket-context.tsx # WebSocket context and hooks
```

## Authentication

### AuthProvider

Provides authentication state and methods throughout the application.

```tsx
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';

// In your root layout
<AuthProvider>{children}</AuthProvider>;

// In any component
const { user, isAuthenticated, login, logout } = useAuth();
```

### ProtectedRoute

Wraps components that require authentication.

```tsx
import { ProtectedRoute } from '@/lib/auth/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

## API Client

### HTTP Client

Centralized API client with authentication and error handling.

```tsx
import { apiClient } from '@/lib/api/client';

// GET request
const data = await apiClient.get('/digital-twin/state');

// POST request
const result = await apiClient.post('/scenarios/simulate', {
  type: 'disruption',
  severity: 'high',
});

// Error handling
try {
  await apiClient.get('/some-endpoint');
} catch (error) {
  if (error instanceof APIError) {
    console.log(error.statusCode, error.correlationId);
  }
}
```

### SWR Hooks

React hooks for data fetching with automatic caching and revalidation.

```tsx
import { useDigitalTwin, useAlerts, useAPI } from '@/lib/api/hooks';

function MyComponent() {
  // Predefined hooks
  const { data, error, isLoading } = useDigitalTwin();
  const { data: alerts } = useAlerts();

  // Generic hook
  const { data: custom } = useAPI('/custom-endpoint');

  return <div>{data && JSON.stringify(data)}</div>;
}
```

## WebSocket

### WebSocketProvider

Manages WebSocket connection with automatic reconnection.

```tsx
import { WebSocketProvider, useWebSocket } from '@/lib/websocket/websocket-context';

// In your root layout
<WebSocketProvider>{children}</WebSocketProvider>;

// In any component
const { isConnected, subscribe, send } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribe('alert_notification', (message) => {
    console.log('New alert:', message.data);
  });

  return unsubscribe;
}, [subscribe]);
```

### Message Types

- `digital_twin_update`: Real-time digital twin state changes
- `alert_notification`: New alert notifications
- `scenario_progress`: Simulation progress updates
- `agent_status`: Agent execution status updates

## Error Boundary

Catches and handles React errors gracefully.

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Log to error tracking service
  }}
>
  <YourComponent />
</ErrorBoundary>;
```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=https://api.omnitrack.ai
NEXT_PUBLIC_WS_URL=wss://api.omnitrack.ai/ws
```

## Design System

The application uses a comprehensive design system with CSS custom properties defined in `app/globals.css`:

### Colors

- Primary: `--primary`, `--primary-hover`, `--primary-light`
- Semantic: `--success`, `--warning`, `--error`, `--info`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Borders: `--border`, `--border-hover`

### Usage in Components

```tsx
<div className="bg-primary text-white hover:bg-primary-hover">
  Button
</div>

<div className="text-text-primary border-border">
  Content
</div>
```

## Testing

Unit tests should be placed alongside the source files with `.test.tsx` extension.

```tsx
// auth-context.test.tsx
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth-context';

test('login updates user state', async () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  });

  await act(async () => {
    await result.current.login('test@example.com', 'password');
  });

  expect(result.current.isAuthenticated).toBe(true);
});
```

## Best Practices

1. **Always use the API client** instead of raw fetch calls
2. **Use SWR hooks** for data fetching to benefit from caching
3. **Wrap protected pages** with ProtectedRoute component
4. **Subscribe to WebSocket events** in useEffect with cleanup
5. **Use ErrorBoundary** around major sections of the app
6. **Follow the design system** for consistent styling
7. **Handle loading and error states** in all components
