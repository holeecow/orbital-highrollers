"use client";
import { useState, useEffect, useRef } from "react";
import { useShoe } from "../hooks/Hook";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

const { GetRecommendedPlayerAction } = require("blackjack-strategy");

function CardFace({ card }) {
  return (
    <img
      src={card.image}
      alt={`${card.value} of ${card.suit}`}
      className="w-16 h-24 rounded shadow"
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
    <div className="fixed top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded max-w-xs text-sm">
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
  hitSoft17: true, // Does dealer hit soft 17
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
  const { drawCards, ready, remaining } = useShoe();

  // State for controlling the player's hands (start with one hand)
  const [playerHands, setPlayerHands] = useState([[]]); // Array of hands
  const [currentHandIndex, setCurrentHandIndex] = useState(0); // Which hand is being played
  const [handBets, setHandBets] = useState([10]); // Array of bets for each hand
  const [hasSplit, setHasSplit] = useState(false); // Track if split has occurred

  // State for controlling the cards the dealer has
  const [dealer, setDealer] = useState([]);

  // State for the phase of the game: waiting | playing | finished
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

  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const [statsLoading, setStatsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [bet, setBet] = useState(10);
  const [prevBet, setPrevBet] = useState(10);
  const [betInput, setBetInput] = useState(10);
  const [betLocked, setBetLocked] = useState(false);
  const [mode, setMode] = useState(user ? "credit" : "practice");

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
        } else {
          // New user for the game, stats are 0
          setCorrectMoves(0);
          setWrongMoves(0);
          setHandsPlayed(0);
          setCredits(0);
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

  // useEffect hook to handle the logic when it is the dealer's turn
  useEffect(() => {
    const runDealer = async () => {
      if (!dealerTurn) return;
      let current = [...dealer];
      while (handTotal(current) < 17) {
        const [card] = await drawCards(1);
        current.push(card);
        setDealer([...current]);
      }
      // Evaluate each hand
      const newResults = playerHands.map((hand) => {
        const playerTotal = handTotal(hand);
        const dealerTotal = handTotal(current);
        if (dealerTotal > 21 || (playerTotal > dealerTotal && playerTotal < 22))
          return "win";
        if (playerTotal == dealerTotal) return "push";
        return "lose";
      });
      setResults(newResults);
      setPhase("finished");
      setDealerTurn(false);
    };
    if (dealerTurn) {
      runDealer();
    }
  }, [dealerTurn, dealer, playerHands, drawCards]);

  useEffect(() => {
    // If any hand is blackjack, win immediately
    if (
      handTotal(playerHands[currentHandIndex]) === 21 &&
      playerHands[currentHandIndex].length === 2
    ) {
      setResults(["win"]);
      setPhase("finished");
      setDealerTurn(false);
    } else if (
      handTotal(playerHands[currentHandIndex]) > 21 ||
      (handTotal(dealer) === 21 && dealer.length === 2)
    ) {
      setResults(["lose"]);
      setPhase("finished");
      setDealerTurn(false);
    }
  }, [playerHands, dealer]);

  useEffect(() => {
    if (phase === "finished") {
      setHandsPlayed((h) => h + 1);
    }
  }, [phase]);

  const deal = async () => {
    if (!ready || betLocked) return;
    if (mode === "credit") {
      if (betInput > credits) {
        setFeedbackMessages(["Not enough credits for this bet."]);
        return;
      }
    }
    setFeedbackMessages([]);
    setResults([]);
    setPlayerHands([[]]);
    setHandBets([betInput]);
    setCurrentHandIndex(0);
    setHasSplit(false);
    setDealer([]);
    setPhase("waiting");
    setPrevBet(betInput);
    setBet(betInput);
    setBetLocked(true);
    // Deduct bet from credits (credit mode only)
    if (mode === "credit" && user) {
      const userRef = doc(db, "blackjackStats", user.uid);
      await updateDoc(userRef, { credits: credits - betInput });
    }
    // Draw 4 cards, 2 for the player and 2 for dealer
    const cards = await drawCards(4);
    setPlayerHands([[cards[0], cards[2]]]);
    setDealer([cards[1], cards[3]]);
    setPhase("playing");
    setDealerTurn(false);
  };

  const canSplit = () => {
    const currentHand = playerHands[currentHandIndex];
    return (
      phase === "playing" &&
      currentHand.length === 2 &&
      currentHand[0].value === currentHand[1].value &&
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
    const newHands = [[card1], [card2]];
    const [card3, card4] = await drawCards(2);
    newHands[0].push(card3);
    newHands[1].push(card4);
    setPlayerHands(newHands);
    setHandBets([handBets[currentHandIndex], handBets[currentHandIndex]]);
    setCurrentHandIndex(0);
    setHasSplit(true);
    setResults([]);
  };

  const canDouble = () => {
    const currentHand = playerHands[currentHandIndex];
    return (
      phase === "playing" &&
      currentHand.length === 2 &&
      handTotal(currentHand) >= 9 &&
      handTotal(currentHand) <= 11
    );
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
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);
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
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);
    if (handTotal(currentHand) < 22) {
      const [card] = await drawCards(1);
      setPlayerHands((prev) => {
        const newHands = [...prev];
        newHands[currentHandIndex] = [...newHands[currentHandIndex], card];
        return newHands;
      });
    } else {
      // If bust, auto-stand or move to next hand if split
      if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
        setCurrentHandIndex(currentHandIndex + 1);
      } else {
        setPhase("finished");
        setDealerTurn(true);
      }
    }
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
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);
    // If split, move to next hand, else dealer's turn
    if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(currentHandIndex + 1);
    } else {
      setDealerTurn(true);
    }
  };

  // Update credits after win/lose/push
  useEffect(() => {
    if (!user || results.length === 0) {
      setBetLocked(false);
      return;
    }
    if (mode !== "credit") {
      setBetLocked(false);
      return;
    }
    let payout = 0;
    results.forEach((result, i) => {
      const b = handBets[i];
      if (result === "win") payout += b * 2;
      else if (result === "push") payout += b;
      // lose: no payout
    });
    if (payout > 0) {
      const userRef = doc(db, "blackjackStats", user.uid);
      updateDoc(userRef, {
        credits: credits + payout,
        correctMoves,
        wrongMoves,
        handsPlayed,
      });
    }
    setBetLocked(false);
  }, [results]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="flex gap-4 mb-2">
        <button
          className={`btn ${mode === "practice" ? " text-black" : ""}`}
          onClick={() => setMode("practice")}
          disabled={mode === "practice"}
        >
          Practice
        </button>
        <button
          className={`btn ${
            mode === "credit" ? "bg-green-600 text-black" : ""
          }`}
          onClick={() => setMode("credit")}
          disabled={!user || mode === "credit"}
        >
          Credit
        </button>
      </div>
      {mode === "credit" && (
        <div className="flex items-center gap-4 mb-2">
          <span className="font-semibold text-black">Credits: {credits}</span>
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
          : phase === "finished"
          ? handTotal(dealer)
          : handTotal(dealer.slice(0, 1)) || 0}
      </p>
      {/* dealer */}
      <section className="flex gap-2">
        {dealer.map((c, i) => {
          const hideCard = phase === "playing" && i === 1;
          return hideCard ? (
            <CardBack key="hole" />
          ) : (
            <CardFace key={c.code + Math.random()} card={c} />
          );
        })}
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
            <p className=" text-black">
              {mode === "credit"
                ? `Hand ${index + 1}: ${handTotal(hand) || 0} (Bet: ${
                    handBets[index]
                  })`
                : `Hand ${index + 1}: ${handTotal(hand) || 0}`}
            </p>
          </div>
        ))}
      </div>

      {phase === "finished" && (
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
        className={phase === "playing" ? "flex gap-4" : "flex justify-center"}
      >
        <button className="btn" onClick={deal} disabled={statsLoading}>
          {statsLoading ? "Loading..." : "Deal"}
        </button>
        {phase === "playing" && (
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
      <p className="text-black">{phase}</p>
      <p className="text-sm text-gray-400">Cards left in shoe: {remaining}</p>
    </main>
  );
}
