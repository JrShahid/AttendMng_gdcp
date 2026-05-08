/* ─────────────────────────────────────
   ai.js — Claude AI Assistant
   ───────────────────────────────────── */

/* ── Pre-fill and send a question ── */
function aiQ(question) {
  document.getElementById('aiInput').value = question;
  sendAi();
}

/* ── Send message to Claude ── */
async function sendAi() {
  const input = document.getElementById('aiInput');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';

  addAiMsg('user', q);
  const thinkDiv = addAiMsg('ai', '<span class="dot">•</span><span class="dot">•</span><span class="dot">•</span>');

  // Get live attendance context from Supabase
  const context = await buildAiContext();

  const systemPrompt = `You are an AI assistant for EduTrack, a college attendance management system.

${context}

Guidelines:
- Be concise, professional, and helpful
- Use line breaks and bullet points for readability
- For warning letters, write complete formal letters with date, subject, body, and signature
- For analysis, give specific data-driven insights
- If data is missing, say so and offer general advice`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: CONFIG.ANTHROPIC_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: q }]
      })
    });

    const data  = await res.json();
    const reply = data.content?.map(c => c.text || '').join('\n') || 'Sorry, I could not process that.';
    thinkDiv.querySelector('.ai-bubble').innerHTML = reply.replace(/\n/g, '<br>');

  } catch (err) {
    thinkDiv.querySelector('.ai-bubble').textContent = 'Connection error. Please check your internet and try again.';
    console.error('AI error:', err);
  }

  document.getElementById('aiMessages').scrollTop = 9999;
}

/* ── Build real-time context string from Supabase ── */
async function buildAiContext() {
  const { data } = await sb.from('attendance_summary').select('*');
  if (!data?.length) return 'No attendance data available yet.';

  const map = {};
  data.forEach(r => {
    if (!map[r.student_id]) map[r.student_id] = { name: r.full_name, roll: r.roll_number, total: 0, present: 0 };
    map[r.student_id].total   += parseInt(r.total_classes) || 0;
    map[r.student_id].present += parseInt(r.present_count) || 0;
  });

  const rows    = Object.values(map).map(s => ({ ...s, pct: s.total ? Math.round(s.present / s.total * 100) : 0 }));
  const avg     = rows.length ? Math.round(rows.reduce((a, s) => a + s.pct, 0) / rows.length) : 0;
  const atRisk  = rows.filter(r => r.pct < 75).sort((a,b) => a.pct - b.pct).map(r => `${r.name} (${r.roll || 'N/A'}, ${r.pct}%)`).join(', ');
  const top3    = rows.sort((a,b) => b.pct - a.pct).slice(0, 3).map(r => `${r.name} (${r.pct}%)`).join(', ');

  return `Live attendance data:
- College: EduTrack
- Total students: ${rows.length}
- Subjects: ${subjects.map(s => s.name).join(', ') || 'Data Structures, DBMS, OS, Networks, SE'}
- Overall average attendance: ${avg}%
- Students at risk (below 75%): ${atRisk || 'None'}
- Top performers: ${top3 || 'N/A'}`;
}

/* ── Add message bubble to chat ── */
function addAiMsg(role, html) {
  const msgs = document.getElementById('aiMessages');
  const div  = document.createElement('div');
  div.className = 'ai-msg ' + role;

  if (role === 'ai') {
    div.innerHTML = `<div class="ai-icon">✦</div><div class="ai-bubble">${html}</div>`;
  } else {
    div.innerHTML = `<div class="ai-bubble">${html}</div><div class="ai-icon user">U</div>`;
  }

  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}
