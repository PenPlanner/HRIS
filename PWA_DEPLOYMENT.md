# PWA Deployment Guide - HRIS Offline App

## 🚀 Quick Deploy to Vercel

### 1. Push to Git
```bash
git add .
git commit -m "Add PWA offline functionality"
git push
```

### 2. Deploy to Vercel
- Go to [vercel.com](https://vercel.com)
- Import your repository
- Vercel will auto-detect Next.js and deploy

**That's it!** PWA will work automatically on Vercel with HTTPS.

---

## ✅ What Works After Deployment

### Offline Features
- ✅ **Full App Offline** - Entire app cached and works without internet
- ✅ **PDF Downloads** - Download documents for offline access
- ✅ **Task Progress** - Saved in localStorage (syncs when Supabase is added)
- ✅ **Auto-Sync** - Changes sync automatically when back online
- ✅ **Install Prompt** - "Install App" button appears on HTTPS
- ✅ **Background Sync** - Service Worker syncs data in background

### Installation
- 📱 **Mobile** - Add to Home Screen (iOS/Android)
- 💻 **Desktop** - Install as standalone app (Chrome/Edge)
- 🔔 **Install Prompt** - Automatic popup (bottom-right corner)

---

## 🧪 Test Production Build Locally

```bash
# 1. Build production version
npm run build

# 2. Start production server
npm start

# 3. Open in Chrome
http://localhost:3000

# 4. Check DevTools
# - Open F12 → Application tab
# - Check "Service Workers" → Should show "Activated"
# - Check "Manifest" → Should show app info
# - Check "Storage" → IndexedDB → HRIS_Offline_PDFs
```

---

## 📊 Verify PWA on Vercel

After deployment:

1. **Open Your Vercel URL** (e.g., `https://your-app.vercel.app`)
2. **Check Chrome DevTools (F12)**
   - Application → Service Workers → Should be "Activated"
   - Application → Manifest → Should show icon and app info
   - Lighthouse → Run PWA audit → Should pass

3. **Test Install**
   - Look for install prompt (bottom-right)
   - Or: Chrome menu → "Install HRIS..."
   - App should install and open in standalone window

4. **Test Offline**
   - DevTools → Network → Check "Offline"
   - Reload page → Should still work!
   - Download PDFs → Should work offline

---

## 🔧 Troubleshooting

### Install Prompt Doesn't Appear
- ✅ Make sure you're on **HTTPS** (Vercel provides this automatically)
- ✅ Clear browser cache: DevTools → Application → Clear storage
- ✅ Service Worker must be "Activated" (check in DevTools)
- ✅ Manifest.json must be valid (check in DevTools → Manifest)

### Service Worker Not Registering
- ✅ Check `/sw.js` is accessible: `https://your-app.vercel.app/sw.js`
- ✅ Check headers in DevTools → Network → sw.js → Headers tab
- ✅ Clear Service Workers: DevTools → Application → Service Workers → Unregister

### Offline Mode Not Working
- ✅ Service Worker must be activated first (visit app online once)
- ✅ Download PDFs using "Download All" button
- ✅ Check cache in DevTools → Application → Cache Storage

---

## 📁 Project Structure

```
/public
  ├── sw.js              # Service Worker (caches app for offline)
  ├── manifest.json      # PWA manifest (app metadata)
  └── icon.svg           # App icon

/components
  ├── service-worker-registration.tsx  # Registers SW on load
  ├── pwa-install-prompt.tsx          # Install prompt popup
  ├── online-status-banner.tsx        # Offline/online banner
  └── offline-status-indicator.tsx    # Offline PDF manager

/lib
  └── offline-pdf-storage.ts   # IndexedDB for offline PDFs

/hooks
  ├── use-online-status.ts     # Detects online/offline
  └── use-offline-pdfs.ts      # Manages offline PDFs
```

---

## 🎯 Features Overview

### 1. Service Worker (`/public/sw.js`)
- Caches entire app (HTML, JS, CSS, images)
- Caches PDF documents automatically
- Handles offline API requests
- Background sync when online again

### 2. IndexedDB Storage
- **HRIS_Offline_PDFs** - Stores downloaded PDF documents
- **HRIS_Sync_Queue** - Queues changes for sync when back online

### 3. LocalStorage (Current)
- Task completion status
- Flowchart progress
- User preferences

*Note: Will migrate to Supabase later for cloud sync*

---

## 🔮 Future Enhancements (with Supabase)

- [ ] Cloud sync for task status
- [ ] Multi-device synchronization
- [ ] Conflict resolution for offline changes
- [ ] Real-time collaboration
- [ ] User authentication
- [ ] Team sharing

---

## 📱 Browser Support

| Browser | PWA Install | Offline | Sync |
|---------|------------|---------|------|
| Chrome (Desktop) | ✅ | ✅ | ✅ |
| Chrome (Android) | ✅ | ✅ | ✅ |
| Edge (Desktop) | ✅ | ✅ | ✅ |
| Safari (iOS 16.4+) | ✅ | ✅ | ⚠️ |
| Firefox | ❌* | ✅ | ✅ |

*Firefox supports PWA features but no install prompt

---

## 🐛 Known Issues

### Development Mode
- ❌ Service Worker doesn't work in `npm run dev`
- ❌ Install prompt doesn't appear
- ✅ Solution: Use `npm run build && npm start`

### iOS Safari
- ⚠️ Background sync limited
- ✅ Manual sync works when app is opened

---

## 📞 Support

Issues? Check:
1. Browser DevTools → Console (for errors)
2. Application → Service Workers (for SW status)
3. Network tab (for failed requests)

---

**Built with ❤️ using Next.js + PWA**
