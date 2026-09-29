// Στοιχεία του Firebase project "akron-qr".
// Δεν είναι μυστικά: η ασφάλεια γίνεται από τους κανόνες (firestore.rules).
export const firebaseConfig = {
  apiKey: "AIzaSyB_kBWRV18iCT_ZC1qqSKnuUHM4fhJzl04",
  authDomain: "akron-qr.firebaseapp.com",
  projectId: "akron-qr",
  storageBucket: "akron-qr.firebasestorage.app",
  messagingSenderId: "833879363553",
  appId: "1:833879363553:web:b42b2a69690935bdda8ca0"
};

// Διαχειριστής: αν αλλάξει, άλλαξέ το ΚΑΙ στο firestore.rules
export const ADMIN_EMAIL = 'aris.alampourinos@gmail.com';

// Η μόνιμη διεύθυνση του προϊόντος (μπαίνει στα QR)
export const SITE = 'https://qr.arakronservices.gr';

// Όνομα προϊόντος (άλλαξέ το όταν κλείσει το brand)
export const BRAND = 'AR Akron QR';

/* ---------------- Premium ----------------
   Βάλε εδώ τα links αγοράς των δύο παραλλαγών από το Lemon Squeezy
   (Products → το προϊόν → κάθε variant → Share → "Checkout URL").
   Όσο μένουν κενά, το κουμπί πληρωμής λέει ότι οι πληρωμές ανοίγουν σύντομα. */
export const LEMON = {
  yearlyUrl: '',   // π.χ. 'https://akron.lemonsqueezy.com/buy/xxxxxxxx-xxxx-...'
  monthlyUrl: ''
};
export const PRICES = { monthly: '7€', yearly: '70€', yearlyPerMonth: '5,83€' };  // με ΦΠΑ
export const MAX_QR = 10;        // δυναμικά QR ανά λογαριασμό (και στο firestore.rules)
export const TEST_SCANS = 10;    // δοκιμαστικά σκαναρίσματα πριν την ενεργοποίηση (και στο firestore.rules)
export const GRACE_DAYS = 30;    // μέρες χάρης μετά τη λήξη της συνδρομής

// Premium ενεργό (ή σε περίοδο χάριτος) με βάση το έγγραφο entitlements/{uid}
export function premiumState(ent) {
  const until = ent && ent.premiumUntil && ent.premiumUntil.toMillis ? ent.premiumUntil.toMillis() : 0;
  const now = Date.now(), grace = until + GRACE_DAYS * 864e5;
  return { active: until > now, grace: until <= now && grace > now, usable: grace > now, ever: until > 0, until, graceUntil: grace };
}
