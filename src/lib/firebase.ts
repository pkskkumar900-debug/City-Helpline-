import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDfgfEto73uWXUaHrrVglJKe6_EIf6C3Qk",
  authDomain: "city-helpline-47c96.firebaseapp.com",
  projectId: "city-helpline-47c96",
  storageBucket: "city-helpline-47c96.firebasestorage.app",
  messagingSenderId: "899952350045",
  appId: "1:899952350045:web:975ab1a4d749bfdce00eb4",
  measurementId: "G-1V9T3KLP46"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
