# AI Copilot Components

This directory contains the frontend UI components for the AI Copilot conversational interface.

## Components

### CopilotChat
Main container component that manages the copilot interface.

**Features:**
- Open/close animation
- Minimize/maximize functionality
- Message history management
- Responsive design with Tailwind CSS
- WebSocket connection handling (to be implemented in task 14)

**Props:**
```typescript
interface CopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  supplyChainContext?: SupplyChainContext;
}
```

**Requirements:** 1.1, 8.1

### MessageList
Displays conversation messages with auto-scroll functionality.

**Features:**
- Message bubbles for user and assistant
- Typing indicator
- Auto-scroll to bottom on new messages
- Timestamp display
- Streaming message support

**Props:**
```typescript
interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}
```

**Requirements:** 2.2, 2.4

### CopilotInput
Message input component with auto-resize textarea.

**Features:**
- Textarea with auto-resize (44px to 120px)
- Send button
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Character limit (2000 chars)
- Disabled state handling
- Character count display when < 100 remaining

**Props:**
```typescript
interface CopilotInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  suggestions?: string[];
}
```

**Requirements:** 1.1

### SuggestedPrompts
Displays clickable prompt suggestions for users.

**Features:**
- Display starter prompts on first open
- Show contextual suggestions
- Clickable prompt buttons
- Responsive grid layout

**Props:**
```typescript
interface SuggestedPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}
```

**Requirements:** 5.1, 5.4

## Usage

```tsx
import { CopilotChat } from '@/components/copilot';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Copilot
      </button>

      <CopilotChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        supplyChainContext={myContext}
      />
    </>
  );
}
```

## Styling

All components use Tailwind CSS for styling with the following design tokens:

- **Primary Color:** Blue (blue-600, blue-700)
- **Background:** White with gray borders
- **Text:** Gray scale (gray-500 to gray-900)
- **Animations:** Smooth transitions (300ms ease-in-out)

## Accessibility

All components follow WCAG AA accessibility guidelines:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Next Steps

Task 14 will implement:
- WebSocket client integration
- Real-time message streaming
- Connection management
- Reconnection logic

## Testing

Unit tests will be implemented in task 13.5 (optional) covering:
- Message rendering
- Input handling
- WebSocket connection
- User interactions

## File Structure

```
frontend/components/copilot/
├── copilot-chat.tsx          # Main container component
├── message-list.tsx          # Message display component
├── copilot-input.tsx         # Input component
├── suggested-prompts.tsx     # Prompt suggestions
├── index.ts                  # Barrel exports
└── README.md                 # This file
```

## Dependencies

- React 19
- Tailwind CSS
- lucide-react (icons)
- TypeScript

## Related Files

- `frontend/types/copilot.ts` - Type definitions
- `infrastructure/lambda/copilot/` - Backend implementation
- `.kiro/specs/ai-copilot/` - Specification documents
