// Δημόσια ανάγνωση μενού με προσωρινή αποθήκευση στο CDN του Netlify.
// Όσοι κι αν σκανάρουν, το Firebase διαβάζεται λίγες φορές την ώρα ανά μενού (3 αναγνώσεις κάθε φορά).
const crypto = require('crypto');
const GRACE_DAYS = 30;
const b64url = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

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
let tokenCache = { t: '', exp: 0 };
async function googleToken(sa) {
  if (tokenCache.t && tokenCache.exp > Date.now() + 60000) return tokenCache.t;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const jwt = head + '.' + claim + '.' + b64url(crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(sa.private_key));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt });
  const j = await r.json(); if (!j.access_token) throw new Error('token');
  tokenCache = { t: j.access_token, exp: Date.now() + 3500e3 }; return j.access_token;
}
// Μετατροπή τιμών του Firestore REST σε απλό JSON
function dec(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return decMap(v.mapValue.fields || {});
  return null;
}
function decMap(f) { const o = {}; Object.keys(f || {}).forEach(k => o[k] = dec(f[k])); return o; }

const reply = (code, obj, cdnSeconds) => ({
  statusCode: code,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=30',
    'Netlify-CDN-Cache-Control': 'public, s-maxage=' + cdnSeconds + ', stale-while-revalidate=86400, durable'
  },
  body: JSON.stringify(obj)
});

exports.handler = async (event) => {
  const id = String((event.queryStringParameters || {}).id || '').toLowerCase();
  if (!/^[a-z0-9]{5,12}$/.test(id)) return reply(404, { error: 'not found' }, 60);
  const sa = readServiceAccount();
  if (!sa) return reply(500, { error: 'config' }, 10);
  const token = await googleToken(sa);
  const base = 'https://firestore.googleapis.com/v1/projects/' + sa.project_id + '/databases/(default)/documents/';
  const get = path => fetch(base + path, { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : null).catch(() => null);

  const [mDoc, pDoc] = await Promise.all([get('menus/' + id), get('profiles/' + id)]);
  const menu = mDoc && mDoc.fields ? decMap(mDoc.fields) : null;
  const prof = pDoc && pDoc.fields ? decMap(pDoc.fields) : null;
  if (!menu || !menu.published || !prof || prof.status !== 'active') return reply(404, { error: 'not found' }, 60);

  const eDoc = await get('entitlements/' + prof.ownerUid);
  const ent = eDoc && eDoc.fields ? decMap(eDoc.fields) : null;
  const until = ent && ent.premiumUntil ? Date.parse(ent.premiumUntil) : 0;
  const premium = until + GRACE_DAYS * 864e5 > Date.now();

  return reply(200, {
    profile: { id, slug: prof.slug, name: prof.name, logo: prof.logo || '', logoPhoto: !!prof.logoPhoto, accent: prof.accent, bg: prof.bg,
      buttons: (prof.buttons || []).filter(b => b && (b.t === 'phone' || b.t === 'map')) },
    menu: { langs: premium ? (menu.langs || ['el']) : (menu.langs || ['el']).filter(l => l === 'el' || l === 'en'), note: menu.note || {}, sections: menu.sections || [] },
    premium
  }, 300);
};
