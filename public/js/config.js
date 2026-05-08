/* ─────────────────────────────────────
   config.js — App Configuration
   Replace placeholder values before deploying!
   ───────────────────────────────────── */

const CONFIG = {
  SUPABASE_URL:      'YOUR_SUPABASE_URL',       // e.g. https://xyzabc.supabase.co
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',  // starts with eyJ...
  ANTHROPIC_KEY:     'YOUR_ANTHROPIC_API_KEY',   // starts with sk-ant-...
  ANTHROPIC_MODEL:   'claude-sonnet-4-20250514',
};

// Initialize Supabase client
const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
