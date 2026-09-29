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
