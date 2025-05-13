import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDTjuuiKk6JTN-X1r_JsENwOLePcPmY7W0",
  authDomain: "library-system-6738d.firebaseapp.com",
  projectId: "library-system-6738d",
  storageBucket: "library-system-6738d.appspot.com",
  messagingSenderId: "557477699859",
  appId: "1:557477699859:web:ca2d331a1645bc3d91bae6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

export {app, auth, db};