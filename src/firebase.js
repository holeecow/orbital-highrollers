// Import the functions you need from the SDKs you need
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJEVIiOA9jrzYnPsSkn_7yFH9M_r2VoJM",
  authDomain: "high-rollers-3ace2.firebaseapp.com",
  projectId: "high-rollers-3ace2",
  storageBucket: "high-rollers-3ace2.firebasestorage.app",
  messagingSenderId: "21522508567",
  appId: "1:21522508567:web:27fc62662ab77321fba552",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
