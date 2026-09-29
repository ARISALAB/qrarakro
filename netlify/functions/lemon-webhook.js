// Webhook του Lemon Squeezy: ενεργοποιεί / ενημερώνει το Premium στο Firebase.
// Δεν χρειάζεται καμία εξωτερική βιβλιοθήκη (μιλάει απευθείας με το Firestore REST API).
// Χρειάζεται στο Netlify (Project configuration → Environment variables):
//   LEMON_SIGNING_SECRET      ο κωδικός που έβαλες στο webhook του Lemon Squeezy
//   FIREBASE_SERVICE_ACCOUNT  ολόκληρο το JSON του service account του Firebase
//   LEMON_VARIANT_IDS         τα Variant IDs του QR Premium χωρισμένα με κόμμα, π.χ. 123456,123457
const crypto = require('crypto');

const HANDLED = ['subscription_created', 'subscription_updated', 'subscription_cancelled', 'subscription_resumed',
                 'subscription_expired', 'subscription_paused', 'subscription_unpaused'];

const b64url = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
async function googleToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const jwt = head + '.' + claim + '.' + b64url(crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(sa.private_key));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Token error: ' + JSON.stringify(j));
  return j.access_token;
}
// Μετατροπή απλών τιμών σε μορφή Firestore REST
function val(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'object') return { mapValue: { fields: fields(v) } };
  return { stringValue: String(v) };
}
function fields(o) { const f = {}; Object.keys(o).forEach(k => f[k] = val(o[k])); return f; }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  // 1. Έλεγχος υπογραφής: μόνο το Lemon Squeezy μπορεί να στείλει έγκυρο αίτημα
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
  const sig = String(event.headers['x-signature'] || event.headers['X-Signature'] || '');
  const expected = crypto.createHmac('sha256', process.env.LEMON_SIGNING_SECRET || '').update(raw).digest('hex');
  if (!process.env.LEMON_SIGNING_SECRET || sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return { statusCode: 401, body: 'Invalid signature' };

  let body;
  try { body = JSON.parse(raw); } catch (e) { return { statusCode: 400, body: 'Bad JSON' }; }
  const name = body.meta && body.meta.event_name;
  if (!HANDLED.includes(name)) return { statusCode: 200, body: 'Ignored event' };
  const a = (body.data && body.data.attributes) || {};

  // 2. Αγνοούμε ό,τι δεν αφορά το QR Premium (π.χ. συνδρομές του TableReserve στο ίδιο store)
  const variants = String(process.env.LEMON_VARIANT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!variants.includes(String(a.variant_id))) return { statusCode: 200, body: 'Other product' };

  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const base = 'https://firestore.googleapis.com/v1/projects/' + sa.project_id + '/databases/(default)/documents';
  const token = await googleToken(sa);
  const api = (path, payload) => fetch(base + path, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());

  // 3. Ποιος χρήστης; Πρώτα από τα custom data του checkout, αλλιώς από το email
  let uid = body.meta.custom_data && body.meta.custom_data.uid;
  if (!uid && a.user_email) {
    const res = await api(':runQuery', { structuredQuery: { from: [{ collectionId: 'users' }],
      where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: a.user_email } } }, limit: 1 } });
    const hit = Array.isArray(res) && res.find(x => x.document);
    if (hit) uid = hit.document.name.split('/').pop();
  }
  if (!uid || !/^[A-Za-z0-9]{10,64}$/.test(uid)) { console.warn('No user for subscription', body.data && body.data.id, a.user_email); return { statusCode: 200, body: 'No matching user' }; }

  // 4. Μέχρι πότε ισχύει το Premium
  const status = a.status; // on_trial, active, paused, past_due, unpaid, cancelled, expired
  const live = ['active', 'on_trial', 'past_due'].includes(status);
  let until = live ? (a.renews_at || a.ends_at) : status === 'cancelled' ? (a.ends_at || a.renews_at) : (a.ends_at || null);
  const untilDate = new Date(until || Date.now());
  if (live) untilDate.setDate(untilDate.getDate() + 1); // μικρό περιθώριο για την ανανέωση

  const docName = p => 'projects/' + sa.project_id + '/databases/(default)/documents/' + p;
  const out = await api(':commit', { writes: [
    { update: { name: docName('entitlements/' + uid), fields: fields({ premiumUntil: untilDate, plan: a.variant_name || '', status, source: 'lemon' }) },
      updateMask: { fieldPaths: ['premiumUntil', 'plan', 'status', 'source'] },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }] },
    { update: { name: docName('users/' + uid), fields: fields({ lemon: {
        subscriptionId: String(body.data.id), customerId: String(a.customer_id || ''), status,
        variant: a.variant_name || '', portal: (a.urls && a.urls.customer_portal) || '',
        renewsAt: a.renews_at || '', endsAt: a.ends_at || '' } }) },
      updateMask: { fieldPaths: ['lemon'] } }
  ] });
  if (out.error) { console.error('Firestore error', JSON.stringify(out.error)); return { statusCode: 500, body: 'Firestore error' }; }
  return { statusCode: 200, body: 'OK' };
};
