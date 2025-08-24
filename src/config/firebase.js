import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDpYVhP_uLDecqds0VD7g409N_AMj-OMF8",
  authDomain: "pre-group.firebaseapp.com",
  projectId: "pre-group",
  storageBucket: "pre-group.firebasestorage.app",
  messagingSenderId: "871778209250",
  appId: "1:871778209250:web:79e726a4f5b5579bfc7dbb"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
