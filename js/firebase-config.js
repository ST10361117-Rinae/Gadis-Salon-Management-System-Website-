// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCUMo7d4oWwjYeunBE_f2SMObXvpUQfKRs",
  authDomain: "gdsm-6a8d0.firebaseapp.com",
  projectId: "gdsm-6a8d0",
  storageBucket: "gdsm-6a8d0.firebasestorage.app",
  messagingSenderId: "1067418184764",
  appId: "1:1067418184764:web:a8c652cfb61968a5836739",
  measurementId: "G-E6GFCDHSHN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);