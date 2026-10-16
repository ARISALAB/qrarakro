// Μηχανισμός «μπλοκ» για τις σελίδες των δυναμικών QR (Ξενοδοχείο, Ακίνητο, Προϊόν, Κατάστημα, Εκδήλωση, Καμπάνια, Προσαρμοσμένο).
// Κάθε κατηγορία είναι απλώς μια λίστα μπλοκ. Ο ίδιος κώδικας χτίζει τη φόρμα στο admin και τη δημόσια σελίδα στο q.html.
import { hrefFor } from './profile-render.js';

// Τύποι κουμπιών που επιτρέπονται στα μπλοκ
export const BTN_TYPES = { link: 'Σύνδεσμος', booking: 'Κράτηση', phone: 'Τηλέφωνο', whatsapp: 'WhatsApp', email: 'Email', map: 'Χάρτης / διεύθυνση' };

// Ρυθμίσεις ανά κατηγορία: ποια μπλοκ έχει, με ποιους τίτλους και ποια έτοιμα πεδία
export const BLOCK_SETS = {
  hotel: [
    { type: 'cover', ph: 'π.χ. Καλώς ήρθατε στο Villa Plaka' },
    { type: 'text', title: 'Καλωσόρισμα', ph: 'Λίγα λόγια για τη διαμονή σας…' },
    { type: 'info', title: 'Χρήσιμες πληροφορίες', rows: ['Wi-Fi δίκτυο', 'Κωδικός Wi-Fi', 'Πρωινό', 'Check-out'] },
    { type: 'chips', title: 'Παροχές', ph: 'Wi-Fi, Πισίνα, Parking, Κλιματισμός' },
    { type: 'gallery', title: 'Φωτογραφίες' },
    { type: 'buttons', title: 'Κουμπιά', items: [['booking', 'Κάνε κράτηση'], ['phone', 'Ρεσεψιόν'], ['map', 'Πώς θα έρθετε']] }
  ],
  realestate: [
    { type: 'cover', ph: 'π.χ. Διαμέρισμα 85 τ.μ. στο Παγκράτι' },
    { type: 'price', ph: 'π.χ. 185.000 €', note: 'π.χ. Συζητήσιμη' },
    { type: 'chips', title: 'Με μια ματιά', ph: '85 τ.μ., 2 υπνοδωμάτια, 3ος όροφος, Ανακαινισμένο' },
    { type: 'gallery', title: 'Φωτογραφίες' },
    { type: 'text', title: 'Περιγραφή', ph: 'Περιγραφή του ακινήτου…' },
    { type: 'info', title: 'Στοιχεία', rows: ['Εμβαδόν', 'Υπνοδωμάτια', 'Όροφος', 'Έτος κατασκευής', 'Ενεργειακή κλάση', 'Θέρμανση'] },
    { type: 'buttons', title: 'Κουμπιά', items: [['phone', 'Κάλεσε τον μεσίτη'], ['whatsapp', 'WhatsApp'], ['map', 'Τοποθεσία']] }
  ],
  product: [
    { type: 'cover', ph: 'π.χ. Ελαιόλαδο Extra Virgin 500ml' },
    { type: 'price', ph: 'π.χ. 9,90 €', note: 'π.χ. Τιμή καταστήματος' },
    { type: 'text', title: 'Για το προϊόν', ph: 'Περιγραφή, προέλευση, ιστορία…' },
    { type: 'chips', title: 'Χαρακτηριστικά', ph: 'Βιολογικό, Χωρίς γλουτένη, Χειροποίητο' },
    { type: 'info', title: 'Πληροφορίες', rows: ['Συστατικά', 'Οδηγίες χρήσης', 'Διατήρηση', 'Προέλευση'] },
    { type: 'gallery', title: 'Φωτογραφίες' },
    { type: 'buttons', title: 'Κουμπιά', items: [['link', 'Αγόρασε online'], ['email', 'Επικοινωνία']] }
  ],
  store: [
    { type: 'cover', ph: 'π.χ. Βιβλιοπωλείο Πλάκας' },
    { type: 'text', title: 'Για εμάς', ph: 'Τι θα βρείτε στο κατάστημα…' },
    { type: 'info', title: 'Ωράριο', rows: ['Δευτέρα – Παρασκευή', 'Σάββατο', 'Κυριακή'] },
    { type: 'chips', title: 'Θα βρείτε', ph: 'Βιβλία, Δώρα, Χαρτικά' },
    { type: 'coupon', title: 'Προσφορά για εσάς', ph: 'π.χ. -10% με τον κωδικό' },
    { type: 'gallery', title: 'Φωτογραφίες' },
    { type: 'buttons', title: 'Κουμπιά', items: [['phone', 'Κάλεσέ μας'], ['map', 'Πώς θα έρθετε'], ['link', 'E-shop']] }
  ],
  events: [
    { type: 'cover', ph: 'π.χ. Live Jazz Night' },
    { type: 'countdown', title: 'Ξεκινάει σε', ph: 'Ημερομηνία και ώρα έναρξης' },
    { type: 'text', title: 'Για την εκδήλωση', ph: 'Τι θα δείτε, ποιοι συμμετέχουν…' },
    { type: 'info', title: 'Πρόγραμμα', rows: ['20:30', '21:00', '23:00'] },
    { type: 'gallery', title: 'Φωτογραφίες' },
    { type: 'buttons', title: 'Κουμπιά', items: [['link', 'Εισιτήρια'], ['map', 'Πώς θα έρθετε']] }
  ],
  campaign: [
    { type: 'cover', ph: 'π.χ. Black Friday -30%' },
    { type: 'text', title: 'Η προσφορά', ph: 'Τι κερδίζει όποιος σκανάρει…' },
    { type: 'coupon', title: 'Ο κωδικός σου', ph: 'π.χ. Δείξε τον κωδικό στο ταμείο' },
    { type: 'countdown', title: 'Λήγει σε', ph: 'Πότε λήγει η καμπάνια' },
    { type: 'gallery', title: 'Φωτογραφίες' },
    { type: 'buttons', title: 'Κουμπιά', items: [['link', 'Δες περισσότερα']] }
  ],
  custom: [
    { type: 'cover', ph: 'Τίτλος σελίδας' },
    { type: 'text', title: 'Κείμενο', ph: 'Ό,τι θέλεις να γράψεις…' },
    { type: 'price', ph: 'π.χ. 25 €', note: 'Σημείωση τιμής' },
    { type: 'chips', title: 'Ετικέτες', ph: 'Λέξεις χωρισμένες με κόμμα' },
    { type: 'info', title: 'Πληροφορίες', rows: ['', '', ''] },
    { type: 'coupon', title: 'Κωδικός', ph: 'Σημείωση κωδικού' },
    { type: 'countdown', title: 'Αντίστροφη μέτρηση', ph: 'Ημερομηνία' },
    { type: 'gallery', title: 'Φωτογραφίες' },
    { type: 'buttons', title: 'Κουμπιά', items: [['link', '']] }
  ]
};
export const isBlockType = t => Object.prototype.hasOwnProperty.call(BLOCK_SETS, t);

// Κενά μπλοκ με τα έτοιμα πεδία κάθε κατηγορίας
export function emptyBlocks(t) {
  return (BLOCK_SETS[t] || []).map(d => {
    const b = { type: d.type, title: d.title || '' };
    if (d.type === 'cover') Object.assign(b, { head: '', sub: '', img: '' });
    if (d.type === 'text') b.text = '';
    if (d.type === 'price') Object.assign(b, { amount: '', note: '' });
    if (d.type === 'chips') b.items = [];
    if (d.type === 'info') b.rows = (d.rows || []).map(k => ({ k, v: '' }));
    if (d.type === 'gallery') b.imgs = [];
    if (d.type === 'coupon') Object.assign(b, { code: '', note: '' });
    if (d.type === 'countdown') b.at = '';
    if (d.type === 'buttons') b.items = (d.items || []).map(([t, l]) => ({ t, v: '', l }));
    return b;
  });
}
// Συνδυάζει αποθηκευμένα μπλοκ με τη ρύθμιση της κατηγορίας (αν αλλάξει η κατηγορία ή προστεθεί μπλοκ)
export function mergeBlocks(t, saved) {
  const base = emptyBlocks(t), used = new Set();
  return base.map(b => {
    const i = (saved || []).findIndex((s, j) => !used.has(j) && s && s.type === b.type);
    if (i < 0) return b;
    used.add(i);
    return { ...b, ...saved[i] };
  });
}
// Καθαρίζει τα δεδομένα πριν την αποθήκευση: κόβει μεγέθη, πετάει κενά
export function cleanBlocks(blocks) {
  const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  return (blocks || []).slice(0, 12).map(b => {
    const o = { type: b.type, title: s(b.title, 60) };
    if (b.type === 'cover') Object.assign(o, { head: s(b.head, 80), sub: s(b.sub, 160), img: s(b.img, 400) });
    if (b.type === 'text') o.text = s(b.text, 2000);
    if (b.type === 'price') Object.assign(o, { amount: s(b.amount, 40), note: s(b.note, 80) });
    if (b.type === 'chips') o.items = (b.items || []).map(x => s(x, 40)).filter(Boolean).slice(0, 20);
    if (b.type === 'info') o.rows = (b.rows || []).map(r => ({ k: s(r.k, 40), v: s(r.v, 200) })).filter(r => r.k || r.v).slice(0, 15);
    if (b.type === 'gallery') o.imgs = (b.imgs || []).map(x => s(x, 400)).filter(Boolean).slice(0, 10);
    if (b.type === 'coupon') Object.assign(o, { code: s(b.code, 30), note: s(b.note, 120) });
    if (b.type === 'countdown') o.at = s(b.at, 20);
    if (b.type === 'buttons') o.items = (b.items || []).map(x => ({ t: BTN_TYPES[x.t] ? x.t : 'link', v: s(x.v, 300), l: s(x.l, 40) })).filter(x => x.v).slice(0, 6);
    return o;
  });
}

/* ---------- Δημόσια σελίδα ---------- */
const CSS = `
.bk{max-width:520px;margin:0 auto;padding:0 0 40px;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#121316;background:#F7F4EE;min-height:100vh}
.bk *{box-sizing:border-box}
.bk-cover{position:relative;min-height:220px;display:flex;align-items:flex-end;padding:28px 22px;background:linear-gradient(160deg,#1A1B1F,#0E0F11);color:#F7F4EE;background-size:cover;background-position:center}
.bk-cover.img::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,15,17,.05) 30%,rgba(14,15,17,.85))}
.bk-cover div{position:relative}
.bk-cover h1{margin:0;font-size:28px;line-height:1.15;letter-spacing:-.02em;font-weight:800}
.bk-cover p{margin:8px 0 0;font-size:15px;color:rgba(247,244,238,.85);white-space:pre-line}
.bk-cover i{display:block;width:44px;height:3px;border-radius:2px;background:#C9A46A;margin-bottom:14px}
.bk-sec{margin:16px 16px 0;padding:20px;border-radius:20px;background:#fff;border:1px solid #E7E2D8}
.bk-sec h2{margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9A7A45}
.bk-text{margin:0;font-size:15.5px;line-height:1.6;white-space:pre-line;overflow-wrap:anywhere}
.bk-price{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
.bk-price b{font-size:30px;font-weight:800;letter-spacing:-.02em;color:#121316}
.bk-price span{color:#6B6C72;font-size:14px}
.bk-chips{display:flex;flex-wrap:wrap;gap:8px}
.bk-chips span{padding:8px 13px;border-radius:999px;background:#F7F4EE;border:1px solid #E7E2D8;font-size:14px;font-weight:600}
.bk-rows div{display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-top:1px solid #EFEAE0;font-size:15px}
.bk-rows div:first-child{border-top:0;padding-top:0}
.bk-rows span{color:#6B6C72;flex:none;max-width:45%}
.bk-rows b{text-align:right;font-weight:700;overflow-wrap:anywhere;white-space:pre-line}
.bk-gal{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -20px;padding:0 20px;scrollbar-width:none}
.bk-gal::-webkit-scrollbar{display:none}
.bk-gal img{flex:0 0 82%;height:230px;object-fit:cover;border-radius:14px;scroll-snap-align:center}
.bk-gal img:only-child{flex-basis:100%}
.bk-coupon{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:2px dashed #C9A46A;border-radius:14px;background:#FBF6EC}
.bk-coupon b{font-size:22px;letter-spacing:.08em;font-weight:800}
.bk-coupon button,.bk-btn{font:inherit;cursor:pointer}
.bk-coupon button{border:0;border-radius:10px;padding:10px 14px;background:#121316;color:#F7F4EE;font-weight:700;font-size:14px}
.bk-note{margin:10px 0 0;color:#6B6C72;font-size:14px}
.bk-cd{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center}
.bk-cd div{padding:12px 4px;border-radius:12px;background:#121316;color:#F7F4EE}
.bk-cd b{display:block;font-size:24px;font-weight:800;color:#D8B983}
.bk-cd small{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.8}
.bk-when{margin:10px 0 0;font-size:14px;color:#6B6C72;text-align:center}
.bk-btns{display:grid;gap:10px;margin:16px 16px 0}
.bk-btn{display:flex;align-items:center;justify-content:center;min-height:52px;padding:10px 16px;border-radius:14px;border:1px solid #E7E2D8;background:#fff;color:#121316;text-decoration:none;font-weight:700;font-size:15.5px}
.bk-btn.main{background:linear-gradient(180deg,#D8B983,#C9A46A);border-color:#C9A46A;color:#121316}
.bk-foot{margin-top:28px;text-align:center;font-size:12px;color:#999}
.bk-foot a{color:inherit}
`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeImg = u => /^https:\/\//i.test(u || '') ? u : '';
const TXT = {
  el: { d: 'Μέρες', h: 'Ώρες', m: 'Λεπτά', s: 'Δευτ.', ended: 'Έληξε', copy: 'Αντιγραφή', copied: 'Αντιγράφηκε', empty: 'Η σελίδα ετοιμάζεται.' },
  en: { d: 'Days', h: 'Hours', m: 'Min', s: 'Sec', ended: 'Ended', copy: 'Copy', copied: 'Copied', empty: 'This page is being prepared.' }
};

export function renderBlocks(root, data, opts = {}) {
  if (!document.getElementById('bk-css')) { const st = document.createElement('style'); st.id = 'bk-css'; st.textContent = CSS; document.head.appendChild(st); }
  const L = TXT[opts.lang === 'en' ? 'en' : 'el'];
  const blocks = cleanBlocks(data.blocks);
  let html = '', btns = '', firstBtn = true, timers = [];
  for (const b of blocks) {
    const h2 = b.title ? '<h2>' + esc(b.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')) + '</h2>' : '';
    if (b.type === 'cover') {
      const img = safeImg(b.img), head = b.head || data.title || '';
      if (!head && !b.sub && !img) continue;
      html += '<header class="bk-cover' + (img ? ' img' : '') + '"' + (img ? ' style="background-image:url(\'' + esc(img) + '\')"' : '') + '><div><i></i>' +
        (head ? '<h1>' + esc(head) + '</h1>' : '') + (b.sub ? '<p>' + esc(b.sub) + '</p>' : '') + '</div></header>';
    }
    if (b.type === 'text' && b.text) html += '<section class="bk-sec">' + h2 + '<p class="bk-text">' + esc(b.text) + '</p></section>';
    if (b.type === 'price' && b.amount) html += '<section class="bk-sec bk-price"><b>' + esc(b.amount) + '</b>' + (b.note ? '<span>' + esc(b.note) + '</span>' : '') + '</section>';
    if (b.type === 'chips' && b.items.length) html += '<section class="bk-sec">' + h2 + '<div class="bk-chips">' + b.items.map(x => '<span>' + esc(x) + '</span>').join('') + '</div></section>';
    if (b.type === 'info' && b.rows.some(r => r.v)) html += '<section class="bk-sec">' + h2 + '<div class="bk-rows">' + b.rows.filter(r => r.v).map(r => '<div><span>' + esc(r.k) + '</span><b>' + esc(r.v) + '</b></div>').join('') + '</div></section>';
    if (b.type === 'gallery') { const imgs = b.imgs.map(safeImg).filter(Boolean); if (imgs.length) html += '<section class="bk-sec">' + h2 + '<div class="bk-gal">' + imgs.map(u => '<img src="' + esc(u) + '" alt="" loading="lazy">').join('') + '</div></section>'; }
    if (b.type === 'coupon' && b.code) html += '<section class="bk-sec">' + h2 + '<div class="bk-coupon"><b>' + esc(b.code) + '</b><button type="button" data-code="' + esc(b.code) + '">' + L.copy + '</button></div>' + (b.note ? '<p class="bk-note">' + esc(b.note) + '</p>' : '') + '</section>';
    if (b.type === 'countdown' && b.at && !isNaN(new Date(b.at))) {
      const id = 'cd' + timers.length; timers.push([id, new Date(b.at)]);
      html += '<section class="bk-sec">' + h2 + '<div class="bk-cd" id="' + id + '"></div><p class="bk-when">' + esc(new Date(b.at).toLocaleString(opts.lang === 'en' ? 'en-GB' : 'el-GR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) + '</p></section>';
    }
    if (b.type === 'buttons') for (const x of b.items) {
      const href = hrefFor({ t: x.t === 'booking' ? 'link' : x.t, v: x.v }); if (!href) continue;
      const ext = /^https?:/.test(href);
      btns += '<a class="bk-btn' + (firstBtn ? ' main' : '') + '" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(x.l || BTN_TYPES[x.t]) + '</a>';
      firstBtn = false;
    }
  }
  if (btns) html += '<nav class="bk-btns">' + btns + '</nav>';
  if (!html) html = '<section class="bk-sec"><p class="bk-text">' + L.empty + '</p></section>';
  if (opts.footer) html += '<footer class="bk-foot">' + opts.footer + '</footer>';
  root.className = 'bk'; root.innerHTML = html;

  root.querySelectorAll('[data-code]').forEach(btn => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.code); btn.textContent = L.copied; setTimeout(() => btn.textContent = L.copy, 1600); } catch (e) {}
  }));
  const tick = () => timers.forEach(([id, at]) => {
    const box = document.getElementById(id); if (!box) return;
    let s = Math.max(0, Math.floor((at - Date.now()) / 1000));
    if (!s) { box.outerHTML = '<p class="bk-text" style="text-align:center;font-weight:700">' + L.ended + '</p>'; return; }
    const parts = [[Math.floor(s / 86400), L.d], [Math.floor(s % 86400 / 3600), L.h], [Math.floor(s % 3600 / 60), L.m], [s % 60, L.s]];
    box.innerHTML = parts.map(([n, l]) => '<div><b>' + n + '</b><small>' + l + '</small></div>').join('');
  });
  if (timers.length) { tick(); setInterval(tick, 1000); }
}
