// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlxWFCnUSM7PsSjhVKXUSX8T-3Anok7K8",
  authDomain: "cyprus-church.firebaseapp.com",
  projectId: "cyprus-church",
  storageBucket: "cyprus-church.firebasestorage.app",
  messagingSenderId: "670597427370",
  appId: "1:670597427370:web:fb15a0bf1c197ab6f4e0d3",
  measurementId: "G-JR9L74YDZ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Payment configuration (add your payment keys here)
export const paymentConfig = {
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  flutterwavePublicKey: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || ''
};

export default app;