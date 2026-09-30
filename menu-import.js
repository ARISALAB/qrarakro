// Δωρεάν εισαγωγή μενού από PDF ή φωτογραφία, μέσα στον browser (χωρίς AI και χωρίς κόστος).
// PDF με κείμενο → pdf.js · σκαναρισμένο PDF ή φωτογραφία → αναγνώριση κειμένου (Tesseract, ελληνικά + αγγλικά).

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector('script[src="' + src + '"]')) return res();
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('script')); document.head.appendChild(s);
  });
}

/* ---------------- Ανάγνωση αρχείου → γραμμές κειμένου ---------------- */
// onStep(text, fraction) για την ένδειξη προόδου
export async function fileToLines(file, onStep = () => {}, opts = {}) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) {
    onStep('Άνοιγμα του PDF…', 0.05);
    await loadScript(PDFJS);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = Math.min(pdf.numPages, 12);
    let lines = [], chars = 0;
    for (let n = 1; n <= pages; n++) {
      onStep('Ανάγνωση σελίδας ' + n + ' από ' + pages + '…', 0.05 + 0.4 * n / pages);
      const page = await pdf.getPage(n);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const items = tc.items.filter(i => i.str && i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width || 0, h: Math.abs(i.transform[3]) || 10 }));
      chars += items.reduce((a, i) => a + i.s.trim().length, 0);
      lines = lines.concat(itemsToLines(items, vp.width, opts));
    }
    if (chars > 40) return lines;
    // Σκαναρισμένο PDF: ζωγραφίζουμε τις σελίδες και κάνουμε αναγνώριση κειμένου
    const canvases = [];
    for (let n = 1; n <= Math.min(pages, 6); n++) {
      const page = await pdf.getPage(n), vp = page.getViewport({ scale: 2 });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; canvases.push(c);
    }
    return ocr(canvases, onStep, opts);
  }
  return ocr([await fileToCanvas(file)], onStep, opts);
}

async function fileToCanvas(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.25)'; x.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}

async function ocr(canvases, onStep, opts = {}) {
  onStep('Φόρτωση αναγνώρισης κειμένου (την πρώτη φορά αργεί λίγο)…', 0.1);
  await loadScript(TESS);
  const worker = await window.Tesseract.createWorker(['ell', 'eng'], 1, {
    logger: m => { if (m.status === 'recognizing text') onStep('Ανάγνωση κειμένου… ' + Math.round(m.progress * 100) + '%', 0.2 + 0.7 * m.progress); }
  });
  let lines = [];
  try {
    for (const c of canvases) {
      const { data } = await worker.recognize(c);
      const words = [];
      (data.lines || []).forEach(l => (l.words || []).forEach(w => words.push({ s: w.text, x: w.bbox.x0, y: -w.bbox.y0, w: w.bbox.x1 - w.bbox.x0, h: w.bbox.y1 - w.bbox.y0 })));
      lines = lines.concat(words.length ? itemsToLines(words, c.width, opts) : String(data.text || '').split('\n'));
    }
  } finally { await worker.terminate(); }
  return lines;
}

/* Κομμάτια κειμένου με θέση → γραμμές, με υποστήριξη καταλόγων σε δύο στήλες */
export function itemsToLines(items, pageWidth, opts = {}) {
  if (!items.length) return [];
  const avgH = items.reduce((a, i) => a + i.h, 0) / items.length || 10;
  const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x);
  const rows = [];
  for (const it of sorted) {
    const r = rows.find(r => Math.abs(r.y - it.y) < avgH * 0.5);
    if (r) r.items.push(it); else rows.push({ y: it.y, items: [it] });
  }
  // Δύο στήλες: σπάμε τη γραμμή όπου υπάρχει μεγάλο κενό κοντά στη μέση της σελίδας
  const mid = pageWidth / 2, gapMin = pageWidth * 0.08;
  const left = [], right = [];
  let twoCol = 0;
  rows.forEach(r => {
    r.items.sort((a, b) => a.x - b.x);
    let cut = -1;
    for (let k = 1; k < r.items.length; k++) {
      const prevEnd = r.items[k - 1].x + r.items[k - 1].w, gap = r.items[k].x - prevEnd;
      if (gap > gapMin && r.items[k].x > mid * 0.85 && prevEnd < mid * 1.15) { cut = k; break; }
    }
    // Μόνο ελληνικά: αν αριστερά είναι ελληνικά και δεξιά μετάφραση/τιμή, δεν σπάμε τη γραμμή (για να μείνει η τιμή με το πιάτο)
    if (cut > 0 && opts.greekOnly) {
      const lt = r.items.slice(0, cut).map(i => i.s).join(' '), rt = r.items.slice(cut).map(i => i.s).join(' ');
      if (GREEK.test(lt) && !GREEK.test(rt)) cut = -1;
    }
    if (cut > 0) { twoCol++; left.push({ y: r.y, items: r.items.slice(0, cut) }); right.push({ y: r.y, items: r.items.slice(cut) }); }
    else if (r.items[0].x > mid * 0.95) right.push(r); else left.push(r);
  });
  const text = r => r.items.map(i => i.s).join(' ').replace(/\s+/g, ' ').trim();
  const isTwoCol = twoCol >= Math.max(3, rows.length * 0.2) || (right.length > rows.length * 0.3 && left.length > rows.length * 0.3);
  if (!isTwoCol) return rows.map(r => ({ y: r.y, items: r.items.slice().sort((a, b) => a.x - b.x) })).map(text).filter(Boolean);
  return left.map(text).concat(right.map(text)).filter(Boolean);
}

/* ---------------- Γραμμές → κατηγορίες και πιάτα ---------------- */
const PRICE = '(?<![\\p{L}\\d.,])(?:€\\s*)?(\\d{1,3}(?:[.,]\\d{1,2})?)(?![\\d.,]*\\p{L})(?!\\s*(?:ml|gr|g|kg|lt|l|cl|τεμ|γρ|λτ|κιλ)\\b)\\s*(?:€|eur|euro|ευρώ)?';
const PRICE_END = new RegExp('^(.*?)[\\s.·…_\\-–—:]*' + PRICE + '\\s*$', 'iu');
const ONLY_PRICES = new RegExp('^(?:' + PRICE + '[\\s/|,]*){1,3}$', 'iu');
const GREEK = /[\u0370-\u03FF\u1F00-\u1FFF]/;
const toNum = s => Math.round(Number(String(s).replace(',', '.')) * 100) / 100;
const clean = s => s.replace(/[.·…_]{2,}/g, ' ').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').replace(/^[\-–—•*·\/|,&+\s]+|[\-–—•*·:\/|,(&+\s]+$/g, '').trim();
const letters = s => (s.match(/[A-Za-z\u0370-\u03FF\u1F00-\u1FFF]/g) || []).length;
const isUpper = s => letters(s) >= 3 && s === s.toUpperCase() && s !== s.toLowerCase();

// Χωρίζει «Τζατζίκι / Tzatziki» σε ελληνικά και αγγλικά
function splitLang(s, lang) {
  const m = s.split(/\s+[\/|]\s+/);
  if (m.length === 2 && GREEK.test(m[0]) !== GREEK.test(m[1])) {
    const [gr, en] = GREEK.test(m[0]) ? m : [m[1], m[0]];
    return { el: clean(gr), en: clean(en) };
  }
  return { [lang]: s };
}

// Μόνο ελληνικά: κρατάμε τις ελληνικές λέξεις (και τις τιμές), πετάμε μεταφράσεις σε λατινικούς χαρακτήρες
const LATIN_WORD = /(^|[\s\/|,(])[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F'’&\-]*(?=$|[\s\/|,.)!:])/g;
export function greekOnlyLines(lines) {
  const out = [];
  for (const raw of lines) {
    const line = String(raw).replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (GREEK.test(line)) {
      let t = line; for (let k = 0; k < 3; k++) t = t.replace(LATIN_WORD, '$1');
      t = t.replace(/\s*[\/|]\s*(?=[\/|]|$)/g, ' ').replace(/\s+/g, ' ').trim();
      // ίδια ποσότητα/αριθμός από κάθε μετάφραση: κρατάμε μία φορά (500gr 500gr 500gr → 500gr)
      const seen = new Set();
      t = t.split(' ').filter(w => { if (!/\d/.test(w) || !/\p{L}/u.test(w) && !/^\d{1,2}$/.test(w)) return true; const k = w.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
        .join(' ').replace(/(\s[—–-])(\s[—–-])+/g, '$1').replace(/\s+[—–-]\s*$/, '').trim();
      if (GREEK.test(t)) out.push(t);
      continue;
    }
    // Γραμμή χωρίς ελληνικά: κρατάμε μόνο τις τιμές της (θα πάνε στο ελληνικό πιάτο από πάνω)
    const ps = line.match(new RegExp(PRICE, 'giu'));
    if (ps && new RegExp(PRICE_END.source, 'iu').test(line)) out.push(ps.map(x => x.trim()).join(' / '));
  }
  return out;
}

export function linesToSections(lines, lang = 'el', opts = {}) {
  if (opts.greekOnly) { lines = greekOnlyLines(lines); lang = 'el'; }
  const sections = [];
  let sec = null, last = null;
  const newSec = title => { sec = { title: splitLang(title, lang), items: [] }; sections.push(sec); last = null; pending = ''; };
  const prices = s => { const out = []; const re = new RegExp(PRICE, 'giu'); let m; while ((m = re.exec(s))) out.push(toNum(m[1])); return out; };
  const NOT_TITLE = /^(τιμη|τιμή|τιμες|τιμές|προϊον|προϊόν|price|prices|€|eur)$/i;
  let pending = '';
  const L = lines.map(l => String(l).replace(/\s+/g, ' ').trim()).filter(l => l && !/^\d{1,2}$/.test(l) && letters(l) + (l.match(/\d/g) || []).length >= 2);

  for (let k = 0; k < L.length; k++) {
    const line = L[k];
    // Γραμμή μόνο με τιμή(ές): ανήκει στο προηγούμενο πιάτο χωρίς τιμή
    if (ONLY_PRICES.test(line)) {
      if (last && last.prices.every(p => p.p === null)) { const ps = prices(line); last.prices = ps.map(p => ({ l: {}, p })); }
      continue;
    }
    // Γραμμή με τιμή στο τέλος: πιάτο (με πιθανή δεύτερη τιμή «4,50 / 8,00»)
    const two = line.match(new RegExp('^(.*?)[\\s.·…_\\-–—:]*' + PRICE + '\\s*[\\/|]\\s*' + PRICE + '\\s*$', 'iu'));
    const one = !two && line.match(PRICE_END);
    const name = clean(two ? two[1] : one ? one[1] : '');
    if ((two || one) && letters(name) >= 2) {
      if (!sec) newSec(lang === 'el' ? 'Μενού' : 'Menu');
      const ps = two ? [toNum(two[2]), toNum(two[3])] : [toNum(one[2])];
      last = { name: splitLang(name, lang), desc: pending ? { [lang]: pending.slice(0, 300) } : {}, prices: ps.map(p => ({ l: {}, p })) };
      pending = '';
      sec.items.push(last);
      continue;
    }
    // Γραμμή χωρίς τιμή: τίτλος κατηγορίας ή περιγραφή/όνομα πιάτου
    const txt = clean(line), words = txt.split(' ').length;
    const nextHasPrice = L[k + 1] && (PRICE_END.test(L[k + 1]) || ONLY_PRICES.test(L[k + 1]));
    if (ONLY_PRICES.test(L[k + 1] || '') && !isUpper(txt)) {   // όνομα πιάτου με την τιμή στην επόμενη γραμμή
      if (!sec) newSec(lang === 'el' ? 'Μενού' : 'Menu');
      last = { name: splitLang(txt, lang), desc: {}, prices: [{ l: {}, p: null }] }; sec.items.push(last); continue;
    }
    if (txt.split(/[\s\/|]+/).filter(Boolean).every(w => NOT_TITLE.test(w) || /^(και|&)$/i.test(w))) continue;   // επικεφαλίδες πίνακα («ΠΡΟΪΟΝ ΤΙΜΗ»)
    // Ξεκινά με μικρό γράμμα ή έχει κόμμα: είναι περιγραφή, ποτέ κατηγορία
    if (/^[a-zα-ωάέήίόύώϊϋΐΰ(«"]/.test(txt) || /,/.test(txt)) {
      if (last) { const d = last.desc[lang] ? last.desc[lang] + ' ' + txt : txt; last.desc = Object.assign({}, last.desc, { [lang]: d.slice(0, 300) }); }
      else pending = (pending ? pending + ' ' : '') + txt;   // πριν από το πρώτο πιάτο: θα πάει στο επόμενο πιάτο
      continue;
    }
    const looksTitle = isUpper(txt) ? words <= 6 : (words <= 3 && !/[,.;]$/.test(line) && !(last && last.prices.every(p => p.p === null)));
    if (looksTitle && !(last && !nextHasPrice && !isUpper(txt) && /^[a-zα-ωά-ώ]/.test(txt))) { newSec(txt); continue; }
    if (last && last.prices.every(p => p.p === null) === false && !isUpper(txt)) {
      // περιγραφή του προηγούμενου πιάτου
      const d = last.desc[lang] ? last.desc[lang] + ' ' + txt : txt;
      last.desc = Object.assign({}, last.desc, { [lang]: d.slice(0, 300) });
      continue;
    }
    if (last) { const d = last.desc[lang] ? last.desc[lang] + ' ' + txt : txt; last.desc = Object.assign({}, last.desc, { [lang]: d.slice(0, 300) }); }
    else newSec(txt);
  }
  return sections.filter(s => s.items.length);
}
