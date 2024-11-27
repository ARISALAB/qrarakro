// Εισαγωγή Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";

// Ρυθμίσεις Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA0oLrWu04w1PUjFbcQh12sxC38Ub-7gJk",
    authDomain: "myakorncashier.firebaseapp.com",
    projectId: "myakorncashier",
    storageBucket: "myakorncashier.appspot.com",
    messagingSenderId: "58579009346",
    appId: "1:58579009346:web:5184a07b1ebf5aab4f92db",
    measurementId: "G-7E6K6QQVZG"
};

// Αρχικοποίηση Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Επιλογή στοιχείων DOM
const pdfInput = document.getElementById("pdfFile");
const qrCanvas = document.getElementById("qrCode");
const downloadLink = document.getElementById("downloadLink");

// Λειτουργία για ανέβασμα PDF
const uploadPDF = async (file) => {
    try {
        const storageRef = ref(storage, `pdfs/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(snapshot.ref);
        console.log("Uploaded file available at:", fileUrl);
        return fileUrl;
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload the PDF. Please try again.");
        return null;
    }
};

// Λειτουργία δημιουργίας QR Code
const generateQRCode = (url) => {
    const qr = new QRious({
        value: url,
        size: 300,
        foreground: "#000000"
    });

    const qrContext = qrCanvas.getContext("2d");
    const qrImage = new Image();
    qrImage.src = qr.toDataURL();

    qrImage.onload = () => {
        qrContext.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        qrContext.drawImage(qrImage, 0, 0, 300, 300);

        downloadLink.href = qrImage.src;
        downloadLink.style.display = "inline-block";
        downloadLink.download = "qr-code.png";
    };
};

// Διαχείριση αλλαγής αρχείου PDF
pdfInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    const fileUrl = await uploadPDF(file);
    if (fileUrl) {
        alert("PDF uploaded successfully! Generating QR Code...");
        generateQRCode(fileUrl);
    }
});
