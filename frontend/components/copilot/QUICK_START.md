# AI Copilot Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Import the Component

```tsx
import { CopilotChat } from '@/components/copilot';
```

### Step 2: Add State Management

```tsx
const [isCopilotOpen, setIsCopilotOpen] = useState(false);
```

### Step 3: Add the Copilot to Your Page

```tsx
<CopilotChat
  isOpen={isCopilotOpen}
  onClose={() => setIsCopilotOpen(false)}
/>
```

### Step 4: Add a Trigger Button

```tsx
import { MessageSquare } from 'lucide-react';

<button
  onClick={() => setIsCopilotOpen(true)}
  className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
>
  <MessageSquare className="w-6 h-6" />
</button>
```

### Complete Example

```tsx
'use client';

import { useState } from 'react';
import { CopilotChat } from '@/components/copilot';
import { MessageSquare } from 'lucide-react';

export default function MyPage() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Your page content */}
      <h1>My Page</h1>

      {/* Copilot trigger button */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
        aria-label="Open AI Copilot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Copilot interface */}
      <CopilotChat
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
}
```

## 🎨 Customization

### Change Position

```tsx
// Bottom-left
className="fixed bottom-4 left-4 ..."

// Top-right
className="fixed top-4 right-4 ..."
```

### Change Colors

```tsx
// Purple theme
className="bg-purple-600 hover:bg-purple-700"
```

### Add Supply Chain Context

```tsx
const supplyChainContext = {
  nodes: myNodes,
  edges: myEdges,
  configuration: myConfig,
  recentActions: [],
  activeSimulations: [],
};

<CopilotChat
  isOpen={isCopilotOpen}
  onClose={() => setIsCopilotOpen(false)}
  supplyChainContext={supplyChainContext}
/>
```

## 📱 Features

- ✅ Real-time chat interface
- ✅ Auto-resizing input
- ✅ Typing indicator
- ✅ Suggested prompts
- ✅ Minimize/maximize
- ✅ Mobile responsive
- ✅ Keyboard shortcuts
- ✅ Accessibility compliant

## ⌨️ Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line
- `Esc` - Close copilot

## 📚 Documentation

- [README.md](./README.md) - Full component documentation
- [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) - Detailed usage examples
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details

## 🔗 Next Steps

1. **Task 14:** WebSocket integration for real backend communication
2. **Task 15:** Accessibility enhancements
3. **Task 16:** Monitoring and logging

## 🐛 Troubleshooting

**Copilot not showing?**
- Check `isOpen` is `true`
- Verify z-index (should be z-40 or higher)

**Icons not displaying?**
- Ensure `lucide-react` is installed: `npm install lucide-react`

**TypeScript errors?**
- Import types: `import { CopilotChatProps } from '@/types/copilot'`

## 💡 Tips

1. Place the copilot button in a consistent location across pages
2. Use the same trigger button style throughout your app
3. Consider adding a badge for unread messages (future enhancement)
4. Test on mobile devices for optimal UX

---

**Ready to use!** The copilot UI is fully functional and ready for WebSocket integration.
