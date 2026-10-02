// Κοινός κώδικας εμφάνισης μενού: τον χρησιμοποιούν η δημόσια σελίδα (/m/…) και η προεπισκόπηση στο /admin.
import { SITE } from '/firebase-config.js';
import { hrefFor, textOn } from '/profile-render.js';

// Τα 14 αλλεργιογόνα της ΕΕ, με την καθιερωμένη αρίθμηση
export const ALLERGENS = [
  ['gluten', 'Γλουτένη', 'Gluten'], ['crustaceans', 'Οστρακοειδή', 'Crustaceans'], ['eggs', 'Αυγά', 'Eggs'],
  ['fish', 'Ψάρια', 'Fish'], ['peanuts', 'Αράπικα φιστίκια', 'Peanuts'], ['soy', 'Σόγια', 'Soy'],
  ['milk', 'Γάλα', 'Milk'], ['nuts', 'Ξηροί καρποί', 'Tree nuts'], ['celery', 'Σέλινο', 'Celery'],
  ['mustard', 'Μουστάρδα', 'Mustard'], ['sesame', 'Σουσάμι', 'Sesame'], ['sulphites', 'Θειώδη', 'Sulphites'],
  ['lupin', 'Λούπινο', 'Lupin'], ['molluscs', 'Μαλάκια', 'Molluscs']
];
export const TAGS = [
  ['vegan', 'Vegan', 'Vegan'], ['veg', 'Χορτοφαγικό', 'Vegetarian'], ['gf', 'Χωρίς γλουτένη', 'Gluten-free'],
  ['spicy', 'Πικάντικο', 'Spicy'], ['new', 'Νέο', 'New'], ['chef', 'Πρόταση σεφ', "Chef's pick"]
];
export const LANG_NAMES = { el: 'Ελληνικά', en: 'English', es: 'Español', fr: 'Français', it: 'Italiano', de: 'Deutsch' };
const UI = {
  el: { soldOut: 'Εξαντλήθηκε', allergens: 'Αλλεργιογόνα', call: 'Κλήση', map: 'Οδηγίες', profile: 'Προφίλ', made: 'Φτιάξε κι εσύ δωρεάν ψηφιακό μενού', empty: 'Το μενού ετοιμάζεται.' },
  en: { soldOut: 'Sold out', allergens: 'Allergens', call: 'Call', map: 'Directions', profile: 'Profile', made: 'Make your own free digital menu', empty: 'The menu is being prepared.' },
  es: { soldOut: 'Agotado', allergens: 'Alérgenos', call: 'Llamar', map: 'Cómo llegar', profile: 'Perfil', made: 'Crea tu propio menú digital gratis', empty: 'El menú se está preparando.' },
  fr: { soldOut: 'Épuisé', allergens: 'Allergènes', call: 'Appeler', map: 'Itinéraire', profile: 'Profil', made: 'Créez votre menu numérique gratuit', empty: 'Le menu est en cours de préparation.' },
  it: { soldOut: 'Esaurito', allergens: 'Allergeni', call: 'Chiama', map: 'Indicazioni', profile: 'Profilo', made: 'Crea anche tu il tuo menu digitale gratis', empty: 'Il menù è in preparazione.' },
  de: { soldOut: 'Ausverkauft', allergens: 'Allergene', call: 'Anrufen', map: 'Route', profile: 'Profil', made: 'Erstelle dein eigenes kostenloses digitales Menü', empty: 'Das Menü wird vorbereitet.' }
};
const LOCALES = { el: 'el-GR', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };
const tr = (o, lang) => (o && (o[lang] || o.el || o.en)) || '';
export function fmtPrice(n, lang) {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '';
  return new Intl.NumberFormat(LOCALES[lang] || 'en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}
export function pickLang(langs) {
  const L = (langs && langs.length) ? langs : ['el'];
  const want = (navigator.language || 'el').slice(0, 2).toLowerCase();
  if (L.includes(want)) return want;
  return want !== 'el' && L.includes('en') ? 'en' : L[0];
}

const CSS = `
.mn{--bg:#fff;--ac:#15161A;--on:#fff;--ink:#16171A;--mut:#6A6C72;--line:rgba(18,19,22,.1);--card:rgba(255,255,255,.8);
  background:var(--bg);color:var(--ink);font-family:'Manrope','Segoe UI',Roboto,Arial,sans-serif;line-height:1.45;-webkit-font-smoothing:antialiased;min-height:100%}
.mn *{box-sizing:border-box}
.mn-in{max-width:640px;margin:0 auto;padding:0 0 40px}
.mn-head{display:flex;align-items:center;gap:14px;padding:22px 20px 16px}
.mn-logo{width:52px;height:52px;border-radius:50%;flex:none;background:#fff center/contain no-repeat;background-origin:content-box;padding:6px;box-shadow:0 0 0 1px var(--line)}
.mn-logo.photo{background-size:cover;padding:0}
.mn-logo.empty{display:flex;align-items:center;justify-content:center;background:var(--ac);color:var(--on);font-weight:800;font-size:22px;padding:0}
.mn-title{flex:1;min-width:0}
.mn-title h1{margin:0;font-size:22px;font-weight:800;letter-spacing:-.03em;line-height:1.15;overflow-wrap:anywhere}
.mn-title small{color:var(--mut);font-size:13px}
.mn-langs{display:flex;gap:4px;flex:none}
.mn-langs button{border:1px solid var(--line);background:transparent;color:inherit;border-radius:999px;padding:6px 10px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
.mn-langs button[aria-pressed="true"]{background:var(--ac);color:var(--on);border-color:var(--ac)}
.mn-nav{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);display:flex;gap:6px;overflow-x:auto;padding:10px 20px;scrollbar-width:none}
.mn-nav::-webkit-scrollbar{display:none}
.mn-nav a{flex:none;text-decoration:none;color:var(--mut);font-weight:700;font-size:14px;padding:8px 14px;border-radius:999px;white-space:nowrap}
.mn-nav a.on{background:var(--ac);color:var(--on)}
.mn-sec{padding:26px 20px 4px;scroll-margin-top:60px}
.mn-sec h2{margin:0 0 6px;font-size:21px;font-weight:800;letter-spacing:-.03em}
.mn-item{display:flex;gap:16px;padding:14px 0;border-bottom:1px solid var(--line)}
.mn-item:last-child{border-bottom:0}
.mn-item .t{flex:1;min-width:0}
.mn-item h3{margin:0;font-size:16px;font-weight:700;letter-spacing:-.01em;overflow-wrap:anywhere}
.mn-item p{margin:3px 0 0;color:var(--mut);font-size:14px;white-space:pre-line;overflow-wrap:anywhere}
.mn-item .pr{flex:none;text-align:right;font-weight:800;font-size:15.5px;white-space:nowrap}
.mn-item .pr div + div{margin-top:3px}
.mn-item .pr small{display:block;font-weight:500;font-size:12px;color:var(--mut)}
.mn-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
.mn-al{min-width:20px;height:20px;padding:0 5px;border-radius:999px;border:1px solid var(--line);font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;color:var(--mut)}
.mn-tag{font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--tint);color:var(--ac)}
.mn-item.out{opacity:.45}
.mn-out{font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:#F7E6DE;color:#8A3417}
.mn-note{margin:22px 20px 0;color:var(--mut);font-size:13px;white-space:pre-line}
.mn-legend{margin:18px 20px 0;padding:14px 16px;border-radius:14px;border:1px solid var(--line);font-size:12.5px;color:var(--mut)}
.mn-legend b{display:block;color:var(--ink);font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
.mn-legend span{display:inline-flex;align-items:center;gap:5px;margin:0 12px 6px 0}
.mn-acts{display:flex;gap:8px;flex-wrap:wrap;padding:24px 20px 0}
.mn-acts a{flex:1;min-width:120px;text-align:center;text-decoration:none;color:inherit;font-weight:700;font-size:14px;padding:12px;border-radius:14px;border:1px solid var(--line)}
.mn-acts a.main{background:var(--ac);color:var(--on);border-color:var(--ac)}
.mn-foot{text-align:center;padding:26px 20px 0;font-size:12.5px}
.mn-foot a{color:var(--mut);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:7px 14px;display:inline-block}
.mn-empty{padding:40px 20px;text-align:center;color:var(--mut)}
`;
function css() { if (!document.getElementById('mn-css')) { const s = document.createElement('style'); s.id = 'mn-css'; s.textContent = CSS; document.head.appendChild(s); } }
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
function lum(hex) {
  const n = parseInt(String(hex || '#ffffff').slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/* data: { profile:{id,name,logo,logoPhoto,accent,bg,buttons}, menu:{langs,note,sections:[{id,title,items:[…]}]}, premium }
   opts: { lang, preview, onLang(lang) } */
export function renderMenu(root, data, opts = {}) {
  css();
  const p = data.profile || {}, m = data.menu || {}, langs = (m.langs && m.langs.length) ? m.langs : ['el'];
  const lang = langs.includes(opts.lang) ? opts.lang : langs[0], U = UI[lang] || UI.el;
  const bg = p.bg || '#FFFFFF', ac = p.accent || '#15161A', dark = lum(bg) < 0.25;
  root.innerHTML = '';
  const w = el('div', 'mn');
  w.style.setProperty('--bg', bg); w.style.setProperty('--ac', ac); w.style.setProperty('--on', textOn(ac));
  w.style.setProperty('--ink', dark ? '#F4F3EE' : '#16171A'); w.style.setProperty('--mut', dark ? '#C9CABF' : '#6A6C72');
  w.style.setProperty('--line', dark ? 'rgba(255,255,255,.14)' : 'rgba(18,19,22,.1)'); w.style.setProperty('--tint', ac + (dark ? '33' : '1A'));
  const inner = el('div', 'mn-in');

  const head = el('div', 'mn-head');
  const lg = el('div', 'mn-logo');
  if (p.logo) { lg.style.backgroundImage = 'url("' + p.logo + '")'; if (p.logoPhoto) lg.classList.add('photo'); }
  else { lg.classList.add('empty'); lg.textContent = (p.name || '·').trim().charAt(0).toUpperCase(); }
  const tt = el('div', 'mn-title'); tt.append(el('h1', '', p.name || ''));
  head.append(lg, tt);
  if (langs.length > 1) {
    const ls = el('div', 'mn-langs');
    langs.forEach(l => { const b = el('button', '', l.toUpperCase()); b.type = 'button'; b.setAttribute('aria-pressed', String(l === lang)); b.title = LANG_NAMES[l] || l;
      b.onclick = () => { if (opts.onLang) opts.onLang(l); else renderMenu(root, data, { ...opts, lang: l }); }; ls.append(b); });
    head.append(ls);
  }
  inner.append(head);

  const secs = (m.sections || []).filter(s => (s.items || []).some(i => !i.hidden && tr(i.name, lang)));
  if (!secs.length) { inner.append(el('div', 'mn-empty', U.empty)); w.append(inner); root.append(w); return; }

  const nav = el('nav', 'mn-nav');
  secs.forEach((s, k) => { const a = el('a', k === 0 ? 'on' : '', tr(s.title, lang) || '—'); a.href = '#s-' + s.id; a.dataset.s = s.id;
    a.onclick = e => { e.preventDefault(); const t = root.querySelector('#s-' + CSS.escape(s.id)); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    nav.append(a); });
  inner.append(nav);

  const used = new Set();
  secs.forEach(s => {
    const sec = el('section', 'mn-sec'); sec.id = 's-' + s.id;
    sec.append(el('h2', '', tr(s.title, lang)));
    (s.items || []).filter(i => !i.hidden && tr(i.name, lang)).forEach(i => {
      const it = el('div', 'mn-item' + (i.soldOut ? ' out' : ''));
      const t = el('div', 't'); t.append(el('h3', '', tr(i.name, lang)));
      if (tr(i.desc, lang)) t.append(el('p', '', tr(i.desc, lang)));
      const meta = el('div', 'mn-meta');
      if (i.soldOut) meta.append(el('span', 'mn-out', U.soldOut));
      (i.tags || []).forEach(g => { const d = TAGS.find(x => x[0] === g); if (d) meta.append(el('span', 'mn-tag', lang === 'el' ? d[1] : d[2])); });
      (i.allergens || []).forEach(a => { const k = ALLERGENS.findIndex(x => x[0] === a); if (k > -1) { used.add(k); const b = el('span', 'mn-al', String(k + 1)); b.title = ALLERGENS[k][lang === 'el' ? 1 : 2]; meta.append(b); } });
      if (meta.childNodes.length) t.append(meta);
      const pr = el('div', 'pr');
      (i.prices || []).filter(x => x.p !== null && x.p !== '' && !isNaN(x.p)).forEach(x => {
        const d = el('div', '', fmtPrice(Number(x.p), lang)); const lb = tr(x.l, lang); if (lb) d.append(el('small', '', lb)); pr.append(d); });
      it.append(t, pr); sec.append(it);
    });
    inner.append(sec);
  });

  if (tr(m.note, lang)) inner.append(el('p', 'mn-note', tr(m.note, lang)));
  if (used.size) {
    const lgd = el('div', 'mn-legend'); lgd.append(el('b', '', U.allergens));
    [...used].sort((a, b) => a - b).forEach(k => { const s = el('span'); s.append(el('span', 'mn-al', String(k + 1)), document.createTextNode(ALLERGENS[k][lang === 'el' ? 1 : 2])); lgd.append(s); });
    inner.append(lgd);
  }

  const acts = el('div', 'mn-acts');
  const btn = t => (p.buttons || []).find(b => b.t === t && hrefFor(b));
  const tel = btn('phone'), map = btn('map');
  if (tel) { const a = el('a', 'main', U.call); a.href = hrefFor(tel); acts.append(a); }
  if (map) { const a = el('a', '', U.map); a.href = hrefFor(map); a.target = '_blank'; a.rel = 'noopener'; acts.append(a); }
  if (p.id) { const a = el('a', '', U.profile); a.href = SITE + '/p/' + p.id; acts.append(a); }
  if (acts.childNodes.length) inner.append(acts);
  if (!data.premium) { const f = el('div', 'mn-foot'); const a = el('a', '', U.made); a.href = SITE + '/admin'; f.append(a); inner.append(f); }

  w.append(inner); root.append(w);

  // Ενεργή κατηγορία στη μπάρα καθώς κάνεις scroll
  if (!opts.preview && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      nav.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.dataset.s === e.target.id.slice(2)));
      const on = nav.querySelector('a.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    }), { rootMargin: '-40% 0px -55% 0px' });
    inner.querySelectorAll('.mn-sec').forEach(s => io.observe(s));
  }
}
