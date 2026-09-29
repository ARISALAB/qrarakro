// Δίνει στον συνδεδεμένο χρήστη ένα φρέσκο, υπογεγραμμένο link για τη σελίδα της συνδρομής του στο Lemon Squeezy.
// Ο πελάτης μπαίνει κατευθείαν, χωρίς λογαριασμό ή κωδικό στο Lemon Squeezy.
// Χρειάζεται στο Netlify (Environment variables):
//   LEMON_API_KEY             κλειδί API από το Lemon Squeezy (Settings → API)
//   FIREBASE_SERVICE_ACCOUNT  (το ίδιο με του webhook)
const crypto = require('crypto');

const b64url = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64url = s => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const json = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(obj) });

function readServiceAccount() {
  let raw = String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) return null;
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('`') && raw.endsWith('`'))) raw = raw.slice(1, -1).trim();
  if (!raw.startsWith('{') && !raw.startsWith('"')) { try { const d = Buffer.from(raw, 'base64').toString('utf8').trim(); if (d.startsWith('{')) raw = d; } catch (e) {} }
  const tries = [raw];
  if (!raw.startsWith('{')) tries.push('{' + raw.replace(/,\s*$/, '') + (raw.endsWith('}') ? '' : '}'));
  if (!raw.endsWith('}')) tries.push(raw.replace(/,\s*$/, '') + '}');
  for (const t of tries) { try { const o = JSON.parse(t); if (o && o.client_email && o.private_key && o.project_id) { o.private_key = o.private_key.replace(/\\n/g, '\n'); return o; } } catch (e) {} }
  return null;
}

// Έλεγχος του Firebase ID token του χρήστη (ότι είναι πράγματι συνδεδεμένος)
let jwksCache = null, jwksAt = 0;
async function verifyIdToken(token, projectId) {
  const [h, p, s] = String(token || '').split('.');
  if (!h || !p || !s) throw new Error('bad token');
  const head = JSON.parse(fromB64url(h).toString()), body = JSON.parse(fromB64url(p).toString());
  if (head.alg !== 'RS256') throw new Error('alg');
  if (!jwksCache || Date.now() - jwksAt > 3600e3) {
    jwksCache = await (await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')).json();
    jwksAt = Date.now();
  }
  const jwk = (jwksCache.keys || []).find(k => k.kid === head.kid);
  if (!jwk) throw new Error('kid');
  const ok = crypto.verify('RSA-SHA256', Buffer.from(h + '.' + p), crypto.createPublicKey({ key: jwk, format: 'jwk' }), fromB64url(s));
  const now = Date.now() / 1000;
  if (!ok || body.aud !== projectId || body.iss !== 'https://securetoken.google.com/' + projectId || body.exp < now || !body.sub) throw new Error('invalid');
  return body.sub;
}

async function googleToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const jwt = head + '.' + claim + '.' + b64url(crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(sa.private_key));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt });
  const j = await r.json(); if (!j.access_token) throw new Error('token'); return j.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  const sa = readServiceAccount();
  if (!sa || !process.env.LEMON_API_KEY) return json(500, { error: 'Λείπουν ρυθμίσεις στον server.' });

  let uid;
  try { uid = await verifyIdToken(String(event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, ''), sa.project_id); }
  catch (e) { return json(401, { error: 'Δεν είσαι συνδεδεμένος.' }); }

  // Ποια συνδρομή έχει ο χρήστης (τη γράφει το webhook στο users/{uid}.lemon)
  const token = await googleToken(sa);
  const u = await (await fetch('https://firestore.googleapis.com/v1/projects/' + sa.project_id + '/databases/(default)/documents/users/' + uid,
    { headers: { Authorization: 'Bearer ' + token } })).json();
  const lemon = u && u.fields && u.fields.lemon && u.fields.lemon.mapValue && u.fields.lemon.mapValue.fields;
  const subId = lemon && lemon.subscriptionId && lemon.subscriptionId.stringValue;
  if (!subId) return json(404, { error: 'Δεν βρέθηκε συνδρομή.' });

  // Φρέσκο υπογεγραμμένο link από το Lemon Squeezy (ισχύει 24 ώρες)
  const r = await fetch('https://api.lemonsqueezy.com/v1/subscriptions/' + encodeURIComponent(subId), {
    headers: { Accept: 'application/vnd.api+json', Authorization: 'Bearer ' + process.env.LEMON_API_KEY } });
  const j = await r.json().catch(() => ({}));
  const url = j && j.data && j.data.attributes && j.data.attributes.urls && j.data.attributes.urls.customer_portal;
  if (!url) { console.error('Lemon API', r.status, JSON.stringify(j).slice(0, 300)); return json(502, { error: 'Το Lemon Squeezy δεν απάντησε. Δοκίμασε ξανά σε λίγο.' }); }
  return json(200, { url });
};
