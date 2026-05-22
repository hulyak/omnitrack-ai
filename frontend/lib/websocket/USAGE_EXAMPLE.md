# WebSocket Client Usage Examples

## Basic Usage

### 1. Using the Copilot WebSocket Hook

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';

export function MyCopilotComponent() {
  const {
    isConnected,
    isConnecting,
    sendMessage,
    messages,
    isTyping,
    error,
    conversationId,
  } = useCopilotWebSocket({
    userId: 'user-123',
    autoConnect: true,
    reconnectAttempts: 5,
    reconnectDelay: 1000,
  });

  return (
    <div>
      {/* Connection Status */}
      <div>
        Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Error Display */}
      {error && <div className="error">{error}</div>}

      {/* Messages */}
      <div>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.isStreaming ? 'streaming' : ''}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      {isTyping && <div>Assistant is typing...</div>}

      {/* Input */}
      <input
        type="text"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
        disabled={!isConnected}
      />
    </div>
  );
}
```

### 2. Manual Connection Control

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';

export function ManualConnectionComponent() {
  const {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    messages,
  } = useCopilotWebSocket({
    userId: 'user-123',
    autoConnect: false, // Don't connect automatically
  });

  return (
    <div>
      {/* Manual Connection Controls */}
      {!isConnected ? (
        <button onClick={connect}>Connect</button>
      ) : (
        <button onClick={disconnect}>Disconnect</button>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Send Message */}
      <button onClick={() => sendMessage('Hello!')} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
}
```

### 3. Handling Streaming Messages

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';

export function StreamingExample() {
  const { messages, sendMessage } = useCopilotWebSocket({
    userId: 'user-123',
  });

  return (
    <div>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message ${msg.isStreaming ? 'streaming' : 'complete'}`}
        >
          {/* Show pulsing animation while streaming */}
          <div className={msg.isStreaming ? 'animate-pulse' : ''}>
            {msg.content}
          </div>

          {/* Show streaming indicator */}
          {msg.isStreaming && (
            <span className="text-xs text-gray-500">Streaming...</span>
          )}
        </div>
      ))}

      <button onClick={() => sendMessage('Tell me a story')}>
        Send Message
      </button>
    </div>
  );
}
```

### 4. Offline Message Queue

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';
import { useState } from 'react';

export function OfflineQueueExample() {
  const { isConnected, sendMessage, messages } = useCopilotWebSocket({
    userId: 'user-123',
  });
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    // Messages are automatically queued if offline
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div>
      {/* Connection Status */}
      <div className={isConnected ? 'text-green-600' : 'text-red-600'}>
        {isConnected ? '🟢 Online' : '🔴 Offline (messages will be queued)'}
      </div>

      {/* Messages */}
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Input */}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>
        {isConnected ? 'Send' : 'Queue Message'}
      </button>
    </div>
  );
}
```

### 5. Error Handling

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';
import { useEffect } from 'react';

export function ErrorHandlingExample() {
  const { error, sendMessage, messages } = useCopilotWebSocket({
    userId: 'user-123',
  });

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('WebSocket error:', error);
      // Could also send to error tracking service
    }
  }, [error]);

  return (
    <div>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="text-red-800 font-semibold">Connection Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      <button onClick={() => sendMessage('Hello')}>Send</button>
    </div>
  );
}
```

### 6. Conversation ID Tracking

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';
import { useEffect } from 'react';

export function ConversationTrackingExample() {
  const { conversationId, sendMessage, messages } = useCopilotWebSocket({
    userId: 'user-123',
  });

  // Save conversation ID to localStorage
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('lastConversationId', conversationId);
    }
  }, [conversationId]);

  return (
    <div>
      {/* Display Conversation ID */}
      <div className="text-xs text-gray-500">
        Conversation: {conversationId || 'Not started'}
      </div>

      {/* Messages */}
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      <button onClick={() => sendMessage('Hello')}>Start Conversation</button>
    </div>
  );
}
```

## Advanced Usage

### 7. Custom Reconnection Strategy

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';

export function CustomReconnectionExample() {
  const { isConnected, isConnecting } = useCopilotWebSocket({
    userId: 'user-123',
    autoConnect: true,
    reconnectAttempts: 10, // Try 10 times instead of 5
    reconnectDelay: 500, // Start with 500ms instead of 1000ms
  });

  return (
    <div>
      {isConnecting && <div>Reconnecting...</div>}
      {isConnected ? <div>Connected</div> : <div>Disconnected</div>}
    </div>
  );
}
```

### 8. Integration with Auth Context

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth/auth-context';

export function AuthIntegrationExample() {
  const { user, isAuthenticated } = useAuth();

  const {
    isConnected,
    sendMessage,
    messages,
  } = useCopilotWebSocket({
    userId: user?.id || 'anonymous',
    autoConnect: isAuthenticated, // Only connect if authenticated
  });

  if (!isAuthenticated) {
    return <div>Please log in to use the copilot</div>;
  }

  return (
    <div>
      <div>Welcome, {user?.name}!</div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage('Hello')} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
}
```

### 9. Message Filtering

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';
import { useMemo } from 'react';

export function MessageFilteringExample() {
  const { messages, sendMessage } = useCopilotWebSocket({
    userId: 'user-123',
  });

  // Filter to show only assistant messages
  const assistantMessages = useMemo(
    () => messages.filter((msg) => msg.role === 'assistant'),
    [messages]
  );

  // Filter to show only user messages
  const userMessages = useMemo(
    () => messages.filter((msg) => msg.role === 'user'),
    [messages]
  );

  return (
    <div>
      <div>
        <h3>Your Messages</h3>
        {userMessages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>

      <div>
        <h3>Assistant Messages</h3>
        {assistantMessages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>

      <button onClick={() => sendMessage('Hello')}>Send</button>
    </div>
  );
}
```

### 10. Message Search

```tsx
'use client';

import { useCopilotWebSocket } from '@/lib/websocket';
import { useState, useMemo } from 'react';

export function MessageSearchExample() {
  const { messages, sendMessage } = useCopilotWebSocket({
    userId: 'user-123',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  return (
    <div>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Filtered Messages */}
      <div>
        {filteredMessages.length === 0 ? (
          <div>No messages found</div>
        ) : (
          filteredMessages.map((msg) => (
            <div key={msg.id}>
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          ))
        )}
      </div>

      <button onClick={() => sendMessage('Hello')}>Send</button>
    </div>
  );
}
```

## Testing Examples

### 11. Mock WebSocket for Testing

```tsx
// __tests__/copilot-websocket.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useCopilotWebSocket } from '@/lib/websocket/copilot-websocket-hook';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = WebSocket.CONNECTING;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    // Simulate server response
    setTimeout(() => {
      this.onmessage?.({
        data: JSON.stringify({
          type: 'message',
          content: 'Mock response',
          timestamp: Date.now(),
        }),
      } as MessageEvent);
    }, 100);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }
}

global.WebSocket = MockWebSocket as any;

describe('useCopilotWebSocket', () => {
  it('should connect on mount', async () => {
    const { result } = renderHook(() =>
      useCopilotWebSocket({ userId: 'test-user' })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('should send and receive messages', async () => {
    const { result } = renderHook(() =>
      useCopilotWebSocket({ userId: 'test-user' })
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    act(() => {
      result.current.sendMessage('Hello');
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.messages).toHaveLength(2); // User + Assistant
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('Mock response');
  });
});
```

## Common Patterns

### Pattern 1: Conditional Rendering Based on Connection

```tsx
const { isConnected, isConnecting } = useCopilotWebSocket();

return (
  <>
    {isConnecting && <LoadingSpinner />}
    {!isConnected && !isConnecting && <ConnectionError />}
    {isConnected && <ChatInterface />}
  </>
);
```

### Pattern 2: Optimistic UI Updates

```tsx
const { sendMessage, messages } = useCopilotWebSocket();

const handleSend = (content: string) => {
  // Message is added to UI immediately by the hook
  sendMessage(content);
  // No need to manually update state
};
```

### Pattern 3: Error Recovery

```tsx
const { error, connect, isConnected } = useCopilotWebSocket({
  autoConnect: false,
});

useEffect(() => {
  if (error && !isConnected) {
    // Show error for 5 seconds, then retry
    const timer = setTimeout(() => {
      connect();
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [error, isConnected, connect]);
```

## Best Practices

1. **Always check connection status before sending:**
   ```tsx
   if (isConnected) {
     sendMessage('Hello');
   }
   ```

2. **Handle errors gracefully:**
   ```tsx
   {error && <ErrorBanner message={error} />}
   ```

3. **Show connection status to users:**
   ```tsx
   <ConnectionIndicator isConnected={isConnected} />
   ```

4. **Disable input when disconnected:**
   ```tsx
   <input disabled={!isConnected} />
   ```

5. **Use conversation ID for tracking:**
   ```tsx
   useEffect(() => {
     if (conversationId) {
       analytics.track('conversation_started', { conversationId });
     }
   }, [conversationId]);
   ```

## Troubleshooting

### Issue: Messages not sending

**Solution:**
```tsx
const { isConnected, sendMessage } = useCopilotWebSocket();

// Check connection before sending
const handleSend = (msg: string) => {
  if (!isConnected) {
    console.warn('Not connected, message will be queued');
  }
  sendMessage(msg);
};
```

### Issue: Streaming not working

**Solution:**
```tsx
// Ensure backend sends streaming messages
// Check for isStreaming flag in messages
{messages.map(msg => (
  <div className={msg.isStreaming ? 'streaming' : ''}>
    {msg.content}
  </div>
))}
```

### Issue: Reconnection not working

**Solution:**
```tsx
// Increase reconnection attempts
useCopilotWebSocket({
  reconnectAttempts: 10,
  reconnectDelay: 500,
});
```

---

For more information, see [README.md](./README.md)
