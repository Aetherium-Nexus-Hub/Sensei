import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, LogOut } from 'lucide-react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}

export function AuthButton() {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-cp-cyan text-sm animate-pulse">Checking Auth...</div>;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.photoURL && <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-cp-cyan" referrerPolicy="no-referrer" />}
          <span className="text-sm font-bold text-white hidden md:inline">{user.displayName}</span>
        </div>
        <button onClick={logOut} className="cp-button px-3 py-1.5 text-xs flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={signInWithGoogle} className="cp-button px-4 py-2 text-sm flex items-center gap-2">
      <LogIn className="w-4 h-4" /> Connect Google
    </button>
  );
}
