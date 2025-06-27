import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    correctMoves: 0,
    wrongMoves: 0,
    handsPlayed: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [buyModal, setBuyModal] = useState(false);
  const [buyAmount, setBuyAmount] = useState(10);
  const [buyLoading, setBuyLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    setStatsLoading(true);
    const statsRef = doc(db, "blackjackStats", user.uid);
    const unsubStats = onSnapshot(
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
    const userRef = doc(db, "blackjackStats", user.uid);
    const unsubCredits = onSnapshot(userRef, (docSnap) => {
      setCredits(docSnap.exists() ? docSnap.data().credits || 0 : 0);
    });
    return () => {
      unsubStats();
      unsubCredits();
    };
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

  const accuracy =
    stats.correctMoves + stats.wrongMoves > 0
      ? Math.round(
          (stats.correctMoves / (stats.correctMoves + stats.wrongMoves)) * 100
        )
      : 0;

  const data = {
    labels: ["Correct", "Wrong"],
    datasets: [
      {
        data: [stats.correctMoves, stats.wrongMoves],
        backgroundColor: ["#22c55e", "#ef4444"], // green, red
        borderColor: ["#16a34a", "#b91c1c"],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${value}`;
          },
        },
      },
      title: {
        display: true,
        text: "Accuracy",
        font: { size: 20 },
      },
    },
  };

  const handleBuyCredits = async () => {
    setBuyLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: buyAmount, userId: user.uid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout session.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <div className="flex flex-col items-center gap-6 bg-black bg-opacity-70 text-white p-6 rounded text-lg min-w-[300px]">
        <div className="flex items-center justify-between w-full mb-2">
          <span className="font-semibold">Credits: {credits}</span>
          <button
            className="btn btn-outline ml-4"
            onClick={() => setBuyModal(true)}
          >
            Buy 10 Credits
          </button>
        </div>
        {buyModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-6 rounded shadow flex flex-col gap-4 min-w-[300px]">
              <h2 className="text-xl font-bold mb-2">Buy 10 Credits</h2>
              <label className="flex flex-col gap-1">
                Quantity:
                <input
                  type="number"
                  min={1}
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(Number(e.target.value))}
                  className="border rounded p-2"
                />
              </label>
              <div className="flex gap-2 mt-2">
                <button
                  className="btn"
                  onClick={handleBuyCredits}
                  disabled={buyLoading}
                >
                  {buyLoading ? "Processing..." : "Proceed to Checkout"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setBuyModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="relative w-60 h-60 flex items-center justify-center">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold">{accuracy}%</span>
            <span className="text-base">Accuracy</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <div>
            <span className="font-semibold">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-semibold">Correct Moves:</span>{" "}
            {stats.correctMoves}
          </div>
          <div>
            <span className="font-semibold">Wrong Moves:</span>{" "}
            {stats.wrongMoves}
          </div>
          <div>
            <span className="font-semibold">Hands Played:</span>{" "}
            {stats.handsPlayed}
          </div>
        </div>
      </div>
    </main>
  );
}
