# WebSocket Client Implementation

This directory contains WebSocket client implementations for real-time communication in OmniTrack AI.

## Components

### 1. `websocket-context.tsx`
General-purpose WebSocket context for system-wide real-time updates (digital twin updates, alerts, etc.).

**Features:**
- Connection management
- Message subscription by type
- Automatic reconnection with exponential backoff
- Authentication with JWT tokens

**Usage:**
```tsx
import { useWebSocket } from '@/lib/websocket';

function MyComponent() {
  const { isConnected, subscribe, send } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('alert_notification', (message) => {
      console.log('Alert received:', message.data);
    });
    
    return unsubscribe;
  }, [subscribe]);
}
```

### 2. `copilot-websocket-hook.ts`
Specialized WebSocket hook for AI Copilot chat functionality with streaming support.

**Features:**
- Connection lifecycle management
- Automatic reconnection with exponential backoff (up to 5 attempts)
- Message queue for offline messages
- Streaming message support with token-by-token updates
- Error handling and recovery
- Conversation state management

**Usage:**
```tsx
import { useCopilotWebSocket } from '@/lib/websocket';

function CopilotChat() {
  const {
    isConnected,
    isConnecting,
    sendMessage,
    messages,
    isTyping,
    error,
    conversationId,
    connect,
    disconnect,
  } = useCopilotWebSocket({
    userId: 'user-123',
    autoConnect: true,
    reconnectAttempts: 5,
    reconnectDelay: 1000,
  });
  
  return (
    <div>
      <button onClick={() => sendMessage('Hello!')}>
        Send Message
      </button>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

## Message Protocol

### Copilot WebSocket Messages

#### Client → Server

**Send Message:**
```json
{
  "action": "message",
  "message": "Add a new supplier in Asia",
  "conversationId": "conv-123",
  "streaming": true
}
```

#### Server → Client

**Acknowledgment:**
```json
{
  "type": "acknowledgment",
  "message": "Message received. Processing...",
  "timestamp": 1234567890
}
```

**Typing Indicator:**
```json
{
  "type": "typing",
  "timestamp": 1234567890
}
```

**Non-Streaming Message:**
```json
{
  "type": "message",
  "content": "I've added a new supplier in Asia.",
  "conversationId": "conv-123",
  "timestamp": 1234567890,
  "metadata": {
    "intent": "add-supplier",
    "confidence": 0.95,
    "actionSuccess": true
  }
}
```

**Streaming Start:**
```json
{
  "type": "stream_start",
  "conversationId": "conv-123",
  "timestamp": 1234567890,
  "metadata": {
    "intent": "add-supplier",
    "confidence": 0.95
  }
}
```

**Streaming Token:**
```json
{
  "type": "stream_token",
  "token": "I've ",
  "conversationId": "conv-123",
  "timestamp": 1234567890
}
```

**Streaming Complete:**
```json
{
  "type": "stream_complete",
  "conversationId": "conv-123",
  "timestamp": 1234567890,
  "metadata": {
    "tokenCount": 42,
    "actionSuccess": true
  }
}
```

**Streaming Interrupted:**
```json
{
  "type": "stream_interrupted",
  "conversationId": "conv-123",
  "timestamp": 1234567890,
  "error": "Connection lost",
  "partialResponse": "I've added a new supp"
}
```

**Suggestions:**
```json
{
  "type": "suggestions",
  "suggestions": [
    "View supplier details",
    "Add another supplier",
    "Run supply chain analysis"
  ],
  "conversationId": "conv-123",
  "timestamp": 1234567890
}
```

**Error:**
```json
{
  "type": "error",
  "error": "Failed to process request",
  "timestamp": 1234567890
}
```

## Connection Management

### Automatic Reconnection

Both WebSocket implementations include automatic reconnection with exponential backoff:

1. **Initial connection attempt** - Immediate
2. **First retry** - 1 second delay
3. **Second retry** - 2 seconds delay
4. **Third retry** - 4 seconds delay
5. **Fourth retry** - 8 seconds delay
6. **Fifth retry** - 16 seconds delay
7. **Max delay** - 30 seconds

After 5 failed attempts, the connection stops retrying and displays an error.

### Message Queuing

When the WebSocket is disconnected, messages are queued in memory:

```typescript
// Messages sent while offline are queued
sendMessage("Hello"); // Queued

// When connection is restored, queued messages are sent automatically
```

**Queue Behavior:**
- Messages are stored in order
- Queue is processed on reconnection
- Queue is cleared after successful send
- No persistence (cleared on page refresh)

## Streaming Support

The copilot WebSocket hook supports streaming responses for real-time token-by-token updates:

### How Streaming Works

1. **Client sends message** with `streaming: true`
2. **Server sends `stream_start`** - UI creates empty message bubble
3. **Server sends `stream_token`** repeatedly - UI appends each token
4. **Server sends `stream_complete`** - UI marks message as complete

### Streaming UI Updates

```tsx
// Message with isStreaming flag shows pulsing animation
<div className={message.isStreaming ? 'animate-pulse' : ''}>
  {message.content}
</div>
```

### Handling Interruptions

If streaming is interrupted (connection lost, error, etc.):

```typescript
// Partial response is preserved with [interrupted] marker
{
  id: 'msg-123',
  content: 'I have added a new supp [interrupted]',
  isStreaming: false
}
```

## Error Handling

### Connection Errors

```typescript
const { error } = useCopilotWebSocket();

if (error) {
  // Display error banner
  <div className="error-banner">{error}</div>
}
```

### Message Errors

Server errors are displayed as assistant messages:

```typescript
{
  id: 'msg-error-123',
  role: 'assistant',
  content: 'Sorry, I encountered an error processing your request.',
  timestamp: new Date()
}
```

## Environment Variables

### Required Configuration

```env
# Copilot WebSocket URL
NEXT_PUBLIC_COPILOT_WS_URL=wss://api.omnitrack.ai/copilot

# General WebSocket URL (for system updates)
NEXT_PUBLIC_WS_URL=wss://api.omnitrack.ai/ws
```

### Local Development

```env
NEXT_PUBLIC_COPILOT_WS_URL=ws://localhost:3001/copilot
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

## Testing

### Manual Testing

1. **Connection Test:**
   ```typescript
   const { isConnected, connect } = useCopilotWebSocket({ autoConnect: false });
   
   // Should connect successfully
   connect();
   expect(isConnected).toBe(true);
   ```

2. **Message Send Test:**
   ```typescript
   const { sendMessage, messages } = useCopilotWebSocket();
   
   sendMessage('Hello');
   // User message should appear immediately
   expect(messages[0].content).toBe('Hello');
   ```

3. **Streaming Test:**
   ```typescript
   // Send message and observe streaming tokens
   sendMessage('Add supplier');
   // Should see message content update incrementally
   ```

4. **Reconnection Test:**
   ```typescript
   // Disconnect server
   // Should see reconnection attempts in console
   // Should reconnect automatically
   ```

### Integration Testing

See `frontend/__tests__/copilot/` for integration tests.

## Performance Considerations

### Message Batching

Streaming tokens are sent individually but React batches state updates for performance.

### Memory Management

- Old messages are kept in memory (no automatic cleanup)
- Consider implementing message pagination for long conversations
- Conversation history is limited to last 5 messages for context

### Connection Pooling

- WebSocket connections are reused across component mounts
- Only one connection per user session
- Connection is closed on unmount/page close

## Security

### Authentication

WebSocket connections include JWT token in query parameters:

```typescript
const token = localStorage.getItem('auth_token');
const ws = new WebSocket(`${wsUrl}?userId=${userId}&token=${token}`);
```

### Token Validation

Backend validates token on connection:
- Invalid token → Connection rejected
- Expired token → Connection closed
- Valid token → Connection established

### Message Validation

All messages are validated on the server:
- Schema validation
- Parameter validation
- Authorization checks

## Troubleshooting

### Connection Fails Immediately

**Symptoms:** Connection closes right after opening

**Causes:**
- Invalid WebSocket URL
- Missing/invalid auth token
- CORS issues
- Server not running

**Solutions:**
1. Check `NEXT_PUBLIC_COPILOT_WS_URL` environment variable
2. Verify auth token in localStorage
3. Check browser console for CORS errors
4. Verify backend WebSocket handler is deployed

### Messages Not Sending

**Symptoms:** Messages appear in UI but no response

**Causes:**
- WebSocket disconnected
- Backend error
- Invalid message format

**Solutions:**
1. Check connection status indicator
2. Check browser network tab for WebSocket frames
3. Check backend logs for errors
4. Verify message format matches protocol

### Streaming Not Working

**Symptoms:** Messages appear all at once instead of streaming

**Causes:**
- Backend not sending stream tokens
- Frontend not handling stream tokens
- Network buffering

**Solutions:**
1. Verify backend sends `stream_start`, `stream_token`, `stream_complete`
2. Check browser console for stream token logs
3. Test with smaller messages
4. Check network conditions

### Reconnection Loop

**Symptoms:** Constant reconnection attempts

**Causes:**
- Backend rejecting connections
- Invalid credentials
- Server overload

**Solutions:**
1. Check backend logs for rejection reasons
2. Verify auth token is valid
3. Check server capacity
4. Increase reconnection delay

## Future Enhancements

### Planned Features

1. **Message Persistence**
   - Store messages in IndexedDB
   - Restore conversation on page reload
   - Sync across tabs

2. **Typing Indicators**
   - Show when user is typing
   - Send typing events to server
   - Display in multi-user scenarios

3. **Read Receipts**
   - Track message read status
   - Display read indicators
   - Sync across devices

4. **Voice Messages**
   - Record audio messages
   - Stream audio to server
   - Transcribe and process

5. **File Attachments**
   - Upload files through WebSocket
   - Stream large files
   - Preview attachments

## References

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [AWS API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [React Hooks Best Practices](https://react.dev/reference/react)

---

**Requirements Validated:**
- ✅ 2.1 - WebSocket connection management
- ✅ 2.2 - Streaming response support
- ✅ 2.3 - Message completion handling
- ✅ Connection lifecycle management
- ✅ Reconnection logic with exponential backoff
- ✅ Message queue for offline messages
- ✅ Streaming token parsing and UI updates
