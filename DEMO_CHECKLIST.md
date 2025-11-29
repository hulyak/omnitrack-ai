# ✅ Demo Polish Checklist

## Quick Demo Polish - Use This While Demo is Running

**Start demo**: `./polish-demo-now.sh` or `cd frontend && npm run dev`

---

## 🎯 5-Minute Quick Check

### Landing Page (http://localhost:3000)

- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] "Get Started" button works
- [ ] Navigation menu works
- [ ] No console errors (F12 → Console)

### Dashboard (http://localhost:3000/dashboard)

- [ ] Page loads without errors
- [ ] Key metrics display
- [ ] Supply chain network renders
- [ ] Agent controls are visible
- [ ] No console errors

### Scenarios Page (http://localhost:3000/scenarios)

- [ ] Page loads without errors
- [ ] Form is visible and usable
- [ ] Submit button works
- [ ] No console errors

---

## 🔧 Common Issues & Quick Fixes

### Issue: Console Errors

**Check**: Open browser console (F12 → Console)

**Quick Fix**:
```bash
# Clear cache and restart
cd frontend
rm -rf .next
npm run dev
```

### Issue: Styles Not Loading

**Quick Fix**:
```bash
# Rebuild
cd frontend
npm run build
npm run dev
```

### Issue: Page Not Found

**Check**: Make sure you're using the correct URL
- Landing: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Scenarios: `http://localhost:3000/scenarios`

---

## 📸 Screenshot-Ready Checklist

Before capturing screenshots, verify:

### Landing Page
- [ ] Hero section fully loaded
- [ ] All images loaded
- [ ] Text is crisp and readable
- [ ] Buttons have hover states
- [ ] Professional appearance

### Dashboard
- [ ] All metrics showing data
- [ ] Supply chain network rendered
- [ ] Agent controls visible
- [ ] Alerts/notifications visible
- [ ] Professional appearance

### Scenarios Page
- [ ] Form is complete
- [ ] All fields visible
- [ ] Submit button prominent
- [ ] Professional appearance

---

## 🎬 Video Recording Checklist

Before recording, verify:

- [ ] Demo runs smoothly (no lag)
- [ ] All pages load quickly
- [ ] No console errors
- [ ] Transitions are smooth
- [ ] Data displays correctly

---

## 🚀 Quick Demo Flow

**For judges/video**:

1. **Start at Landing** (http://localhost:3000)
   - Show hero section
   - Highlight key features
   - Click "Get Started"

2. **Navigate to Dashboard** (http://localhost:3000/dashboard)
   - Show supply chain network
   - Demonstrate agent controls
   - Show key metrics

3. **Show Scenarios** (http://localhost:3000/scenarios)
   - Show scenario form
   - Explain what-if analysis
   - Show explainability features

4. **Return to Landing**
   - Summarize capabilities
   - Emphasize "Built with Kiro"

**Total time**: 2-3 minutes

---

## 💡 Pro Tips

### Make It Look Professional

1. **Clear browser cache** before screenshots
2. **Use incognito mode** for clean state
3. **Hide bookmarks bar** (Cmd+Shift+B)
4. **Full screen browser** (F11)
5. **Zoom to 100%** (Cmd+0)

### Make It Run Smoothly

1. **Close other apps** to free memory
2. **Restart dev server** if slow
3. **Clear .next folder** if issues
4. **Use Chrome** for best performance

### Make It Impressive

1. **Show real functionality** not just UI
2. **Demonstrate interactions** (clicks, hovers)
3. **Show data updates** if possible
4. **Highlight AI features** prominently
5. **Keep it smooth** - practice first

---

## 🎯 Ready for Screenshots?

Use this checklist:

- [ ] Demo running smoothly
- [ ] Browser at 1920x1080
- [ ] Incognito mode
- [ ] Bookmarks hidden
- [ ] Zoom at 100%
- [ ] All pages tested
- [ ] No console errors
- [ ] Professional appearance

**Then**: Follow `SCREENSHOT_CAPTURE_GUIDE.md`

---

## 🎬 Ready for Video?

Use this checklist:

- [ ] Demo running smoothly
- [ ] Script practiced 3 times
- [ ] Recording software tested
- [ ] Microphone tested
- [ ] All pages work
- [ ] Transitions smooth
- [ ] No console errors
- [ ] Professional appearance

**Then**: Follow `VIDEO_SCRIPT_DETAILED.md`

---

## 🚨 Emergency Fixes

### Demo Won't Start

```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

### Build Fails

```bash
cd frontend
npm install
npm run build
```

### Port 3000 In Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
npm run dev
```

---

## ✅ Final Check Before Submission

- [ ] Demo runs without errors
- [ ] All pages accessible
- [ ] Professional appearance
- [ ] Smooth performance
- [ ] Ready for screenshots
- [ ] Ready for video
- [ ] Tested on fresh browser

---

**You're ready!** 🎉

**Next**: Capture screenshots using `SCREENSHOT_CAPTURE_GUIDE.md`

**Or**: Record video using `VIDEO_SCRIPT_DETAILED.md`
