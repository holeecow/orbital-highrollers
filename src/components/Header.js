import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Header() {
  const { user, loading, signUserOut } = useAuth();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (!user) {
      setCredits(0);
      return;
    }
    const userRef = doc(db, "blackjackStats", user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      setCredits(docSnap.exists() ? docSnap.data().credits || 0 : 0);
    });
    return () => unsub();
  }, [user]);

  return (
    <nav className="flex items-center  justify-between flex-wrap bg-teal-500 p-2">
      <div className="h-12 flex items-center flex-shrink-0 text-white mr-6">
        <img /* logo here */
          src="/icon.png"
          alt="Logo"
          className="h-20 w-18 object-contain"
        />
        <span className="font-semibold text-xl tracking-tight">
          BJ Basics
        </span>
      </div>
      <div className="block lg:hidden">
        <button className="flex items-center px-3 py-2 border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white">
          <svg
            className="fill-current h-3 w-3"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
          </svg>
        </button>
      </div>
      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div className="text-sm lg:flex-grow">
          <Link
            href="/" //directs the user to the home page
            className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4"
          >
            Home
          </Link>
          <Link
            href="/strategies"
            className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4"
          >
            Strategies
          </Link>

          <Link
            href="/about"
            className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white"
          >
            About
          </Link>
        </div>
        {!loading &&
          (user ? (
            <div className="flex items-center gap-4">
              <span className="text-teal-200">
                {user.displayName || user.email}
                {` | Credits: ${credits}`}
              </span>
              <Link href="/profile" className="btn btn-outline">
                Profile
              </Link>
              <button onClick={signUserOut} className="btn btn-outline">
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-outline">
              Log in
            </Link>
          ))}
      </div>
    </nav>
  );
}
