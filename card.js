// Σχεδιαστής επαγγελματικής κάρτας (Premium). Ίδιος κώδικας για προεπισκόπηση και αρχεία εκτύπωσης.
// Μέγεθος κάρτας 85 × 55 mm στα 300 dpi = 1004 × 650 px. Με περιθώριο κοπής 3 mm: 1075 × 721 px.
export const CW = 1004, CH = 650, BLEED = 35;

export const TEMPLATES = [
  { id: 'noir', name: 'Μαύρο & χρυσό' },
  { id: 'white', name: 'Λευκό minimal' },
  { id: 'color', name: 'Έντονο χρώμα' },
  { id: 'split', name: 'Δίχρωμο' }
];
export const ACCENTS = ['#C9A46A', '#121316', '#1F3A5F', '#2F5D50', '#7A2E3A', '#B4532A'];

function lum(hex) {
  const n = parseInt(String(hex || '#ffffff').slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const onColor = hex => (lum(hex) > 0.42 ? '#121316' : '#FFFFFF');
const FONT = 'Manrope, "Segoe UI", Arial, sans-serif';

function font(ctx, size, weight) { ctx.font = (weight || 600) + ' ' + size + 'px ' + FONT; }
// Μικραίνει τη γραμματοσειρά μέχρι να χωρέσει το κείμενο
function fitText(ctx, text, x, y, maxW, size, weight, min) {
  let s = size; font(ctx, s, weight);
  while (s > (min || 14) && ctx.measureText(text).width > maxW) { s -= 1; font(ctx, s, weight); }
  ctx.fillText(text, x, y, maxW);
  return s;
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
let LS = 1; // μέγεθος λογότυπου που διάλεξε ο χρήστης (0.5 – 1.6)
function logoBox(img, maxW, maxH) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.min(Math.min(maxW * LS, CW - 80) / iw, Math.min(maxH * LS, CH - 80) / ih);
  return [iw * s, ih * s];
}
function drawLogo(ctx, img, cx, cy, maxW, maxH) {
  const [w, h] = logoBox(img, maxW, maxH);
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}
// Λογότυπο πάνω σε λευκή κάρτα-πλαίσιο (για χρωματιστό φόντο). Το πλαίσιο ακολουθεί το μέγεθος του λογότυπου.
function logoTile(ctx, img, cx, cy, maxW, maxH) {
  const [w, h] = logoBox(img, maxW, maxH), pad = Math.max(18, Math.min(w, h) * 0.14);
  ctx.fillStyle = '#FFFFFF'; rrect(ctx, cx - w / 2 - pad, cy - h / 2 - pad, w + 2 * pad, h + 2 * pad, 22); ctx.fill();
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}
function drawQrTile(ctx, qr, x, y, size, caption, capColor) {
  ctx.fillStyle = '#FFFFFF'; rrect(ctx, x, y, size, size, size * 0.08); ctx.fill();
  const pad = size * 0.06; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, x + pad, y + pad, size - 2 * pad, size - 2 * pad); ctx.imageSmoothingEnabled = true;
  if (caption) { ctx.fillStyle = capColor; ctx.textAlign = 'center'; fitText(ctx, caption, x + size / 2, y + size + 40, size + 60, 24, 700, 16); ctx.textAlign = 'left'; }
}
function contactLines(d) { return [d.phone, d.email, d.web, d.addr].map(v => (v || '').trim()).filter(Boolean); }
function drawContacts(ctx, d, x, yBottom, maxW, color, dot) {
  const lines = contactLines(d); let y = yBottom - (lines.length - 1) * 40;
  for (const l of lines) {
    ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(x + 5, y - 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; fitText(ctx, l, x + 22, y, maxW - 22, 26, 500, 16); y += 40;
  }
}
function drawIdentity(ctx, d, x, y, maxW, nameColor, roleColor) {
  ctx.fillStyle = nameColor; fitText(ctx, d.name || 'Ονοματεπώνυμο', x, y, maxW, 58, 800, 30);
  if ((d.role || '').trim()) { ctx.fillStyle = roleColor; fitText(ctx, d.role.trim(), x, y + 48, maxW, 28, 600, 16); }
  if ((d.company || '').trim()) { ctx.fillStyle = nameColor; ctx.globalAlpha = .62; fitText(ctx, d.company.trim(), x, y + ((d.role || '').trim() ? 88 : 48), maxW, 24, 500, 15); ctx.globalAlpha = 1; }
}
function brandMark(ctx, d, logo, cx, cy, maxW, maxH, color) {
  if (logo) return drawLogo(ctx, logo, cx, cy, maxW, maxH);
  const t = (d.company || d.name || '').trim(); if (!t) return;
  ctx.fillStyle = color; ctx.textAlign = 'center'; fitText(ctx, t, cx, cy + 18 * LS, Math.min(maxW * LS, CW - 80), Math.round(54 * LS), 800, 18); ctx.textAlign = 'left';
}

/**
 * Ζωγραφίζει τη μία όψη της κάρτας. Μπροστά: σήμα / λογότυπο. Πίσω: στοιχεία επικοινωνίας.
 * d: { tpl, accent, name, role, company, phone, email, web, addr, qrSide, qrCaption, useLogo }
 * a: { qr: canvas, logo: Image|null }
 * bleed: περιθώριο κοπής σε px (0 για προεπισκόπηση / PNG)
 */
export function drawCard(canvas, side, d, a, bleed = 0) {
  const W = CW, H = CH, ctx = canvas.getContext('2d');
  canvas.width = W + 2 * bleed; canvas.height = H + 2 * bleed;
  ctx.setTransform(1, 0, 0, 1, bleed, bleed);
  const acc = d.accent || '#C9A46A', logo = d.useLogo ? a.logo : null, P = 64;
  LS = Math.max(0.5, Math.min(1.6, Number(d.logoScale) || 1));
  const qrHere = d.qrSide === side && a.qr;
  // φόντο ως τις άκρες του περιθωρίου κοπής
  const bg = (color, x = 0, y = 0, w = W, h = H) => {
    const x0 = x <= 0 ? -bleed : x, y0 = y <= 0 ? -bleed : y;
    const x1 = x + w >= W ? W + bleed : x + w, y1 = y + h >= H ? H + bleed : y + h;
    ctx.fillStyle = color; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  const tpl = d.tpl || 'noir';

  if (tpl === 'noir') {
    const ink = '#121316', ivory = '#F7F4EE', gold = acc === '#121316' ? '#C9A46A' : acc;
    bg(ink);
    if (side === 'back') {
      const tw = qrHere ? W - 2 * P - 250 : W - 2 * P;
      ctx.fillStyle = gold; ctx.fillRect(P, 110, 64, 5);
      drawIdentity(ctx, d, P, 205, tw, ivory, gold);
      drawContacts(ctx, d, P, H - P, tw, 'rgba(247,244,238,.85)', gold);
      if (qrHere) drawQrTile(ctx, a.qr, W - P - 220, H - P - 260, 220, d.qrCaption, ivory);
    } else {
      if (qrHere) {
        brandMark(ctx, d, logo, W * 0.3, H / 2 - 10, 300, 220, gold);
        drawQrTile(ctx, a.qr, W * 0.6, H / 2 - 175, 300, d.qrCaption, ivory);
      } else brandMark(ctx, d, logo, W / 2, H / 2, 520, 260, gold);
      ctx.fillStyle = gold; ctx.fillRect(W / 2 - 32, H - 52, 64, 4);
    }
  }

  if (tpl === 'white') {
    const ink = '#121316', muted = '#5E6157';
    if (side === 'back') {
      bg('#FFFFFF'); bg(acc, 0, 0, 18, H);
      const x = P + 18, tw = qrHere ? W - x - P - 250 : W - x - P;
      drawIdentity(ctx, d, x, 175, tw, ink, acc === '#FFFFFF' ? muted : acc);
      drawContacts(ctx, d, x, H - P, tw, muted, acc);
      if (logo && !qrHere) drawLogo(ctx, logo, W - P - 70, P + 60, 140, 110);
      if (qrHere) { ctx.strokeStyle = '#E7E2D8'; ctx.lineWidth = 2; rrect(ctx, W - P - 222, H - P - 262, 224, 224, 18); ctx.stroke(); drawQrTile(ctx, a.qr, W - P - 220, H - P - 260, 220, d.qrCaption, muted); }
    } else {
      bg(acc); const on = onColor(acc);
      if (qrHere) {
        if (logo) logoTile(ctx, logo, W * 0.3, H / 2 - 10, 260, 190);
        else brandMark(ctx, d, null, W * 0.3, H / 2 - 10, 340, 200, on);
        drawQrTile(ctx, a.qr, W * 0.6, H / 2 - 175, 300, d.qrCaption, on);
      } else if (logo) logoTile(ctx, logo, W / 2, H / 2, 360, 240);
      else brandMark(ctx, d, null, W / 2, H / 2, 560, 260, on);
    }
  }

  if (tpl === 'color') {
    const on = onColor(acc);
    if (side === 'back') {
      bg(acc);
      const tw = qrHere ? W - 2 * P - 250 : W - 2 * P;
      drawIdentity(ctx, d, P, 190, tw, on, on);
      ctx.globalAlpha = .9; drawContacts(ctx, d, P, H - P, tw, on, on); ctx.globalAlpha = 1;
      if (qrHere) drawQrTile(ctx, a.qr, W - P - 220, H - P - 260, 220, d.qrCaption, on);
    } else {
      bg('#FFFFFF'); bg(acc, 0, H - 26, W, 26);
      if (qrHere) {
        brandMark(ctx, d, logo, W * 0.3, H / 2 - 20, 320, 220, acc);
        ctx.strokeStyle = '#E7E2D8'; ctx.lineWidth = 2; rrect(ctx, W * 0.6 - 2, H / 2 - 177, 304, 304, 26); ctx.stroke();
        drawQrTile(ctx, a.qr, W * 0.6, H / 2 - 175, 300, d.qrCaption, '#5E6157');
      } else brandMark(ctx, d, logo, W / 2, H / 2 - 10, 560, 260, acc);
    }
  }

  if (tpl === 'split') {
    const on = onColor(acc), lw = Math.round(W * 0.38);
    if (side === 'back') {
      bg('#FFFFFF'); bg(acc, 0, 0, lw, H);
      if (qrHere) drawQrTile(ctx, a.qr, lw / 2 - 130, H / 2 - 150, 260, d.qrCaption, on);
      else if (logo) logoTile(ctx, logo, lw / 2, H / 2, 220, 170);
      else brandMark(ctx, d, null, lw / 2, H / 2, lw - 80, 240, on);
      const x = lw + 56, tw = W - x - P;
      drawIdentity(ctx, d, x, 175, tw, '#121316', acc === '#FFFFFF' ? '#5E6157' : acc);
      drawContacts(ctx, d, x, H - P, tw, '#5E6157', acc);
    } else {
      bg(acc);
      if (qrHere) {
        if (logo) logoTile(ctx, logo, W * 0.3, H / 2 - 10, 260, 190);
        else brandMark(ctx, d, null, W * 0.3, H / 2 - 10, 320, 220, on);
        drawQrTile(ctx, a.qr, W * 0.6, H / 2 - 175, 300, d.qrCaption, on);
      }
      else if (logo) logoTile(ctx, logo, W / 2, H / 2, 360, 240);
      else brandMark(ctx, d, null, W / 2, H / 2, 560, 260, on);
    }
  }
  // Σύνθημα στην όψη με το σήμα (μπροστά)
  if (side === 'front' && (d.tagline || '').trim()) {
    const tc = tpl === 'noir' ? '#F7F4EE' : tpl === 'color' ? '#5E6157' : onColor(acc);
    ctx.fillStyle = tc; ctx.globalAlpha = .9; ctx.textAlign = 'center';
    fitText(ctx, d.tagline.trim(), W / 2, H - (tpl === 'noir' ? 82 : 58), W - 2 * P, 26, 600, 15);
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}

/**
 * Αυτόματη αφαίρεση φόντου λογότυπου: βρίσκει το χρώμα του φόντου από τις άκρες της εικόνας
 * και κάνει διάφανες μόνο τις περιοχές που ξεκινούν από τις άκρες (τα ίδια χρώματα μέσα στο σήμα μένουν).
 * Επιστρέφει { img, ok } όπου ok=false αν η εικόνα έχει ήδη διαφάνεια ή δεν έχει ενιαίο φόντο.
 */
export function removeBackground(img) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.min(1, 900 / Math.max(iw, ih)), w = Math.max(1, Math.round(iw * s)), h = Math.max(1, Math.round(ih * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
  const im = x.getImageData(0, 0, w, h), p = im.data, N = w * h;
  const border = [];
  for (let i = 0; i < w; i++) border.push(i, (h - 1) * w + i);
  for (let j = 1; j < h - 1; j++) border.push(j * w, j * w + w - 1);
  let transparent = 0; for (const k of border) if (p[k * 4 + 3] < 200) transparent++;
  if (transparent > border.length * 0.3) return { img, ok: false, reason: 'transparent' };
  // χρώμα φόντου: ο μέσος όρος των πιο συχνών χρωμάτων στις άκρες
  const buckets = new Map();
  for (const k of border) { const key = (p[k * 4] >> 4) + ',' + (p[k * 4 + 1] >> 4) + ',' + (p[k * 4 + 2] >> 4); buckets.set(key, (buckets.get(key) || 0) + 1); }
  const top = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(v => v * 16 + 8);
  const dist = k => Math.hypot(p[k * 4] - top[0], p[k * 4 + 1] - top[1], p[k * 4 + 2] - top[2]);
  const T = 46;
  let near = 0; for (const k of border) if (dist(k) < T * 1.6) near++;
  if (near < border.length * 0.55) return { img, ok: false, reason: 'busy' };
  const seen = new Uint8Array(N), stack = [];
  for (const k of border) if (dist(k) < T) { seen[k] = 1; stack.push(k); }
  while (stack.length) {
    const k = stack.pop(), cx = k % w, cy = (k - cx) / w;
    const nb = [cx > 0 ? k - 1 : -1, cx < w - 1 ? k + 1 : -1, cy > 0 ? k - w : -1, cy < h - 1 ? k + w : -1];
    for (const n of nb) if (n >= 0 && !seen[n] && dist(n) < T) { seen[n] = 1; stack.push(n); }
  }
  // διάφανο το φόντο, μαλακή μετάβαση στις άκρες του σήματος
  for (let k = 0; k < N; k++) {
    if (seen[k]) { p[k * 4 + 3] = 0; continue; }
    const cx = k % w, cy = (k - cx) / w;
    const touches = (cx > 0 && seen[k - 1]) || (cx < w - 1 && seen[k + 1]) || (cy > 0 && seen[k - w]) || (cy < h - 1 && seen[k + w]);
    if (touches) { const dd = dist(k); if (dd < T * 3) p[k * 4 + 3] = Math.min(p[k * 4 + 3], Math.round(255 * Math.max(0, (dd - T) / (T * 2)))); }
  }
  x.putImageData(im, 0, 0);
  // κόβει τα διάφανα περιθώρια ώστε το μέγεθος να αφορά μόνο το σήμα
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let k = 0; k < N; k++) if (p[k * 4 + 3] > 24) { const cx = k % w, cy = (k - cx) / w; if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy; }
  if (x1 < 0) return { img, ok: false, reason: 'empty' };
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { img: out, ok: true };
}
