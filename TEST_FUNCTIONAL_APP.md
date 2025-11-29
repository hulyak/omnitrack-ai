# Testing the Functional OmniTrack AI App

## Quick Start

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

## Test Checklist

### ✅ Landing Page Test
- [ ] Page loads without errors
- [ ] "GET STARTED" button is visible and prominent
- [ ] "Watch Demo" button is visible
- [ ] Clicking "GET STARTED" navigates to `/login`
- [ ] No waitlist component visible

### ✅ Login Page Test
- [ ] Page loads with dark theme
- [ ] Email and password fields are present
- [ ] "Try Demo Mode" button is visible and purple
- [ ] "Sign up" link navigates to `/signup`
- [ ] Clicking "Try Demo Mode" sets localStorage and redirects to `/dashboard`

### ✅ Signup Page Test
- [ ] Page loads with dark theme matching login
- [ ] All fields present: Name, Email, Password, Confirm Password
- [ ] Password validation works (min 8 characters)
- [ ] Password mismatch shows error
- [ ] Empty fields show error
- [ ] "Try Demo Mode" button works
- [ ] "Sign in" link navigates to `/login`

### ✅ Dashboard Test
- [ ] Page loads with dark gradient background
- [ ] "Demo Mode" badge visible in header
- [ ] Supply chain network displays 6 nodes
- [ ] Agent controls panel displays 4 agents
- [ ] All agent status indicators are green

### ✅ Supply Chain Network Test
- [ ] 6 nodes display correctly:
  - 🏭 Raw Materials Supplier
  - 🏭 Component Supplier
  - ⚙️ Assembly Plant
  - 📦 Central Warehouse
  - 🚚 Regional Distributor
  - 🏪 Retail Outlets
- [ ] Each node shows: inventory, capacity, utilization
- [ ] Status colors update (green/yellow/red)
- [ ] Metrics update every 5 seconds
- [ ] Progress bars animate smoothly
- [ ] "Live Updates" indicator pulses

### ✅ Info Agent Test
- [ ] "🔍 Scan for Anomalies" button visible
- [ ] Clicking button shows "Scanning..." state
- [ ] Results appear below controls
- [ ] Shows 2 anomalies with details
- [ ] Severity badges display (high/medium)
- [ ] Recommendations are visible

### ✅ Scenario Agent Test
- [ ] Dropdown shows 4 scenarios:
  - Port Closure
  - Supplier Disruption
  - Demand Spike
  - Weather Event
- [ ] "🎯 Run Simulation" button visible
- [ ] Clicking button shows "Simulating..." state
- [ ] Results show impact metrics:
  - Delivery Delay
  - Cost Increase
  - Revenue Risk
  - Affected Nodes
- [ ] Recommendations list displays
- [ ] Different scenarios show different data

### ✅ Strategy Agent Test
- [ ] "🛡️ Generate Mitigation Plan" button visible
- [ ] Clicking button shows "Generating..." state
- [ ] Results show 3 strategies
- [ ] Each strategy shows:
  - Name and priority badge
  - Timeframe, cost, expected benefit
  - Action items list
- [ ] Priority badges color-coded (high=red, medium=blue)

### ✅ Impact Agent Test
- [ ] "🌱 Calculate ESG Impact" button visible
- [ ] Clicking button shows "Calculating..." state
- [ ] Results show 3 ESG categories:
  - 🌍 Environmental (green border)
  - 👥 Social (blue border)
  - ⚖️ Governance (purple border)
- [ ] Each category shows relevant metrics
- [ ] Recommendations list displays

### ✅ Real-Time Updates Test
- [ ] Wait 5 seconds and observe supply chain network
- [ ] Inventory numbers change
- [ ] Utilization percentages update
- [ ] Status colors may change
- [ ] Progress bars animate to new values
- [ ] No console errors during updates

### ✅ Multiple Agent Test
- [ ] Click Info Agent → Results display
- [ ] Click Scenario Agent → Results replace previous
- [ ] Click Strategy Agent → Results replace previous
- [ ] Click Impact Agent → Results replace previous
- [ ] Timestamp updates for each result
- [ ] No memory leaks or performance issues

### ✅ Logout Test
- [ ] Click "Logout" button in header
- [ ] Redirects to landing page
- [ ] localStorage cleared
- [ ] Can navigate back to login

## Console Checks

Open browser DevTools (F12) and check:

### No Errors
- [ ] No red errors in Console
- [ ] No 404 errors in Network tab
- [ ] No TypeScript errors

### Expected Logs
- [ ] API calls to `/api/agents/*` succeed (200 status)
- [ ] Demo mode flag in localStorage
- [ ] React components render without warnings

## Performance Checks

### Load Times
- [ ] Landing page loads < 1 second
- [ ] Login page loads < 1 second
- [ ] Dashboard loads < 2 seconds
- [ ] Agent responses < 500ms

### Responsiveness
- [ ] No lag when clicking buttons
- [ ] Smooth animations
- [ ] Real-time updates don't cause jank

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

## Mobile Responsiveness

Test on mobile viewport (DevTools → Toggle Device Toolbar):
- [ ] Landing page responsive
- [ ] Login page responsive
- [ ] Dashboard responsive
- [ ] Agent controls stack vertically
- [ ] Supply chain network scrollable

## Edge Cases

### Demo Mode
- [ ] Refresh dashboard → Still in demo mode
- [ ] Open new tab → Demo mode persists
- [ ] Logout → Demo mode cleared

### Agent Errors
- [ ] Network error handling (disconnect WiFi)
- [ ] Invalid scenario selection
- [ ] Rapid clicking doesn't break UI

### Data Updates
- [ ] Supply chain updates continue during agent calls
- [ ] Multiple agent calls don't interfere
- [ ] Results display correctly for all agents

## Known Issues / TODO

### Current Limitations
- ⚠️ Authentication is simulated (no real Cognito)
- ⚠️ API routes return demo data (not connected to Lambda)
- ⚠️ No data persistence (refresh loses state)
- ⚠️ No WebSocket (using polling for updates)

### Future Enhancements
- 🔄 Connect to AWS Lambda functions
- 🔄 Implement AWS Cognito authentication
- 🔄 Add WebSocket for real-time updates
- 🔄 Implement data persistence
- 🔄 Add error boundaries
- 🔄 Add loading skeletons
- 🔄 Add toast notifications

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **Smooth user experience**
✅ **Real-time updates work**
✅ **All 4 agents functional**
✅ **Demo mode works end-to-end**

## Troubleshooting

### Dashboard doesn't load
- Check if demo mode is set: `localStorage.getItem('demoMode')`
- Clear localStorage and try again
- Check console for errors

### Agents don't respond
- Check Network tab for API calls
- Verify API routes exist in `frontend/app/api/agents/`
- Check for CORS issues

### Real-time updates not working
- Check if `demoMode` prop is passed to SupplyChainNetwork
- Verify useEffect cleanup in component
- Check for JavaScript errors

### Styling issues
- Verify Tailwind CSS is configured
- Check for conflicting styles
- Ensure dark mode classes are applied

## Reporting Issues

If you find bugs:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Take screenshots if UI issue
4. Note browser and OS version

---

**Last Updated**: November 28, 2025
**Status**: Ready for testing
**Expected Result**: All tests pass ✅
