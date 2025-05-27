import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "../firebase.js"; // adjust if your firebase file is elsewhere

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    // make sure Firebase stores the session in localStorage
    setPersistence(auth, browserLocalPersistence);

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u); // u === null  → signed-out
      setLoad(false);
    });
    return unsub;
  }, []);

  const signUserOut = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signUserOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
