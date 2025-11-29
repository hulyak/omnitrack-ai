# AI Copilot Usage Example

## Basic Integration

Here's how to integrate the AI Copilot into any page:

### 1. Add to Dashboard Page

```tsx
'use client';

import { useState } from 'react';
import { CopilotChat } from '@/components/copilot';
import { MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your dashboard content */}
      <div className="p-6">
        <h1>Supply Chain Dashboard</h1>
        {/* ... other content ... */}
      </div>

      {/* Floating Copilot Button */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
        aria-label="Open AI Copilot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Copilot Chat Interface */}
      <CopilotChat
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
}
```

### 2. Add to Layout (Global Access)

```tsx
// app/layout.tsx
'use client';

import { useState } from 'react';
import { CopilotChat } from '@/components/copilot';
import { MessageSquare } from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <html lang="en">
      <body>
        {children}

        {/* Global Copilot Button */}
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
          aria-label="Open AI Copilot"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {/* Global Copilot */}
        <CopilotChat
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      </body>
    </html>
  );
}
```

### 3. With Supply Chain Context

```tsx
'use client';

import { useState } from 'react';
import { CopilotChat } from '@/components/copilot';
import { useSupplyChain } from '@/lib/hooks/use-supply-chain';

export default function SupplyChainPage() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const { nodes, edges, configuration } = useSupplyChain();

  const supplyChainContext = {
    nodes,
    edges,
    configuration,
    recentActions: [],
    activeSimulations: [],
  };

  return (
    <div>
      {/* Your content */}
      
      <CopilotChat
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        supplyChainContext={supplyChainContext}
      />
    </div>
  );
}
```

## Keyboard Shortcuts

Users can interact with the copilot using keyboard shortcuts:

- **Open Copilot:** Click the floating button
- **Send Message:** Press `Enter`
- **New Line:** Press `Shift + Enter`
- **Close Copilot:** Press `Esc` or click the X button
- **Minimize:** Click the minimize button

## Customization

### Custom Starter Prompts

You can customize the starter prompts by modifying the `starterPrompts` array in `copilot-chat.tsx`:

```tsx
const starterPrompts = [
  'Your custom prompt 1',
  'Your custom prompt 2',
  'Your custom prompt 3',
  'Your custom prompt 4',
  'Your custom prompt 5',
];
```

### Custom Styling

The copilot uses Tailwind CSS classes. You can customize colors by modifying the classes:

```tsx
// Change primary color from blue to purple
className="bg-purple-600 hover:bg-purple-700"
```

### Custom Position

Change the position by modifying the fixed positioning classes:

```tsx
// Bottom-left instead of bottom-right
className="fixed bottom-4 left-4 ..."

// Top-right
className="fixed top-4 right-4 ..."
```

## State Management

### Using Context API

```tsx
// contexts/copilot-context.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CopilotContextType {
  isOpen: boolean;
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        openCopilot: () => setIsOpen(true),
        closeCopilot: () => setIsOpen(false),
        toggleCopilot: () => setIsOpen((prev) => !prev),
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within CopilotProvider');
  }
  return context;
}
```

### Using the Context

```tsx
// app/layout.tsx
import { CopilotProvider } from '@/contexts/copilot-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CopilotProvider>
          {children}
        </CopilotProvider>
      </body>
    </html>
  );
}

// Any component
import { useCopilot } from '@/contexts/copilot-context';

function MyComponent() {
  const { openCopilot } = useCopilot();

  return (
    <button onClick={openCopilot}>
      Ask AI Copilot
    </button>
  );
}
```

## Accessibility

The copilot is fully accessible:

- **Screen Readers:** All elements have proper ARIA labels
- **Keyboard Navigation:** Full keyboard support
- **Focus Management:** Proper focus handling
- **Color Contrast:** WCAG AA compliant

## Mobile Responsiveness

The copilot automatically adapts to mobile screens:

- Responsive width (max-width: calc(100vw - 2rem))
- Touch-friendly button sizes
- Optimized for small screens

## Next Steps

After Task 14 (WebSocket integration), the copilot will:

1. Connect to the backend via WebSocket
2. Send real messages to the AI
3. Receive streaming responses
4. Handle reconnections automatically
5. Queue messages when offline

## Troubleshooting

### Copilot not appearing
- Check that `isOpen` is set to `true`
- Verify z-index is high enough (z-50)
- Check for CSS conflicts

### Messages not sending
- Verify WebSocket connection (Task 14)
- Check browser console for errors
- Ensure backend is running

### Styling issues
- Clear browser cache
- Rebuild Tailwind CSS
- Check for conflicting styles

## Examples in Codebase

Once integrated, you can see the copilot in action at:

- `/dashboard` - Main dashboard with copilot
- `/scenarios` - Scenario planning with AI assistance
- `/supply-chain` - Supply chain configuration with copilot

---

**Note:** This is a UI-only implementation. Backend integration will be completed in Task 14.
