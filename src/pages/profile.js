import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    correctMoves: 0,
    wrongMoves: 0,
    handsPlayed: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    dailyStats: {},
    moveStats: {
        hit: { wins: 0, total: 0 },
        stand: { wins: 0, total: 0 },
        double: { wins: 0, total: 0 },
        split: { wins: 0, total: 0 },
    },
    winStreaks: [],
    lossStreaks: [],
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
    const unsubscribe = onSnapshot(
      statsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStats({
            correctMoves: data.correctMoves || 0,
            wrongMoves: data.wrongMoves || 0,
            handsPlayed: data.handsPlayed || 0,
            longestWinStreak: data.longestWinStreak || 0,
            longestLossStreak: data.longestLossStreak || 0,
            dailyStats: data.dailyStats || {},
            moveStats: data.moveStats || {
                hit: { wins: 0, total: 0 },
                stand: { wins: 0, total: 0 },
                double: { wins: 0, total: 0 },
                split: { wins: 0, total: 0 },
            },
            winStreaks: data.winStreaks || [],
            lossStreaks: data.lossStreaks || [],
          });
          setCredits(data.credits || 0);
        } else {
          setStats({
            correctMoves: 0,
            wrongMoves: 0,
            handsPlayed: 0,
            longestWinStreak: 0,
            longestLossStreak: 0,
            dailyStats: {},
            moveStats: {
                hit: { wins: 0, total: 0 },
                stand: { wins: 0, total: 0 },
                double: { wins: 0, total: 0 },
                split: { wins: 0, total: 0 },
            },
            winStreaks: [],
            lossStreaks: [],
          });
          setCredits(0);
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

  // Prepare data for the line chart
  const sortedDates = Object.keys(stats.dailyStats).sort();
  const labels = [];
  const totalWageredData = [];
  const netProfitData = [];

  if (sortedDates.length > 0) {
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    let cumulativeWagered = 0;
    let cumulativeProfit = 0;
    
    for (let d = firstDate; d <= lastDate; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().slice(0, 10);
        labels.push(dateString);

        if (stats.dailyStats[dateString]) {
            cumulativeWagered += stats.dailyStats[dateString].totalWagered;
            cumulativeProfit += stats.dailyStats[dateString].netProfit;
        }

        totalWageredData.push(cumulativeWagered);
        netProfitData.push(cumulativeProfit);
    }
  }

  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Total Wagered',
        data: totalWageredData,
        borderColor: 'orange',
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        fill: false,
      },
      {
        label: 'Net Profit',
        data: netProfitData,
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        fill: false,
      },
    ],
  };

  const lineChartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amount ($)',
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Total Wagered vs. Net Profit Over Time',
        font: { size: 20 },
      },
    },
  };

  const moveLabels = ['Hit', 'Stand', 'Double', 'Split'];
  const moveWinPercentages = moveLabels.map(label => {
    const move = label.toLowerCase();
    const { wins, total } = stats.moveStats[move] || { wins: 0, total: 0 };
    return total > 0 ? (wins / total) * 100 : 0;
  });

  const barChartData = {
    labels: moveLabels,
    datasets: [
        {
            label: 'Win %',
            data: moveWinPercentages,
            backgroundColor: 'orange',
        }
    ]
  };

  const barChartOptions = {
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            ticks: {
                callback: function(value) {
                    return value + '%'
                }
            }
        }
    },
    plugins: {
        legend: {
            display: false,
        },
        title: {
            display: true,
            text: 'Win % by Move Type',
            font: { size: 20 }
        }
    }
  }

  const processStreakData = (streaks) => {
    const counts = streaks.reduce((acc, length) => {
        acc[length] = (acc[length] || 0) + 1;
        return acc;
    }, {});
    const labels = Object.keys(counts).map(Number).sort((a,b) => a - b);
    const data = labels.map(label => counts[label]);
    return { labels, data };
  }

  const winStreakDistributionData = processStreakData(stats.winStreaks);
  const lossStreakDistributionData = processStreakData(stats.lossStreaks);

  const winStreakHistrogramData = {
    labels: winStreakDistributionData.labels,
    datasets: [{
        label: 'Frequency',
        data: winStreakDistributionData.data,
        backgroundColor: 'orange',
    }]
  }

  const lossStreakHistrogramData = {
    labels: lossStreakDistributionData.labels,
    datasets: [{
        label: 'Frequency',
        data: lossStreakDistributionData.data,
        backgroundColor: 'orange',
    }]
  }

  const streakHistrogramOptions = (title) => ({
    scales: {
        x: {
            grid: {
                offset: false
            },
            title: {
                display: true,
                text: title.includes('Win') ? 'Win Streak Length' : 'Loss Streak Length',
            }
        },
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Frequency',
            }
        }
    },
    plugins: {
        legend: { display: false },
        title: {
            display: true,
            text: title,
            font: { size: 20 }
        }
    },
    barPercentage: 0.5,
    categoryPercentage: 0.5,
  })


  const handleBuyCredits = async () => {
    setBuyLoading(true);
    try {
      console.log("Sending request to create checkout session...");
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: buyAmount, userId: user.uid }),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error response:", errorText);
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("API response data:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout session: No URL received");
      }
    } catch (err) {
      console.error("Error in handleBuyCredits:", err);
      alert("Error: " + err.message);
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
        {/* Left Column: Stats and Accuracy */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          <div className="bg-black bg-opacity-70 text-white p-6 rounded-lg">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="font-semibold text-lg">Credits: {credits}</span>
              <button
                className="btn btn-outline"
                onClick={() => setBuyModal(true)}
              >
                Buy Credits
              </button>
            </div>
            {buyModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white text-black p-6 rounded shadow flex flex-col gap-4 min-w-[300px]">
                  <h2 className="text-xl font-bold mb-2">Buy Credits</h2>
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
             <div className="flex flex-col gap-2 w-full text-lg">
                <div><span className="font-semibold">Email:</span> {user.email}</div>
                <div><span className="font-semibold">Correct Moves:</span> {stats.correctMoves}</div>
                <div><span className="font-semibold">Wrong Moves:</span> {stats.wrongMoves}</div>
                <div><span className="font-semibold">Hands Played:</span> {stats.handsPlayed}</div>
                <div><span className="font-semibold">Longest Win Streak:</span> {stats.longestWinStreak}</div>
                <div><span className="font-semibold">Longest Loss Streak:</span> {stats.longestLossStreak}</div>
            </div>
          </div>
          <div className="bg-black bg-opacity-70 text-white p-6 rounded-lg flex flex-col items-center justify-center">
            <div className="relative w-60 h-60">
              <Doughnut data={data} options={options} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">{accuracy}%</span>
                <span className="text-base">Accuracy</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Line Chart */}
        <div className="lg:w-2/3 bg-black bg-opacity-70 text-white p-6 rounded-lg flex flex-col gap-6">
          <Line data={lineChartData} options={lineChartOptions} />
          <Bar data={barChartData} options={barChartOptions} />
          <Bar data={winStreakHistrogramData} options={streakHistrogramOptions('Distribution of Win Streak Lengths')} />
          <Bar data={lossStreakHistrogramData} options={streakHistrogramOptions('Distribution of Loss Streak Lengths')} />
        </div>
      </div>
    </main>
  );
}
