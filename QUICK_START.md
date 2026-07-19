# Quick Start Guide - Sensei Dashboard

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone repository
git clone https://github.com/Aetherium-Nexus-Hub/Sensei.git
cd Sensei

# Install dependencies
npm install

# Create .env.local with your credentials
cp .env.example .env.local
# Edit .env.local and add your Firebase + Rated Network API keys
```

### Running Locally

```bash
# Development server
npm run dev
# Open http://localhost:3000

# Type checking
npm run lint

# Production build
npm run build
npm start  # Run production server
```

---

## 🎮 Using the Dashboard

### Time Range Selection
1. Click time range buttons at top of ChartHub: `1d`, `7d`, `30d`, `all`
2. All charts update instantly with smooth animations
3. Your preference is saved to browser (persists across sessions)

### Profile Switching
1. Click `CB77 NIGHT` or `AC ANIMUS` in header
2. Dashboard theme and terminology changes
3. Telemetry data loads for selected profile

### Real-time Metrics
- **Hero Telemetry**: Top 5-card banner showing Validators, Stake, Effectiveness, Health, Epoch
- **APR Drift**: Line chart showing network APR trends
- **Stacked Rewards**: Area chart showing reward sources (Attestation, Proposals, MEV, Tips)
- **Rewards Split**: Pie chart breakdown of reward composition
- **Client Diversity**: Bar chart showing execution layer client distribution
- **Consensus Node Map**: Interactive validator network visualization

### Alerts & Warnings
- Health score drops below threshold → Visual + audio alarm
- Customize threshold with slider
- Choose visual effect: `none`, `vignette`, `strobe`
- Choose audio: `off`, `pulse`, `siren`, `chirp`

---

## 🔧 Environment Setup

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select your project
3. Copy credentials to `.env.local`:

```bash
VITE_FIREBASE_API_KEY=<your-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
VITE_FIREBASE_PROJECT_ID=<your-project>
VITE_FIREBASE_STORAGE_BUCKET=<your-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

### Rated Network API

1. Sign up at [Rated.network](https://rated.network/)
2. Create API key in your account settings
3. Add to `.env.local` (backend):

```bash
RATED_API_KEY=<your-api-key>
```

---

## 📂 Project Structure

```
sensei/
├── src/
│   ├── components/        # React components
│   │   ├── Dashboard.tsx       # Main dashboard layout
│   │   ├── ChartHub.tsx        # Chart tabs container (USES CONTEXT)
│   │   ├── HeroTelemetry.tsx   # Metrics banner
│   │   ├── AlertFeed.tsx       # Alerts & actions
│   │   └── ...
│   ├── contexts/          # React Context (NEW)
│   │   └── TimeRangeContext.tsx  # Global time range state
│   ├── hooks/             # Custom React hooks (NEW)
│   │   └── useRatedDataStream.ts # Real-time data polling
│   ├── utils/             # Utility functions
│   ├── lib/               # External libraries
│   ├── App.tsx            # Root component (WRAPS WITH PROVIDER)
│   ├── main.tsx           # Entry point
│   └── ...
├── server.ts              # Express backend
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🎨 Styling & Theming

### CSS Classes
- `cp-border`: Cyberpunk border style
- `cp-cyan`, `cp-yellow`, `cp-red`: Color utilities
- `cp-dark`, `cp-darker`: Background colors
- `glitch-text`: Animated glitch effect
- `font-display`: Large title font
- `font-mono`: Monospace (terminal) font

### Theme Profiles
- **CB77 (Night City)**: Cyan + Yellow + Red
- **AC (Animus)**: Teal + Gold + Red

---

## 🔌 API Endpoints

### Frontend → Backend

| Endpoint | Method | Purpose |
|----------|--------|----------|
| `/api/stream` | GET (SSE) | Real-time game state updates |
| `/api/mock_update` | POST | Trigger mock telemetry update |
| `/update_state` | POST | Python vision module integration |
| `/api/rated/senseinode` | GET | Fetch Rated Network metrics |

### Backend Configuration

The backend (`server.ts`) handles:
- SSE streaming for real-time state updates
- Rated Network API proxy with 5-minute caching
- Mock data fallback when API is unavailable
- Profile-specific telemetry routing

---

## 🧪 Testing

### Manual Testing Checklist

```
☐ Time range buttons switch (1d → 7d → 30d → all)
☐ Charts update with smooth animations
☐ Profile switch (CB77 ↔ AC) changes theme
☐ Alerts trigger when health < threshold
☐ Audio plays (test with volume on)
☐ Google Drive backup works
☐ Firebase authentication works
☐ localStorage persists on refresh
☐ Mobile responsive (test on 375px)
☐ Touch interactions work (mobile)
```

### Testing Locally

```bash
# Open DevTools Console
F12 or Cmd+Option+I

# Check localStorage
localStorage.getItem('chart_time_range')
localStorage.getItem('alert_threshold')

# Simulate API error
fetch('/api/rated/senseinode').then(r => console.log(r.json()))

# Test profile switch
window.dispatchEvent(new CustomEvent('switch-profile', { detail: 'ac' }))
```

---

## 🚨 Common Issues

### "Cannot find module 'TimeRangeContext'"
**Solution**: Ensure file exists at `src/contexts/TimeRangeContext.tsx`

### "useTimeRange must be used within TimeRangeProvider"
**Solution**: Check ChartHub is rendered inside `<TimeRangeProvider>` (in App.tsx)

### "Rated API shows ERR"
**Solution**: Set `RATED_API_KEY` in `.env.local` or backend environment

### "Charts not updating on time change"
**Solution**: Verify `getAprData()`, `getRewardsData()` depend on `timeRange` variable

---

## 📖 Additional Resources

- [React Documentation](https://react.dev)
- [Recharts Guide](https://recharts.org)
- [Motion Animation Library](https://motion.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Docs](https://firebase.google.com/docs)

---

## 💡 Tips & Tricks

### Profile Command
```tsx
// Switch profiles with keyboard shortcut
window.dispatchEvent(new CustomEvent('switch-profile', { detail: 'cb77' }))
```

### Check Sync Time
```tsx
// View last sync time in App.tsx
localStorage.getItem('last_heartbeat_time')
```

### Clear All Data
```tsx
// Reset all localStorage (warning: destructive!)
localStorage.clear()
// Then refresh page
```

---

**Happy hacking! 🎮**

For more info, see `IMPLEMENTATION_SUMMARY.md`
