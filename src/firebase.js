// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBIj284TIRSPFs5qJmUjbwc8HVZMPbLsCA",
  authDomain: "bappatravels-8fa47.firebaseapp.com",
  projectId: "bappatravels-8fa47",
  storageBucket: "bappatravels-8fa47.appspot.com",
  messagingSenderId: "949273352070",
  appId: "1:949273352070:web:8a7f2e2fb1f32faf1d7e07",
  measurementId: "G-20RPM0MW9J",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, googleProvider, db, storage };
