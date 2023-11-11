// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_U6c2GvGnWFLWa2dZU8LkdhLbXDqk-Hw",
  authDomain: "urbancomputingappa4.firebaseapp.com",
  projectId: "urbancomputingappa4",
  storageBucket: "urbancomputingappa4.appspot.com",
  messagingSenderId: "519704218714",
  appId: "1:519704218714:web:7c692c4c6a0b0ff4be5c63",
  measurementId: "G-MP02GHL5W5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const googleProvider = new GoogleAuthProvider();
export const auth = getAuth(app);
export const db = getFirestore(app);
