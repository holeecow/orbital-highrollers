import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    correctMoves: 0,
    wrongMoves: 0,
    handsPlayed: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    setStatsLoading(true);
    const statsRef = doc(db, "blackjackStats", user.uid);
    const unsubscribe = onSnapshot(
      statsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setStats({
            correctMoves: docSnap.data().correctMoves || 0,
            wrongMoves: docSnap.data().wrongMoves || 0,
            handsPlayed: docSnap.data().handsPlayed || 0,
          });
        } else {
          setStats({ correctMoves: 0, wrongMoves: 0, handsPlayed: 0 });
        }
        setStatsLoading(false);
      },
      (error) => {
        console.error("Error loading stats:", error);
        setStatsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, authLoading, router]);

  if (authLoading || statsLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Profile</h1>
        <div className="bg-black bg-opacity-70 text-white p-6 rounded text-lg">
          Loading stats...
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <div className="bg-black bg-opacity-70 text-white p-6 rounded text-lg flex flex-col gap-2 min-w-[300px]">
        <div>
          <span className="font-semibold">Email:</span> {user.email}
        </div>
        <div>
          <span className="font-semibold">Correct Moves:</span>{" "}
          {stats.correctMoves}
        </div>
        <div>
          <span className="font-semibold">Wrong Moves:</span> {stats.wrongMoves}
        </div>
        <div>
          <span className="font-semibold">Hands Played:</span>{" "}
          {stats.handsPlayed}
        </div>
        <div>
          <span className="font-semibold">Score:</span>{" "}
          {stats.correctMoves + stats.wrongMoves > 0
            ? Math.round(
                (stats.correctMoves / (stats.correctMoves + stats.wrongMoves)) *
                  100
              )
            : 0}
          %
        </div>
      </div>
    </main>
  );
}
