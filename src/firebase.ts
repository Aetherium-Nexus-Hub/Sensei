import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in db, if not create
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef).catch(error => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      throw error;
    });
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        createdAt: new Date().toISOString()
      }).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      });
    }
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
};

export const logOut = () => {
  signOut(auth);
};
