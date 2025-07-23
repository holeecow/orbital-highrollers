import Hero from "../components/Hero";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("loginSuccess")
    ) {
      sessionStorage.removeItem("loginSuccess"); // Remove first!
      setShowLoginSuccess(true);
      setTimeout(() => setShowLoginSuccess(false), 3000);
    }
  }, []);

  return (
    <>
      {showLoginSuccess && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded shadow-lg text-lg animate-fade-move-up">
          Successfully logged in!
        </div>
      )}
      <Hero />
    </>
  );
}
