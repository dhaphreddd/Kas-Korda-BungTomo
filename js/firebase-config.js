// CONFIG CONFIGURATION FOR FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQo4o8nXP_UrxZyogHhinAqnfQrD55us0",
    authDomain: "kas-korda-bungtomo.firebaseapp.com",
    projectId: "kas-korda-bungtomo",
    storageBucket: "kas-korda-bungtomo.firebasestorage.app",
    messagingSenderId: "949478094850",
    appId: "1:949478094850:web:6845dcde9ff562265dcf1b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const isMock = false; // Forced production mode: real Firebase only, no LocalStorage mock.

console.log("Firebase terhubung dengan sukses.");

export { db, auth, isMock };
