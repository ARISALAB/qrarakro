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
function drawLogo(ctx, img, cx, cy, maxW, maxH) {
  const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
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
  ctx.fillStyle = color; ctx.textAlign = 'center'; fitText(ctx, t, cx, cy + 18, maxW, 54, 800, 22); ctx.textAlign = 'left';
}

/**
 * Ζωγραφίζει τη μία όψη της κάρτας.
 * d: { tpl, accent, name, role, company, phone, email, web, addr, qrSide, qrCaption, useLogo }
 * a: { qr: canvas, logo: Image|null }
 * bleed: περιθώριο κοπής σε px (0 για προεπισκόπηση / PNG)
 */
export function drawCard(canvas, side, d, a, bleed = 0) {
  const W = CW, H = CH, ctx = canvas.getContext('2d');
  canvas.width = W + 2 * bleed; canvas.height = H + 2 * bleed;
  ctx.setTransform(1, 0, 0, 1, bleed, bleed);
  const acc = d.accent || '#C9A46A', logo = d.useLogo ? a.logo : null, P = 64;
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
    if (side === 'front') {
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
    if (side === 'front') {
      bg('#FFFFFF'); bg(acc, 0, 0, 18, H);
      const x = P + 18, tw = qrHere ? W - x - P - 250 : W - x - P;
      drawIdentity(ctx, d, x, 175, tw, ink, acc === '#FFFFFF' ? muted : acc);
      drawContacts(ctx, d, x, H - P, tw, muted, acc);
      if (logo && !qrHere) drawLogo(ctx, logo, W - P - 70, P + 60, 140, 110);
      if (qrHere) { ctx.strokeStyle = '#E7E2D8'; ctx.lineWidth = 2; rrect(ctx, W - P - 222, H - P - 262, 224, 224, 18); ctx.stroke(); drawQrTile(ctx, a.qr, W - P - 220, H - P - 260, 220, d.qrCaption, muted); }
    } else {
      bg(acc); const on = onColor(acc);
      if (qrHere) {
        if (logo) { ctx.fillStyle = '#FFFFFF'; rrect(ctx, W * 0.3 - 170, H / 2 - 140, 340, 260, 24); ctx.fill(); drawLogo(ctx, logo, W * 0.3, H / 2 - 10, 280, 200); }
        else brandMark(ctx, d, null, W * 0.3, H / 2 - 10, 340, 200, on);
        drawQrTile(ctx, a.qr, W * 0.6, H / 2 - 175, 300, d.qrCaption, on);
      } else if (logo) { ctx.fillStyle = '#FFFFFF'; rrect(ctx, W / 2 - 220, H / 2 - 150, 440, 300, 28); ctx.fill(); drawLogo(ctx, logo, W / 2, H / 2, 360, 240); }
      else brandMark(ctx, d, null, W / 2, H / 2, 560, 260, on);
    }
  }

  if (tpl === 'color') {
    const on = onColor(acc);
    if (side === 'front') {
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
    if (side === 'front') {
      bg('#FFFFFF'); bg(acc, 0, 0, lw, H);
      if (qrHere) drawQrTile(ctx, a.qr, lw / 2 - 130, H / 2 - 150, 260, d.qrCaption, on);
      else if (logo) { ctx.fillStyle = '#FFFFFF'; rrect(ctx, lw / 2 - 140, H / 2 - 110, 280, 220, 24); ctx.fill(); drawLogo(ctx, logo, lw / 2, H / 2, 220, 170); }
      else brandMark(ctx, d, null, lw / 2, H / 2, lw - 80, 240, on);
      const x = lw + 56, tw = W - x - P;
      drawIdentity(ctx, d, x, 175, tw, '#121316', acc === '#FFFFFF' ? '#5E6157' : acc);
      drawContacts(ctx, d, x, H - P, tw, '#5E6157', acc);
    } else {
      bg(acc);
      if (qrHere) {
        if (logo) { ctx.fillStyle = '#FFFFFF'; rrect(ctx, W * 0.3 - 160, H / 2 - 130, 320, 240, 24); ctx.fill(); drawLogo(ctx, logo, W * 0.3, H / 2 - 10, 260, 190); }
        else brandMark(ctx, d, null, W * 0.3, H / 2 - 10, 320, 220, on);
        drawQrTile(ctx, a.qr, W * 0.6, H / 2 - 175, 300, d.qrCaption, on);
      }
      else if (logo) { ctx.fillStyle = '#FFFFFF'; rrect(ctx, W / 2 - 220, H / 2 - 150, 440, 300, 28); ctx.fill(); drawLogo(ctx, logo, W / 2, H / 2, 360, 240); }
      else brandMark(ctx, d, null, W / 2, H / 2, 560, 260, on);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}
