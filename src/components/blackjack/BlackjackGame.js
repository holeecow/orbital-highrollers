"use client";
import { useState, useEffect, useRef } from "react";
import { useShoe } from "../hooks/Hook";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { StackedChips, getChipGroups } from "./Chips";

const { GetRecommendedPlayerAction } = require("blackjack-strategy");

function CardFace({ card }) {
  return (
    <img
      src={card.image}
      alt={`${card.value} of ${card.suit}`}
      className="w-16 h-24 rounded shadow card-animate"
    />
  );
}

function CardBack() {
  return (
    <img
      src="https://deckofcardsapi.com/static/img/back.png"
      className="w-16 h-24 rounded shadow bg-blue-700 border-2 border-white"
    />
  );
}

function ActionFeedback({ messages }) {
  return (
    <div className="fixed top-20 left-4 bg-black bg-opacity-70 text-white p-3 rounded max-w-xs text-sm">
      {messages.map((msg, index) => {
        const isWrong = msg.includes("wrong");
        return (
          <div
            key={index}
            className={isWrong ? "text-red-500" : "text-green-400"}
          >
            {msg}
          </div>
        );
      })}
    </div>
  );
}

function StatsTracker({ correct, wrong, hands, showZeroes }) {
  const totalMoves = correct + wrong;
  const score = totalMoves > 0 ? Math.round((correct / totalMoves) * 100) : 0;

  if (!showZeroes && totalMoves === 0 && hands === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-sm w-36">
        Loading stats...
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-sm w-36">
      <div>
        <span className="text-green-400">{correct}</span> CORRECT
      </div>
      <div>
        <span className="text-red-500">{wrong}</span> WRONG
      </div>
      <div>{score}% SCORE</div>
      <div>{hands} HANDS PLAYED</div>
    </div>
  );
}

// Function to calculate the number of points of the cards
function cardPoints(card) {
  const v = card.value; // "ACE", "7", "KING", …
  if (v === "ACE") return [1, 11];
  if (["KING", "QUEEN", "JACK"].includes(v)) return [10];
  return [Number(v)];
}

// Function to calculate the pip value of a card (For the sole purpose of passing into GetRecommendedPlayerAction function, under blackjack-strategy lib)
function pipValue(card) {
  if (card.value === "ACE") return 1; // treat Ace as 1 (soft logic is inside the lib)
  if (["KING", "QUEEN", "JACK"].includes(card.value)) return 10;
  return Number(card.value); // "2"-"10"
}

//Function to calculate the total points in the player's hand
/** Highest total ≤ 21, else the minimum total (bust). */
function handTotal(hand) {
  const totals = hand.reduce(
    (acc, card) => cardPoints(card).flatMap((p) => acc.map((t) => t + p)),
    [0]
  );
  const valid = totals.filter((t) => t <= 21);
  return valid.length ? Math.max(...valid) : Math.min(...totals); // bust
}

const stateOfGame = {
  hitSoft17: false, // Does dealer hit soft 17
  surrender: "none", // Surrender offered - none, late, or early
  double: "none", // Double rules - none, 10or11, 9or10or11, any
  doubleRange: [0, 21], // Range of values you can double,
  // if set supercedes double (v1.1 or higher)
  doubleAfterSplit: true, // Can double after split
  resplitAces: false, // Can you resplit aces
  offerInsurance: false, // Is insurance offered
  numberOfDecks: 6, // Number of decks in play
  maxSplitHands: 4, // Max number of hands you can have due to splits
  count: {
    // Structure defining the count (v1.3 or higher)
    system: null, // The count system - only "HiLo" is supported
    trueCount: null,
  }, // The TrueCount (count / number of decks left)
  strategyComplexity: "simple", // easy (v1.2 or higher), simple, advanced,
  // exactComposition, bjc-supereasy (v1.4 or higher),
  // bjc-simple (v1.4 or higher), or bjc-great
  // (v1.4 or higer) - see below for details
};

export default function BlackjackGame() {
  // State for controlling the Shoe
  const { drawCards, remaining, ready, newShoe } = useShoe();

  // State for controlling the player's hands (start with one hand)
  const [playerHands, setPlayerHands] = useState([[]]); // Array of hands
  const [currentHandIndex, setCurrentHandIndex] = useState(0); // Which hand is being played
  const [handBets, setHandBets] = useState([0]); // Array of bets for each hand
  const [hasSplit, setHasSplit] = useState(false); // Track if split has occurred

  // State for controlling the cards the dealer has
  const [dealer, setDealer] = useState([]);

  // State for the phase of the game: waiting | playing | dealer | finished
  const [phase, setPhase] = useState("waiting");

  // State for the results of each hand: win | lose | push
  const [results, setResults] = useState([]);

  // State for controlling whether it is the dealer's turn
  const [dealerTurn, setDealerTurn] = useState(false);

  // State for controlling the feedback and stats of the game
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [correctMoves, setCorrectMoves] = useState(0);
  const [wrongMoves, setWrongMoves] = useState(0);
  const [handsPlayed, setHandsPlayed] = useState(0);

  const [currentWinStreak, setCurrentWinStreak] = useState(0);
  const [currentLossStreak, setCurrentLossStreak] = useState(0);
  const [longestWinStreak, setLongestWinStreak] = useState(0);
  const [longestLossStreak, setLongestLossStreak] = useState(0);

  const [chipAnimations, setChipAnimations] = useState([]); // e.g., ["idle", "toPlayer", "toDealer"]
  const [animationShown, setAnimationShown] = useState(false);
  const [chipsMerged, setChipsMerged] = useState([]); // Track if payout chips have been merged

  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const [statsLoading, setStatsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [bet, setBet] = useState(0);
  const [prevBet, setPrevBet] = useState(0);
  const [betInput, setBetInput] = useState(1);
  const [betLocked, setBetLocked] = useState(false);
  const [mode, setMode] = useState(user ? "credit" : "practice");

  const [showTutorial, setShowTutorial] = useState(false);

  const [prevCredits, setPrevCredits] = useState(credits);
  const [creditChange, setCreditChange] = useState(null);

  useEffect(() => {
    // Only show tutorial if not seen in this session
    const seen = sessionStorage.getItem("blackjack_tutorial_seen");
    if (!seen) setShowTutorial(true);
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    sessionStorage.setItem("blackjack_tutorial_seen", "true");
  };

  // Effect to load stats for a logged-in user
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to be determined
    }

    if (!user) {
      // Not logged in, reset stats
      setCorrectMoves(0);
      setWrongMoves(0);
      setHandsPlayed(0);
      setStatsLoading(false);
      return;
    }

    // For a logged-in user, set up a real-time listener
    setStatsLoading(true);
    const statsRef = doc(db, "blackjackStats", user.uid);

    const unsubscribe = onSnapshot(
      statsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCorrectMoves(data.correctMoves || 0);
          setWrongMoves(data.wrongMoves || 0);
          setHandsPlayed(data.handsPlayed || 0);
          setCredits(data.credits || 0);
          setLongestWinStreak(data.longestWinStreak || 0);
          setLongestLossStreak(data.longestLossStreak || 0);
          // Current streaks are not persisted, so they reset on load
          setCurrentWinStreak(data.currentWinStreak || 0);
          setCurrentLossStreak(data.currentLossStreak || 0);
        } else {
          // New user for the game, stats are 0
          setCorrectMoves(0);
          setWrongMoves(0);
          setHandsPlayed(0);
          setCredits(0);
          setLongestWinStreak(0);
          setLongestLossStreak(0);
          setCurrentWinStreak(0);
          setCurrentLossStreak(0);
        }
        setStatsLoading(false); // Stats are loaded
      },
      (error) => {
        console.error("Error with snapshot listener:", error);
        setStatsLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [user, authLoading]);

  // Scenarios
  // 1. Dealer blackjack
  // 2. Player's first hand blackjacks
  // 3. Player's hand after split blackjacks

  // useEffect hook to handle the logic when it is the dealer's turn
  useEffect(() => {
    const runDealer = async () => {
      if (!dealerTurn || phase == "finished") return;

      let current = [...dealer];
      while (handTotal(current) < 17) {
        const [card] = await drawCards(1);
        current.push(card);
        setDealer([...current]);
        await new Promise((res) => setTimeout(res, 500)); // 500ms delay
      }
      // Evaluate each hand
      const newResults = playerHands.map((hand) => {
        const playerTotal = handTotal(hand);
        const dealerTotal = handTotal(current);
        if (playerTotal > 21) return "lose";
        if (
          (playerTotal == 21 && hand.length == 2) ||
          dealerTotal > 21 ||
          (playerTotal > dealerTotal && playerTotal < 22)
        )
          return "win";
        if (playerTotal == dealerTotal) return "push";
        return "lose";
      });
      setResults(newResults);
      setPhase("finished");
    };
    if (dealerTurn) {
      runDealer();
    }
  }, [dealerTurn]); // was [dealerTurn, dealer, playerHands, drawCards]

  useEffect(() => {
    if (handTotal(dealer) == 21 && dealer.length == 2) {
      // if dealer blackjacks
      setDealerTurn(true);
      return;
    } else {
      if (playerHands.length == 1) {
        if (handTotal(playerHands[0]) == 21 && playerHands[0].length == 2) {
          setResults(["win"]);
          setPhase("finished");
          setDealerTurn(true);

          return;
        }
        if (handTotal(playerHands[0]) > 21) {
          setResults(["lose"]);
          setPhase("finished");

          return;
        }
      } else {
        if (
          (handTotal(playerHands[currentHandIndex]) == 21 &&
            playerHands[currentHandIndex].length == 2) ||
          handTotal(playerHands[currentHandIndex]) > 21
        ) {
          if (currentHandIndex < playerHands.length - 1) {
            setCurrentHandIndex(currentHandIndex + 1);
          } else {
            setPhase("dealer");
            setDealerTurn(true);
          }
        }
      }
    }
  }, [dealer, playerHands, currentHandIndex, dealerTurn]);

  useEffect(() => {
    if (phase == "finished" && !animationShown) {
      setChipAnimations(
        results.map((result) =>
          result === "win"
            ? "toPlayer"
            : result === "lose"
            ? "toDealer"
            : "idle"
        )
      );
      setAnimationShown(true);
    } else if (phase !== "finished") {
      setChipAnimations([]); // Reset on new round
    }
  }, [phase, results, animationShown]);

  useEffect(() => {
    if (phase == "finished") {
      setHandsPlayed((h) => h + 1);
    }
  }, [phase]);

  useEffect(() => {
    // When mode changes after a game, clear animations to prevent re-playing
    if (phase === "finished") {
      setChipAnimations([]);
    }
  }, [mode]);

  const deal = async () => {
    if (remaining < 30) {
      await newShoe();
      setFeedbackMessages(["New shoe!"]);
      return;
    }
    if (!ready || betLocked) return;
    setAnimationShown(false);
    if (mode === "credit") {
      if (betInput < 1) {
        setFeedbackMessages(["Minimum bet is 1 credit."]);
        return;
      }
      if (betInput > credits) {
        setFeedbackMessages(["Not enough credits for this bet."]);
        return;
      }
    }
    setPlayerHands([[]]);
    setCurrentHandIndex(0);
    setHandBets([betInput]);
    setHasSplit(false);
    setDealer([]);
    setPhase("waiting");
    setResults([]);

    setDealerTurn(false);

    setFeedbackMessages([]);

    setBet(betInput);
    setPrevBet(betInput);
    setBetLocked(true);
    // Deduct bet from credits (credit mode only)
    if (mode === "credit" && user) {
      const userRef = doc(db, "blackjackStats", user.uid);
      await updateDoc(userRef, { credits: credits - betInput });
    }
    // Draw 4 cards, 2 for the player and 2 for dealer
    const cards = await drawCards(4);
    setPlayerHands([[]]);
    setDealer([]);

    // Show first player card
    setPlayerHands([[cards[0]]]);
    await new Promise((res) => setTimeout(res, 400));

    // Show first dealer card
    setDealer([cards[1]]);
    await new Promise((res) => setTimeout(res, 400));

    // Show second player card
    setPlayerHands([[cards[0], cards[2]]]);
    await new Promise((res) => setTimeout(res, 400));

    // Show second dealer card
    setDealer([cards[1], cards[3]]);
    setPhase("playing");
  };

  const canSplit = () => {
    const currentHand = playerHands[currentHandIndex];
    return (
      phase === "playing" &&
      currentHand.length === 2 &&
      pipValue(currentHand[0]) === pipValue(currentHand[1]) &&
      playerHands.length < 4 &&
      !hasSplit // Change depending if we want to allow for multiple splits
    );
  };

  const split = async () => {
    if (!canSplit()) return;
    const currentHand = playerHands[currentHandIndex];
    if (mode === "credit" && handBets[currentHandIndex] > credits) {
      setFeedbackMessages([
        "Not enough credits to split.",
        ...feedbackMessages,
      ]);
      return;
    }

    // Deduct additional bet for split (credit mode only)
    if (mode === "credit" && user) {
      const userRef = doc(db, "blackjackStats", user.uid);
      await updateDoc(userRef, {
        credits: credits - handBets[currentHandIndex],
      });
    }
    const playerValues = currentHand.map(pipValue);
    const dealerUpValue = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(
      playerValues,
      dealerUpValue,
      1,
      true,
      stateOfGame
    );
    const isCorrect = recommended === "split";
    const msg = `Dealer ${dealerUpValue}, Player ${handTotal(
      currentHand
    )}: Split (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);
    // Proceed with split logic
    const [card1, card2] = currentHand;
    const [card3, card4] = await drawCards(2);

    setPlayerHands((prevHands) => {
      const newHands = [...prevHands];
      // Remove the hand being split
      newHands.splice(currentHandIndex, 1, [card1, card3], [card2, card4]);
      return newHands;
    });
    setHandBets((prevBets) => {
      const newBets = [...prevBets];
      // Remove the bet for the hand being split, insert two bets
      newBets.splice(
        currentHandIndex,
        1,
        handBets[currentHandIndex],
        handBets[currentHandIndex]
      );
      return newBets;
    });
    setCurrentHandIndex(0);
    setHasSplit(true);
    // setResults([]);
  };

  const canDouble = () => {
    const currentHand = playerHands[currentHandIndex];
    return (
      phase === "playing" &&
      currentHand.length === 2 &&
      handTotal(currentHand) != 21
    ); // removed these 2 conditions: handTotal(currentHand) >= 9 && handTotal(currentHand) <= 11
  };

  const double = async () => {
    if (!canDouble()) return;
    const currentHand = playerHands[currentHandIndex];
    if (mode === "credit" && handBets[currentHandIndex] > credits) {
      setFeedbackMessages([
        "Not enough credits to double.",
        ...feedbackMessages,
      ]);
      return;
    }
    // Deduct additional bet (credit mode only)
    if (mode === "credit" && user) {
      const userRef = doc(db, "blackjackStats", user.uid);
      await updateDoc(userRef, {
        credits: credits - handBets[currentHandIndex],
      });
    }
    const playerValues = currentHand.map(pipValue);
    const dealerUpValue = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(
      playerValues,
      dealerUpValue,
      1,
      true,
      stateOfGame
    );
    const isCorrect = recommended === "double";
    const msg = `Dealer ${dealerUpValue}, Player ${handTotal(
      currentHand
    )}: Double (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) {
      setCorrectMoves((c) => c + 1);
    } else {
      setWrongMoves((w) => w + 1);
    }
    // Draw one card and finish this hand
    const [card] = await drawCards(1);
    setPlayerHands((prev) => {
      const newHands = [...prev];
      newHands[currentHandIndex] = [...newHands[currentHandIndex], card];
      return newHands;
    });
    setHandBets((prev) => {
      const newBets = [...prev];
      newBets[currentHandIndex] *= 2;
      return newBets;
    });
    // Move to next hand or dealer

    if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(currentHandIndex + 1);
    } else {
      setPhase("dealer");
      setDealerTurn(true);
    }
  };

  const hit = async () => {
    if (phase !== "playing") return;
    const currentHand = playerHands[currentHandIndex];
    const playerValues = currentHand.map(pipValue);
    const dealerUpValue = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(
      playerValues,
      dealerUpValue,
      1,
      true,
      stateOfGame
    );
    const isCorrect = recommended === "hit";
    const msg = `Dealer ${dealerUpValue}, Player ${handTotal(
      currentHand
    )}: Hit (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) {
      setCorrectMoves((c) => c + 1);
    } else {
      setWrongMoves((w) => w + 1);
    }
    const [card] = await drawCards(1);
    setPlayerHands((prev) => {
      const newHands = [...prev];
      newHands[currentHandIndex] = [...newHands[currentHandIndex], card];
      return newHands;
    });
    // if (handTotal(currentHand) < 22) {
    //   const [card] = await drawCards(1);
    //   setPlayerHands((prev) => {
    //     const newHands = [...prev];
    //     newHands[currentHandIndex] = [...newHands[currentHandIndex], card];
    //     return newHands;
    //   });
    // } else {
    //   // If bust, auto-stand or move to next hand if split
    //   if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
    //     setCurrentHandIndex(currentHandIndex + 1);
    //   } else {
    //     setPhase("dealer");
    //     setDealerTurn(true);
    //   }
    // }
  };

  const stand = () => {
    if (phase !== "playing") return;
    // Evaluate correctness
    const currentHand = playerHands[currentHandIndex];
    const playerVals = currentHand.map(pipValue);
    const dealerUpVal = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(
      playerVals,
      dealerUpVal,
      1,
      true,
      stateOfGame
    );
    const isCorrect = recommended === "stand";
    const msg = `Dealer ${dealerUpVal}, Player ${handTotal(
      currentHand
    )}: Stand (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) {
      setCorrectMoves((c) => c + 1);
    } else {
      setWrongMoves((w) => w + 1);
    }
    // If stand, move to next hand, else dealer's turn
    if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(currentHandIndex + 1);
    } else {
      setPhase("dealer");
      setDealerTurn(true);
    }
  };

  // Update credits after win/lose/push
  useEffect(() => {
    if (phase == "finished") {
      if (!user || results.length === 0) {
        setBetLocked(false);
        return;
      }
      if (mode !== "credit") {
        setBetLocked(false);
        return;
      }
      let payout = 0;
      let roundWon = false;
      let roundLost = false;

      results.forEach((result, i) => {
        const b = handBets[i];
        if (result === "win") {
          roundWon = true;
          if (handTotal(playerHands[i]) == 21 && playerHands[i].length == 2) {
            payout += b * 2 + b;
          } else {
            payout += b * 2;
          }
        } else if (result === "push") {
          payout += b;
        } else if (result === "lose") {
          roundLost = true;
        }
        // lose: no payout
      });

      let newCurrentWinStreak = currentWinStreak;
      let newCurrentLossStreak = currentLossStreak;
      let newLongestWinStreak = longestWinStreak;
      let newLongestLossStreak = longestLossStreak;

      if (roundWon && !roundLost) { // Pure win
        newCurrentWinStreak++;
        newCurrentLossStreak = 0;
        if (newCurrentWinStreak > newLongestWinStreak) {
          newLongestWinStreak = newCurrentWinStreak;
        }
      } else if (roundLost && !roundWon) { // Pure loss
        newCurrentLossStreak++;
        newCurrentWinStreak = 0;
        if (newCurrentLossStreak > newLongestLossStreak) {
          newLongestLossStreak = newCurrentLossStreak;
        }
      } else { // Push or mixed results (e.g., win one hand, lose another)
        newCurrentWinStreak = 0;
        newCurrentLossStreak = 0;
      }

      setCurrentWinStreak(newCurrentWinStreak);
      setCurrentLossStreak(newCurrentLossStreak);
      setLongestWinStreak(newLongestWinStreak);
      setLongestLossStreak(newLongestLossStreak);

      const userRef = doc(db, "blackjackStats", user.uid);
      updateDoc(userRef, {
        credits: credits + payout,
        correctMoves,
        wrongMoves,
        handsPlayed,
        longestWinStreak: newLongestWinStreak,
        longestLossStreak: newLongestLossStreak,
        currentWinStreak: newCurrentWinStreak,
        currentLossStreak: newCurrentLossStreak,
      });

      setBetLocked(false);
    } else {
      return;
    }
  }, [phase]);

  useEffect(() => {
    if (credits !== prevCredits) {
      const diff = credits - prevCredits;
      if (diff !== 0) {
        setCreditChange(diff > 0 ? `+${diff}` : `${diff}`);
        setTimeout(() => setCreditChange(null), 1200); // Show for 1.2s
      }
      setPrevCredits(credits);
    }
  }, [credits, prevCredits]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 pb-24 min-h-[700px] w-full max-w-2xl flex flex-col items-center gap-6 relative">
      {/* Show Tutorial Button */}
      <button
        className="absolute top-4 right-4 bg-gray-200 text-black w-10 h-10 flex items-center justify-center rounded-full text-sm shadow hover:bg-gray-300 z-50 cursor-pointer"
        onClick={() => setShowTutorial(true)}
        type="button"
      >
        ?
      </button>
      <div className="flex items-center justify-center bg-gray-200 rounded-full p-1 border-2 border-gray-300 w-full max-w-xs">
        <button
          className={`w-1/2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer ${
            mode === "practice"
              ? "bg-white text-blue-600 shadow-sm"
              : "bg-transparent text-gray-500"
          } disabled:text-gray-400 disabled:cursor-not-allowed`}
          onClick={() => setMode("practice")}
          disabled={phase === "playing" || phase === "dealer"}
        >
          Practice
        </button>
        <button
          className={`w-1/2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer ${
            mode === "credit"
              ? "bg-white text-green-600 shadow-sm"
              : "bg-transparent text-gray-500"
          } disabled:text-gray-400 disabled:cursor-not-allowed`}
          onClick={() => setMode("credit")}
          disabled={!user || phase === "playing" || phase === "dealer"}
        >
          Credit
        </button>
      </div>
      {mode === "credit" && (
        <div className="flex items-center gap-4 mb-2">
          <span className="font-semibold text-black">Credits: {credits}</span>
          <span
            className={`block text-lg font-bold transition-opacity duration-200 w-14 text-center ${
              creditChange
                ? creditChange.startsWith("+")
                  ? "text-green-500 opacity-100 animate-fade-move-up"
                  : "text-red-500 opacity-100 animate-fade-move-up"
                : "opacity-0"
            }`}
            style={{ minHeight: "1.5rem" }}
          >
            {creditChange || "0"}
          </span>
          <input
            type="number"
            min={1}
            max={credits}
            value={betInput}
            onChange={(e) => setBetInput(Number(e.target.value))}
            disabled={phase === "playing" || betLocked}
            className="border rounded p-2 w-24 text-black"
          />
          <button
            className="btn  text-white"
            onClick={() => setBetInput(prevBet)}
            disabled={phase === "playing" || betLocked}
          >
            Use Previous Bet
          </button>
        </div>
      )}
      {showTutorial && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 pointer-events-none backdrop-blur-sm">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-2xl text-black pointer-events-auto flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">How to Play Blackjack</h2>
            <ul className="mb-6 list-disc pl-6 space-y-2 text-left">
              <li>
                <b>Hit</b>: Take another card to try to get closer to 21.
              </li>
              <li>
                <b>Stand</b>: Keep your current hand and end your turn.
              </li>
              <li>
                <b>Double</b>: Double your bet, take one more card, and end your
                turn.
              </li>
              <li>
                <b>Split</b>: If you have two cards of the same value, split
                them into two hands.
              </li>
            </ul>
            <button
              className="btn  text-white px-6 py-2 rounded mb-3"
              onClick={handleCloseTutorial}
            >
              Got it!
            </button>
            <Link href="/strategies" legacyBehavior>
              <a className="underline text-blue-600 hover:text-blue-800 mt-2 cursor-pointer text-base text-center block">
                Read More
              </a>
            </Link>
          </div>
        </div>
      )}
      <ActionFeedback messages={feedbackMessages} />
      <StatsTracker
        correct={correctMoves}
        wrong={wrongMoves}
        hands={handsPlayed}
        showZeroes={!user || !statsLoading}
      />
      <h1 className="text-3xl font-bold text-black">Blackjack</h1>
      <p className="mt-2  text-black">
        Dealer:{" "}
        {phase === "waiting"
          ? 0
          : dealerTurn || phase == "finished"
          ? handTotal(dealer)
          : handTotal(dealer.slice(0, 1)) || 0}
      </p>
      {/* dealer */}
      <section className="flex gap-2 relative">
        {dealer.map((c, i) => {
          const hideCard = phase === "playing" && i === 1;
          return hideCard ? ( // was !dealerTurn && i === 1
            <CardBack key="hole" />
          ) : (
            <CardFace key={c.code + Math.random()} card={c} />
          );
        })}
        {/* Dealer payout chips animation (only on win, only during animation) */}
        {mode == "credit" &&
          phase === "finished" &&
          results.map((result, index) =>
            result === "win" && !chipsMerged[index] ? (
              <div
                key={index}
                className="absolute -top-16 left-1/2 -translate-x-1/2 animate-chip-from-dealer flex gap-2"
                style={{ pointerEvents: "none" }}
              >
                {getChipGroups(handBets[index] || 0).map((chip, idx) => (
                  <StackedChips
                    key={idx}
                    value={chip.value}
                    color={chip.color}
                    count={chip.count}
                  />
                ))}
              </div>
            ) : null
          )}
      </section>
      {/* player hands */}
      <div className="flex flex-col gap-4">
        {playerHands.map((hand, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${
              index === currentHandIndex
                ? "border-2 border-blue-500 p-2 rounded"
                : ""
            }`}
          >
            <section className="flex gap-2">
              {hand.map((c) => (
                <CardFace key={c.code + Math.random()} card={c} />
              ))}
            </section>
            {/* Stacked chips for this hand's bet */}
            {mode == "credit" && (
              <div className="flex gap-2 mt-2">
                {getChipGroups(handBets[index] || 0).map((chip, idx) => {
                  let animationClass = "";
                  if (chipAnimations[index] === "toPlayer") {
                    animationClass = "animate-chip-to-player";
                  } else if (chipAnimations[index] === "toDealer") {
                    animationClass = "animate-chip-to-dealer";
                  }
                  return (
                    <div key={idx} className={animationClass}>
                      <StackedChips
                        value={chip.value}
                        color={chip.color}
                        count={chip.count}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <p className=" text-black">
              {mode === "credit"
                ? `Hand ${index + 1}: ${handTotal(hand) || 0} (Bet: $${
                    handBets[index]
                  })`
                : `Hand ${index + 1}: ${handTotal(hand) || 0}`}
            </p>
          </div>
        ))}
      </div>

      {phase == "finished" && (
        <div className="flex flex-col items-center gap-2">
          {results.map((result, index) => (
            <p key={index} className="text-xl font-bold text-black">
              Hand {index + 1}: {result === "win" && "You win! 🎉"}
              {result === "lose" && "You lose 😢"}
              {result === "push" && "Push – tie."}
            </p>
          ))}
        </div>
      )}
      {/* controls */}
      <div
        className={phase == "playing" ? "flex gap-4" : "flex justify-center"}
      >
        <button className="btn" onClick={deal} disabled={statsLoading}>
          {statsLoading ? "Loading..." : "Deal"}
        </button>
        {phase == "playing" && (
          <>
            <button className="btn" onClick={hit}>
              Hit
            </button>
            <button className="btn" onClick={stand}>
              Stand
            </button>
            {canDouble() && (
              <button className="btn" onClick={double}>
                Double
              </button>
            )}
            {canSplit() && (
              <button className="btn" onClick={split}>
                Split
              </button>
            )}
          </>
        )}
      </div>
      {/* For debugging*/}
      {/* <p className="text-black">{phase}</p> */}
      <p className="text-sm text-gray-400">Cards left in shoe: {remaining}</p>
    </div>
  );
}
