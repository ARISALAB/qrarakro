// Κοινός κώδικας εμφάνισης προφίλ: τον χρησιμοποιούν η δημόσια σελίδα και η προεπισκόπηση του επεξεργαστή.
import { SITE, BRAND } from './firebase-config.js';

export const LABELS = {
  el: {
    saveContact: 'Αποθήκευση επαφής', share: 'Κοινοποίηση', copied: 'Ο σύνδεσμος αντιγράφηκε',
    hours: 'Ωράριο', address: 'Διεύθυνση', makeYours: 'Φτιάξε κι εσύ δωρεάν προφίλ',
    report: 'Αναφορά', reportPrompt: 'Τι δεν πάει καλά με αυτό το προφίλ;', reported: 'Ευχαριστούμε, θα το ελέγξουμε.',
    b_phone: 'Κάλεσέ μας', b_whatsapp: 'WhatsApp', b_email: 'Email', b_link: 'Ιστοσελίδα',
    b_booking: 'Κάνε κράτηση', b_map: 'Οδηγίες', b_review: 'Άφησε κριτική', b_menu: 'Δες το μενού'
  },
  en: {
    saveContact: 'Save contact', share: 'Share', copied: 'Link copied',
    hours: 'Opening hours', address: 'Address', makeYours: 'Make your own free profile',
    report: 'Report', reportPrompt: 'What is wrong with this profile?', reported: 'Thank you, we will look into it.',
    b_phone: 'Call us', b_whatsapp: 'WhatsApp', b_email: 'Email', b_link: 'Website',
    b_booking: 'Book a table', b_map: 'Directions', b_review: 'Leave a review', b_menu: 'See the menu'
  }
};
export const visitorLang = () => ((navigator.language || 'el').toLowerCase().startsWith('el') ? 'el' : 'en');

const ICON = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>',
  email: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>',
  link: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  booking: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
  map: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  review: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  menu: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  contact: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  chevron: '<path d="M9 18l6-6-6-6"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  tiktok: '<path d="M9 12a4 4 0 1 0 4 4V2c.5 2.5 2.5 4.5 5 5"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>',
  linkedin: '<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M7 7h.01M11 17v-4a2 2 0 0 1 4 0v4M11 10v7"/>',
  x: '<path d="M4 4l16 16M20 4L4 20"/>'
};
const svg = (name, cls = '') => '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || '') + '</svg>';

export const BUTTON_TYPES = ['phone', 'whatsapp', 'email', 'link', 'booking', 'menu', 'map', 'review'];
export const SOCIALS = {
  instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', tiktok: 'https://tiktok.com/@',
  youtube: 'https://youtube.com/@', linkedin: 'https://linkedin.com/in/', x: 'https://x.com/'
};

const trim = v => String(v || '').trim();
const digits = v => String(v || '').replace(/\D/g, '');
export function intlNumber(v) {
  const raw = trim(v); let d = digits(raw);
  if (raw.startsWith('00')) d = d.slice(2);
  else if (!raw.startsWith('+') && d.length === 10 && /^(2|69)/.test(d)) d = '30' + d;
  return d;
}
function safeUrl(v) {
  v = trim(v); if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  try {
    const u = new URL(v);
    const okHost = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(u.hostname) || /^xn--/i.test(u.hostname);
    return (u.protocol === 'https:' || u.protocol === 'http:') && okHost ? u.href : '';
  } catch (e) { return ''; }
}
export function hrefFor(b) {
  const v = trim(b.v);
  if (!v) return '';
  switch (b.t) {
    case 'phone': { const d = intlNumber(v); return d ? 'tel:+' + d : ''; }
    case 'whatsapp': { const d = intlNumber(v); return d ? 'https://wa.me/' + d : ''; }
    case 'email': return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? 'mailto:' + v : '';
    case 'map': return /^https?:\/\//i.test(v) ? safeUrl(v) : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v);
    default: return safeUrl(v);
  }
}
export function socialUrl(key, v) {
  v = trim(v); if (!v) return '';
  if (/^https?:\/\//i.test(v)) return safeUrl(v);
  return SOCIALS[key] ? SOCIALS[key] + encodeURIComponent(v.replace(/^@/, '')) : '';
}
export const profileUrl = p => SITE + '/p/' + p.id;
export const prettyUrl = p => SITE + '/' + p.slug;

function lum(hex) {
  const n = parseInt(String(hex || '#ffffff').slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export const textOn = hex => (lum(hex) > 0.42 ? '#1D1F18' : '#FFFFFF');

function vcEsc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
export function vcardFor(p) {
  const btn = t => (p.buttons || []).find(b => b.t === t && trim(b.v));
  const L = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vcEsc(p.name), 'ORG:' + vcEsc(p.name)];
  const tel = btn('phone') || btn('whatsapp');
  if (tel) L.push('TEL;TYPE=WORK:+' + intlNumber(tel.v));
  const mail = btn('email'); if (mail) L.push('EMAIL:' + trim(mail.v));
  const web = btn('link'); if (web) L.push('URL:' + hrefFor(web));
  L.push('URL:' + profileUrl(p));
  if (trim(p.address)) L.push('ADR;TYPE=WORK:;;' + vcEsc(p.address) + ';;;;');
  if (trim(p.bio)) L.push('NOTE:' + vcEsc(p.bio));
  L.push('END:VCARD');
  return L.join('\r\n');
}

const CSS = `
.pf{--pf-bg:#fff;--pf-accent:#4B5A2E;--pf-on:#fff;--pf-ink:#1D1F18;--pf-muted:#5E6157;--pf-line:rgba(0,0,0,.1);
  background:var(--pf-bg);color:var(--pf-ink);font-family:'Commissioner','Segoe UI',Roboto,Arial,sans-serif;line-height:1.5;
  min-height:100%;display:flex;flex-direction:column;align-items:center}
.pf *{box-sizing:border-box}
.pf-inner{width:100%;max-width:480px;padding:0 0 28px}
.pf-cover{height:170px;background:var(--pf-accent) center/cover no-repeat}
.pf-head{padding:0 22px;text-align:center;margin-top:-52px}
.pf-logo{width:104px;height:104px;margin:0 auto;border-radius:50%;background:#fff center/contain no-repeat;border:4px solid var(--pf-bg);box-shadow:0 6px 18px -8px rgba(0,0,0,.35);background-origin:content-box;padding:10px}
.pf-logo.photo{background-size:cover;padding:0}
.pf-logo.empty{display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;color:var(--pf-on);background:var(--pf-accent)}
.pf-name{margin:14px 0 0;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-.015em;overflow-wrap:anywhere}
.pf-bio{margin:8px auto 0;max-width:36ch;color:var(--pf-muted);font-size:15.5px;white-space:pre-line;overflow-wrap:anywhere}
.pf-main{display:grid;gap:10px;padding:22px 22px 0}
.pf-main.two{grid-template-columns:1fr 1fr}
.pf-big{display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:12px 14px;border-radius:14px;background:var(--pf-accent);color:var(--pf-on);text-decoration:none;font-weight:700;font-size:16px;text-align:center;line-height:1.2}
.pf-big svg,.pf-row svg,.pf-soc svg,.pf-act svg{fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pf-big svg{width:20px;height:20px;flex:none}
.pf-list{padding:14px 22px 0;display:grid;gap:8px}
.pf-row{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--pf-line);border-radius:14px;color:inherit;text-decoration:none;font-weight:600;font-size:15.5px;background:rgba(255,255,255,.55)}
.pf-row .i{width:22px;height:22px;flex:none;color:var(--pf-accent)}
.pf-row .c{width:18px;height:18px;margin-left:auto;flex:none;opacity:.45}
.pf-row span{overflow-wrap:anywhere}
.pf-socials{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;padding:20px 22px 0}
.pf-soc{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--pf-line);color:inherit}
.pf-soc svg{width:21px;height:21px}
.pf-info{margin:22px 22px 0;padding:16px 18px;border-radius:14px;background:rgba(0,0,0,.035);font-size:15px}
.pf-info h2{margin:0 0 4px;font-size:13px;font-weight:700;color:var(--pf-muted)}
.pf-info p{margin:0;white-space:pre-line;overflow-wrap:anywhere}
.pf-info p + h2{margin-top:14px}
.pf-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:22px 22px 0}
.pf-act{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:12px;border:1px solid var(--pf-line);background:transparent;color:inherit;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer}
.pf-act svg{width:18px;height:18px}
.pf-foot{padding:30px 22px 0;text-align:center;font-size:13px;color:var(--pf-muted)}
.pf-foot a{color:inherit}
.pf-foot button{background:none;border:0;padding:0;margin-top:8px;font:inherit;font-size:12px;color:inherit;opacity:.7;text-decoration:underline;cursor:pointer}
.pf-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1D1F18;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;z-index:50}
`;
function injectCss() {
  if (document.getElementById('pf-css')) return;
  const s = document.createElement('style'); s.id = 'pf-css'; s.textContent = CSS; document.head.appendChild(s);
}
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function toast(msg) {
  const t = el('div', 'pf-toast', msg); document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

/* p: { id, slug, name, bio, logo, cover, accent, bg, buttons:[{t,v,l,main}], socials:{}, address, hours }
   opts: { lang, preview, onReport(reason) } */
export function renderProfile(root, p, opts = {}) {
  injectCss();
  const L = LABELS[opts.lang || visitorLang()];
  root.innerHTML = '';
  const wrap = el('div', 'pf');
  const bg = p.bg || '#FFFFFF', accent = p.accent || '#4B5A2E';
  wrap.style.setProperty('--pf-bg', bg);
  wrap.style.setProperty('--pf-accent', accent);
  wrap.style.setProperty('--pf-on', textOn(accent));
  const dark = lum(bg) < 0.25;
  wrap.style.setProperty('--pf-ink', dark ? '#F4F3EE' : '#1D1F18');
  wrap.style.setProperty('--pf-muted', dark ? '#C9CABF' : '#5E6157');
  wrap.style.setProperty('--pf-line', dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.1)');
  const inner = el('div', 'pf-inner');

  const cover = el('div', 'pf-cover');
  if (p.cover) cover.style.backgroundImage = 'url("' + p.cover + '")';
  inner.appendChild(cover);

  const head = el('div', 'pf-head');
  const logo = el('div', 'pf-logo');
  if (p.logo) { logo.style.backgroundImage = 'url("' + p.logo + '")'; if (p.logoPhoto) logo.classList.add('photo'); }
  else { logo.classList.add('empty'); logo.textContent = trim(p.name).charAt(0).toUpperCase() || '·'; }
  head.appendChild(logo);
  head.appendChild(el('h1', 'pf-name', trim(p.name) || ' '));
  if (trim(p.bio)) head.appendChild(el('p', 'pf-bio', trim(p.bio)));
  inner.appendChild(head);

  const buttons = (p.buttons || []).filter(b => hrefFor(b));
  const main = buttons.filter(b => b.main).slice(0, 2);
  const rest = buttons.filter(b => !main.includes(b));
  const makeLink = (b, cls) => {
    const a = el('a', cls);
    a.href = hrefFor(b);
    if (/^https?:/.test(a.href)) { a.target = '_blank'; a.rel = 'noopener'; }
    const label = trim(b.l) || L['b_' + b.t];
    if (cls === 'pf-big') { a.innerHTML = svg(b.t); a.appendChild(el('span', '', label)); }
    else { a.innerHTML = svg(b.t, 'i'); a.appendChild(el('span', '', label)); a.insertAdjacentHTML('beforeend', svg('chevron', 'c')); }
    return a;
  };
  if (main.length) {
    const box = el('div', 'pf-main' + (main.length === 2 ? ' two' : ''));
    main.forEach(b => box.appendChild(makeLink(b, 'pf-big')));
    inner.appendChild(box);
  }
  if (rest.length) {
    const list = el('div', 'pf-list');
    rest.forEach(b => list.appendChild(makeLink(b, 'pf-row')));
    inner.appendChild(list);
  }

  const socials = Object.keys(SOCIALS).map(k => [k, socialUrl(k, (p.socials || {})[k])]).filter(x => x[1]);
  if (socials.length) {
    const s = el('div', 'pf-socials');
    socials.forEach(([k, url]) => {
      const a = el('a', 'pf-soc'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', k);
      a.innerHTML = svg(k); s.appendChild(a);
    });
    inner.appendChild(s);
  }

  if (trim(p.address) || trim(p.hours)) {
    const info = el('div', 'pf-info');
    if (trim(p.address)) { info.appendChild(el('h2', '', L.address)); info.appendChild(el('p', '', trim(p.address))); }
    if (trim(p.hours)) { info.appendChild(el('h2', '', L.hours)); info.appendChild(el('p', '', trim(p.hours))); }
    inner.appendChild(info);
  }

  const acts = el('div', 'pf-acts');
  const save = el('button', 'pf-act'); save.type = 'button'; save.innerHTML = svg('contact'); save.appendChild(el('span', '', L.saveContact));
  const share = el('button', 'pf-act'); share.type = 'button'; share.innerHTML = svg('share'); share.appendChild(el('span', '', L.share));
  save.addEventListener('click', () => {
    if (opts.preview) return;
    const blob = new Blob([vcardFor(p)], { type: 'text/vcard;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (trim(p.slug) || 'contact') + '.vcf'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  share.addEventListener('click', async () => {
    if (opts.preview) return;
    const url = prettyUrl(p);
    if (navigator.share) { try { await navigator.share({ title: p.name, url }); } catch (e) {} return; }
    try { await navigator.clipboard.writeText(url); toast(L.copied); } catch (e) { prompt('', url); }
  });
  acts.appendChild(save); acts.appendChild(share);
  inner.appendChild(acts);

  const foot = el('div', 'pf-foot');
  const make = el('a', '', L.makeYours); make.href = SITE + '/admin';
  foot.appendChild(make);
  foot.appendChild(el('br'));
  const rep = el('button', '', L.report); rep.type = 'button';
  rep.addEventListener('click', async () => {
    if (opts.preview || !opts.onReport) return;
    const reason = prompt(L.reportPrompt);
    if (reason && reason.trim()) { try { await opts.onReport(reason.trim().slice(0, 500)); } catch (e) {} toast(L.reported); }
  });
  foot.appendChild(rep);
  inner.appendChild(foot);

  wrap.appendChild(inner);
  root.appendChild(wrap);
}
export { BRAND };
