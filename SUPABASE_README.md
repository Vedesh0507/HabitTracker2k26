# Supabase Integration Guide
## Habit Tracker 2026

This document explains how the Supabase backend integration works and how to set it up.

---

## 🎯 What Gets Stored

### On Supabase (Server)
| Data | Purpose | Privacy Level |
|------|---------|---------------|
| `name` | Personalized greetings | Minimal PII |
| `first_visit` | User registration date | Anonymous metric |
| `last_active` | Daily active tracking | Anonymous metric |

### In localStorage (Browser - NEVER sent to server)
| Data | Purpose |
|------|---------|
| `habitTracker2026` | All habits and completion data |
| `habitTracker2026_user` | Cached user info for offline greeting |
| `habitTracker2026_lastActive` | Rate-limit for DAU updates |

---

## 🔧 Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Choose a name and region
5. Set a database password (save this!)
6. Wait for project to initialize (~2 minutes)

### Step 2: Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase-schema.sql`
4. Paste and click "Run"
5. Verify tables were created in **Table Editor**

### Step 3: Get API Keys

1. Go to **Settings** > **API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon/public key** (the long string under "Project API keys")

### Step 4: Update Configuration

**In `supabase.js`:**
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

**In `admin.html`:**
```javascript
const ADMIN_KEY = 'your-secure-admin-key';  // Change this!

const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

### Step 5: Deploy

Push to GitHub and deploy via Netlify as usual.

---

## 📊 Admin Dashboard

Access at: `yoursite.com/admin.html`

### What You Can See:
- Total registered users
- Daily/Weekly/Monthly active users
- **Registered Users List** (NEW):
  - User Name
  - First Visit Date & Time
  - Last Active Date & Time
  - Activity Status (Active Today / Inactive)
- Your local habit statistics (demo)

### What You CANNOT See:
- Individual user habit data
- Specific user completions
- Personal habit tracking information

### Access Control

The admin dashboard uses a simple key-based access:

1. Default key: `habit2026admin` (CHANGE THIS!)
2. Session-based (logout closes session)
3. For production, consider:
   - Supabase Auth with admin role
   - Netlify Identity
   - Server-side authentication

---

## 🔒 Security & Privacy

### Row Level Security (RLS)

The database has RLS enabled with these policies:
- Anyone can INSERT (for registration)
- Users can only SELECT/UPDATE their own row
- Analytics view only shows aggregated counts

### Data Minimization

We collect the absolute minimum:
- **Name**: For personalized greetings
- **Timestamps**: For usage analytics

We explicitly DO NOT collect:
- Habit names
- Completion data
- Usage patterns
- Device information
- IP addresses (Supabase may log, but we don't query)

---

## 🛠 How It Works

### First Visit Flow
```
User opens site
    ↓
isFirstVisit() checks localStorage
    ↓
No user found → Show name modal
    ↓
User enters name
    ↓
registerUser() saves to:
  1. Supabase (if available)
  2. localStorage (always)
    ↓
Modal closes, greeting appears
```

### Returning Visit Flow
```
User opens site
    ↓
isFirstVisit() → false
    ↓
updateLastActive() checks:
  - Is it a new day?
  - If yes, update Supabase
  - If no, skip (rate limited)
    ↓
Greeting displays from localStorage
```

### Offline Behavior
```
No internet connection
    ↓
getSupabaseClient() returns null
    ↓
All Supabase calls gracefully fail
    ↓
App continues working normally
    ↓
Data saved to localStorage
```

---

## 🧪 Testing Locally

### Test First Visit
1. Open browser DevTools
2. Go to Application > Local Storage
3. Delete `habitTracker2026_user`
4. Refresh page → Name modal should appear

### Test Greeting
1. Register with a name
2. Refresh page
3. Greeting should appear with your name

### Test Offline Mode
1. Open DevTools > Network
2. Set to "Offline"
3. Register/use app → Should work without errors

---

## 📁 File Structure

```
habit_tracker/
├── index.html          # Main app (unchanged)
├── style.css           # Styles (modal styles added)
├── script.js           # Main logic (unchanged)
├── supabase.js         # NEW: Supabase integration
├── admin.html          # NEW: Admin dashboard
├── supabase-schema.sql # NEW: Database schema
├── .env.example        # NEW: Config template
└── SUPABASE_README.md  # This file
```

---

## ❓ FAQ

**Q: Will my habits be sent to the server?**
A: No. Habits are ONLY stored in localStorage.

**Q: What if Supabase is down?**
A: The app works normally. Greeting uses cached name.

**Q: Can I skip the name modal?**
A: Currently no, but you could modify `isFirstVisit()` to allow anonymous usage.

**Q: How do I delete my data?**
A: Clear localStorage. We don't have a server-side deletion yet (could be added).

---

## 🚀 Future Enhancements

Potential additions (not implemented):
- [ ] Email opt-in for notifications
- [ ] Data export to Supabase (opt-in only)
- [ ] Leaderboards (anonymous)
- [ ] Social sharing (opt-in)
- [ ] Account deletion endpoint

---

## 📝 License

Same as main project.
