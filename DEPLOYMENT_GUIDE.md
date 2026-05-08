# 🎓 EduTrack — Deployment Guide
## Supabase (Database + Auth) + Vercel (Hosting) — Both FREE

---

## STEP 1 — Set Up Supabase (Database + Auth)

### 1.1 Create Supabase Project
1. Go to → https://supabase.com
2. Click **"Start your project"** → Sign up (free)
3. Click **"New Project"**
4. Fill in:
   - **Name:** `edutrack`
   - **Database Password:** (save this!)
   - **Region:** Choose closest to India (e.g. `ap-south-1`)
5. Click **"Create new project"** — wait ~2 minutes

### 1.2 Run the Database Schema
1. In your Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy ALL the content and paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see: `Success. No rows returned`

### 1.3 Get Your Supabase Keys
1. In Supabase dashboard → click **"Settings"** (gear icon, left sidebar)
2. Click **"API"**
3. Copy these two values:
   - **Project URL** → looks like `https://xyzabc.supabase.co`
   - **anon public key** → long string starting with `eyJ...`

---

## STEP 2 — Get Your Anthropic API Key (for AI features)

1. Go to → https://console.anthropic.com
2. Sign up / Log in
3. Click **"API Keys"** → **"Create Key"**
4. Copy the key (starts with `sk-ant-...`)

> ⚠️ **Security Note:** For production, move the Anthropic API key to a backend function.
> For personal/college use, it's okay to keep it in the frontend.

---

## STEP 3 — Add Your Keys to the App

1. Open the file: `public/index.html`
2. Find this section near the top of the `<script>` tag:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const ANTHROPIC_KEY = 'YOUR_ANTHROPIC_API_KEY';
```

3. Replace the placeholder values:
```javascript
const SUPABASE_URL = 'https://xyzabc.supabase.co';         // your project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';      // your anon key
const ANTHROPIC_KEY = 'sk-ant-api03-...';                   // your Anthropic key
```

4. Save the file.

---

## STEP 4 — Deploy to Vercel (Free Hosting)

### Option A: Deploy via GitHub (Recommended)

1. Create a free account at → https://github.com
2. Create a new repository named `edutrack`
3. Upload all project files to the repository:
   - `public/index.html`
   - `supabase/schema.sql`
   - `package.json`
   - `vercel.json`
   - `.gitignore`

4. Go to → https://vercel.com → Sign up with GitHub
5. Click **"New Project"**
6. Select your `edutrack` repository
7. Click **"Deploy"** — Vercel auto-detects the config

✅ Your app will be live at: `https://edutrack-yourname.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Inside your project folder
vercel login
vercel --prod
```

---

## STEP 5 — Create Your First Admin Account

1. Open your deployed app URL
2. Click **"Sign Up"** tab
3. Select **"Teacher / Admin"**
4. Fill in your details and create an account
5. Check your email and click the confirmation link
6. Sign in — you're the first admin!

---

## STEP 6 — Add Subjects (One-time Setup)

After logging in as a teacher:
1. Go to your Supabase dashboard → **"SQL Editor"**
2. First, find your user ID:
   ```sql
   select id, email from auth.users;
   ```
3. Copy your UUID, then run (replace `<your-uuid>`):
   ```sql
   insert into public.subjects (name, code, section, teacher_id) values
     ('Data Structures', 'CS301', 'A', '<your-uuid>'),
     ('DBMS', 'CS302', 'A', '<your-uuid>'),
     ('Operating Systems', 'CS303', 'B', '<your-uuid>'),
     ('Computer Networks', 'CS304', 'B', '<your-uuid>'),
     ('Software Engineering', 'CS305', 'C', '<your-uuid>');
   ```

---

## HOW THE APP WORKS

### For Teachers / Admins:
- **Dashboard** — See total students, attendance stats, alerts
- **Mark Attendance** — Select subject + date, mark each student P/A/L, save
- **Reports** — View all students, at-risk list, top performers
- **Students** — Browse all enrolled students
- **AI Assistant** — Ask Claude to analyze trends, draft warning letters

### For Students:
- **Dashboard** — See their own attendance overview
- **Reports** — View their personal attendance per subject
- **AI Assistant** — Ask questions about their attendance

---

## PROJECT FILE STRUCTURE

```
edutrack/
├── public/
│   └── index.html          ← Main app (HTML + CSS + JS)
├── supabase/
│   └── schema.sql          ← Database tables + policies
├── package.json
├── vercel.json             ← Vercel deployment config
├── .gitignore
└── DEPLOYMENT_GUIDE.md     ← This file
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---|---|
| "Invalid API key" error | Double-check Supabase URL and anon key |
| Sign up email not received | Check spam folder; or disable email confirmation in Supabase Auth settings |
| Students not showing in attendance | Make sure subjects are added in Supabase |
| AI not responding | Check your Anthropic API key is correct |
| CORS error | Make sure you're using the anon key, not the service_role key |

### Disable Email Confirmation (for testing):
Supabase Dashboard → **Authentication** → **Settings** → toggle off **"Enable email confirmations"**

---

## SUPPORT

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Anthropic Docs: https://docs.anthropic.com
