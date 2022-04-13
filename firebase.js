import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

import dotenv from 'dotenv';
dotenv.config();

export const firebaseConfig = {
    apiKey: "AIzaSyCrF3pcWg3IufsfPV54MsbTNhutNX77J1Q",
    authDomain: "store-b9931.firebaseapp.com",
    projectId: "store-b9931",
    storageBucket: "store-b9931.appspot.com",
    messagingSenderId: "515969002816",
    appId: "1:515969002816:web:6bee723dce9073012edea5"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;