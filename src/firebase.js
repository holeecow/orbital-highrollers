// Import the functions you need from the SDKs you need
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGYMbdNLlI1do6Ey0nRfe8PK3rm2RH_08",
  authDomain: "orbital-59b2f.firebaseapp.com",
  projectId: "orbital-59b2f",
  storageBucket: "orbital-59b2f.firebasestorage.app",
  messagingSenderId: "424217846904",
  appId: "1:424217846904:web:e955a6d88121ee019cf98d",
  measurementId: "G-JH508TV87S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
