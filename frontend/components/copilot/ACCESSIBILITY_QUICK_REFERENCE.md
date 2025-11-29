# AI Copilot Accessibility Quick Reference

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close copilot dialog |
| `Ctrl/Cmd + M` | Toggle minimize/maximize |
| `Tab` | Move to next interactive element |
| `Shift + Tab` | Move to previous interactive element |
| `Enter` | Send message (in textarea) |
| `Shift + Enter` | New line (in textarea) |

## Touch Gestures (Mobile)

| Gesture | Action |
|---------|--------|
| Swipe down on header (50px+) | Minimize dialog |
| Swipe up on header (50px+) | Maximize dialog |
| Tap header | Toggle minimize/maximize |
| Tap suggested prompt | Use that prompt |

## Screen Reader Announcements

### Automatic Announcements
- Connection status changes (connecting, connected, disconnected)
- New messages as they arrive
- Typing indicator when assistant is responding
- Error messages (assertive)
- Character count when approaching limit

### Element Labels
- All buttons have descriptive `aria-label` attributes
- Messages identified by sender and timestamp
- Input field clearly labeled
- Suggestions grouped and labeled

## Responsive Breakpoints

| Screen Size | Behavior |
|-------------|----------|
| < 768px (Mobile) | Full-screen dialog, touch gestures enabled |
| 768px - 1023px (Tablet) | Floating dialog (384px wide) |
| ≥ 1024px (Desktop) | Larger floating dialog (448px wide) |

## Developer Guidelines

### Adding New Interactive Elements

Always include:
```tsx
<button
  onClick={handleClick}
  className="... focus:outline-none focus:ring-2 focus:ring-blue-500"
  aria-label="Descriptive label"
  title="Tooltip text"
>
  {/* Content */}
</button>
```

### Adding Status Messages

Use live regions:
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Adding Error Messages

Use assertive live regions:
```tsx
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Screen Reader Only Content

Use the `.sr-only` class:
```tsx
<span className="sr-only">
  Additional context for screen readers
</span>
```

## Testing Checklist

### Keyboard Navigation
- [ ] Can open copilot with keyboard
- [ ] Focus moves to close button on open
- [ ] Can tab through all interactive elements
- [ ] Focus indicators are visible
- [ ] Can close with Escape key
- [ ] Can minimize with Ctrl/Cmd+M
- [ ] Can send message with Enter
- [ ] Can create new line with Shift+Enter

### Screen Reader
- [ ] Dialog announces when opened
- [ ] Connection status is announced
- [ ] Messages are announced as they arrive
- [ ] Typing indicator is announced
- [ ] All buttons have descriptive labels
- [ ] Input field has proper label
- [ ] Error messages are announced

### Mobile/Touch
- [ ] Dialog is full-screen on mobile
- [ ] Can swipe down to minimize
- [ ] Can swipe up to maximize
- [ ] Can tap header to toggle
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable without zooming
- [ ] Virtual keyboard doesn't obscure input

### Responsive
- [ ] Works at 320px width
- [ ] Works at 768px width
- [ ] Works at 1024px width
- [ ] No horizontal scrolling
- [ ] Content reflows properly

## Common Issues and Solutions

### Issue: Focus not trapped in dialog
**Solution**: Ensure `dialogRef` is properly set and focus trap logic is active

### Issue: Screen reader not announcing messages
**Solution**: Check that message list has `role="log"` and `aria-live="polite"`

### Issue: Touch gestures not working
**Solution**: Verify `headerRef` is set and touch handlers are attached

### Issue: Keyboard shortcuts conflicting
**Solution**: Check event propagation and `preventDefault()` usage

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [Touch Target Size Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

**Last Updated**: November 28, 2025
