
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDB0MdoX5iW03B_AR8PU7o27LhJq2opCgs",
  authDomain: "nlcc-youth-attandence.firebaseapp.com",
  projectId: "nlcc-youth-attandence",
  storageBucket: "nlcc-youth-attandence.firebasestorage.app",
  messagingSenderId: "50347642198",
  appId: "1:50347642198:web:bf2cfa0cc3bc49cb7bdaf7",
  measurementId: "G-1Q8J8E08HZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
