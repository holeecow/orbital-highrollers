"use client";
import { useState, useEffect, useRef } from "react";
import { useShoe } from "../hooks/Hook";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import Chip from "./Chip";
import ChipStack from "./ChipStack";

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
    <div className="fixed top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded max-w-xs text-sm z-30">
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

function StatsTracker({ correct, wrong, hands, showZeroes, credits, mode }) {
  const totalMoves = correct + wrong;
  const score = totalMoves > 0 ? Math.round((correct / totalMoves) * 100) : 0;

  if (!showZeroes && totalMoves === 0 && hands === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-sm w-48 z-30">
        Loading stats...
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-sm w-48 z-30">
      {mode === "credit" && <div className="font-bold text-lg text-yellow-400">Credits: ${credits}</div>}
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
  const [handBets, setHandBets] = useState([10]); // Array of bets for each hand
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

  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const [statsLoading, setStatsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [bet, setBet] = useState(0);
  const [placedBet, setPlacedBet] = useState(0);
  const [visualBetChips, setVisualBetChips] = useState([]); // To animate chips
  const [chipAnimation, setChipAnimation] = useState(''); // 'win', 'lose', 'push'
  const [prevBet, setPrevBet] = useState(10);
  const [betLocked, setBetLocked] = useState(false);
  const [mode, setMode] = useState(user ? "credit" : "practice");
  const betAreaRef = useRef(null);

  // Animation effect for win/loss/push
  useEffect(() => {
    if (phase === 'finished' && mode === 'credit' && placedBet > 0) {
      let totalWinnings = 0;
      let animationType = '';
      
      const newPlayerHands = [...playerHands];
      results.forEach((result, index) => {
        const hand = newPlayerHands[index];
        if (handTotal(hand) === 21 && hand.length === 2 && newPlayerHands.length === 1 && handBets[index] > 0) {
            totalWinnings += handBets[index] * 1.5; // Blackjack pays 3:2
        } else if (result === 'win') {
            totalWinnings += handBets[index];
        } else if (result === 'lose') {
            totalWinnings -= handBets[index];
        }
      });

      if (totalWinnings > 0) animationType = 'win';
      else if (totalWinnings < 0) animationType = 'lose';
      else animationType = 'push';
      
      setChipAnimation(animationType);
      
      const timer = setTimeout(() => {
        setCredits(current => current + placedBet + totalWinnings);
        setChipAnimation('');
        setVisualBetChips([]); 
        setPlacedBet(0);
      }, 1500); // Animation duration

      return () => clearTimeout(timer);
    }
  }, [phase, results]);


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
      setMode("practice");
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
          (handTotal(hand) === 21 && hand.length === 2 && playerHands.length === 1) ||
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
  }, [dealerTurn]);

  // Auto-stand/next-hand logic
  useEffect(() => {
    if (phase !== 'playing') return;

    const currentHand = playerHands[currentHandIndex];
    if (handTotal(currentHand) >= 21) {
        if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
            setTimeout(() => setCurrentHandIndex(currentHandIndex + 1), 500);
        } else {
            setTimeout(() => setDealerTurn(true), 500);
        }
    }
  }, [playerHands, currentHandIndex, phase]);


  useEffect(() => {
    if (phase == "finished") {
      setHandsPlayed((h) => h + 1);
    }
  }, [phase]);

  useEffect(() => {
    if (mode === "practice") {
      setBet(10);
      setHandBets([10]);
    } else {
      setBet(0);
      setHandBets([]);
    }
  }, [mode]);

  const deal = async () => {
    if (remaining < 30) {
      await newShoe();
      setFeedbackMessages(["New shoe!"]);
      return;
    }
    if (!ready || betLocked) return;
    if (mode === "credit") {
        if (bet === 0) {
            alert("Please place a bet.");
            return;
        }
        if (bet > credits) {
            alert("You don't have enough credits for this bet.");
            return;
        }
        setCredits(c => c - bet);
    }
    setPlacedBet(bet);
    setHandBets([bet]);
    setBetLocked(true);
    setPrevBet(bet);

    setPhase("dealing");
    setResults([]);
    setPlayerHands([[]]);
    setDealer([]);
    setCurrentHandIndex(0);
    setHasSplit(false);
    setFeedbackMessages([]);

    const cards = await drawCards(4);
    
    // Animate dealing
    setPlayerHands([[cards[0]]]);
    await new Promise((res) => setTimeout(res, 400));
    setDealer([cards[1]]);
    await new Promise((res) => setTimeout(res, 400));
    setPlayerHands([[cards[0], cards[2]]]);
    await new Promise((res) => setTimeout(res, 400));
    setDealer([cards[1], cards[3]]);
    await new Promise((res) => setTimeout(res, 400));

    const finalPlayerHand = [cards[0], cards[2]];
    const finalDealerHand = [cards[1], cards[3]];

    if (handTotal(finalDealerHand) === 21) {
      setDealerTurn(true); 
    } else if (handTotal(finalPlayerHand) === 21) {
      setDealerTurn(true);
    }

    setPhase("playing");
  };

  const canSplit = () => {
    const currentHand = playerHands[currentHandIndex];
    return (
      phase === "playing" &&
      currentHand.length === 2 &&
      pipValue(currentHand[0]) === pipValue(currentHand[1]) &&
      playerHands.length < 4 &&
      !hasSplit &&
      credits >= handBets[currentHandIndex]
    );
  };

  const split = async () => {
    if (!canSplit()) return;
    const currentHand = playerHands[currentHandIndex];
    
    setCredits(c => c - handBets[currentHandIndex]);

    const playerValues = currentHand.map(pipValue);
    const dealerUpValue = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(playerValues, dealerUpValue, 1, true, stateOfGame);
    const isCorrect = recommended === "split";
    const msg = `Dealer ${dealerUpValue}, Player ${handTotal(currentHand)}: Split (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);
    
    const [card1, card2] = currentHand;
    const [card3, card4] = await drawCards(2);

    setPlayerHands((prevHands) => {
      const newHands = [...prevHands];
      newHands.splice(currentHandIndex, 1, [card1, card3], [card2, card4]);
      return newHands;
    });
    setHandBets((prevBets) => {
      const newBets = [...prevBets];
      newBets.splice(currentHandIndex, 1, handBets[currentHandIndex], handBets[currentHandIndex]);
      return newBets;
    });
    setHasSplit(true);
  };

  const canDouble = () => {
    const currentHand = playerHands[currentHandIndex];
    return (
      phase === "playing" &&
      currentHand.length === 2 &&
      credits >= handBets[currentHandIndex]
    );
  };

  const double = async () => {
    if (!canDouble()) return;
    
    setCredits(c => c - handBets[currentHandIndex]);

    const currentHand = playerHands[currentHandIndex];
    const playerValues = currentHand.map(pipValue);
    const dealerUpValue = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(playerValues, dealerUpValue, 1, true, stateOfGame);
    const isCorrect = recommended === "double";
    const msg = `Dealer ${dealerUpValue}, Player ${handTotal(currentHand)}: Double (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);
    
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
    
    if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(currentHandIndex + 1);
    } else {
      setTimeout(() => setDealerTurn(true), 500);
    }
  };

  const hit = async () => {
    if (phase !== "playing") return;
    const currentHand = playerHands[currentHandIndex];
    const playerValues = currentHand.map(pipValue);
    const dealerUpValue = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(playerValues, dealerUpValue, 1, true, stateOfGame);
    const isCorrect = recommended === "hit";
    const msg = `Dealer ${dealerUpValue}, Player ${handTotal(currentHand)}: Hit (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);

    const [card] = await drawCards(1);
    setPlayerHands((prev) => {
      const newHands = [...prev];
      newHands[currentHandIndex] = [...newHands[currentHandIndex], card];
      return newHands;
    });
  };

  const stand = () => {
    if (phase !== "playing") return;
    const currentHand = playerHands[currentHandIndex];
    const playerVals = currentHand.map(pipValue);
    const dealerUpVal = dealer[0] ? pipValue(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(playerVals, dealerUpVal, 1, true, stateOfGame);
    const isCorrect = recommended === "stand";
    const msg = `Dealer ${dealerUpVal}, Player ${handTotal(currentHand)}: Stand (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    setFeedbackMessages((prev) => [msg, ...prev]);
    if (isCorrect) setCorrectMoves((c) => c + 1);
    else setWrongMoves((w) => w + 1);
    
    if (playerHands.length > 1 && currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(currentHandIndex + 1);
    } else {
      setDealerTurn(true);
    }
  };

  useEffect(() => {
    if (phase == "finished" && user && mode === 'credit') {
        const userRef = doc(db, "blackjackStats", user.uid);
        updateDoc(userRef, { 
            correctMoves,
            wrongMoves,
            handsPlayed,
            credits
         });
    }
  }, [phase, correctMoves, wrongMoves, handsPlayed, credits]);


  const resetHand = () => {
    setPhase("waiting");
    setPlayerHands([[]]);
    setDealer([]);
    setResults([]);
    setCurrentHandIndex(0);
    setHasSplit(false);
    setFeedbackMessages([]);
    setBetLocked(false);
    if (mode === "credit") {
        setPlacedBet(0);
        setVisualBetChips([]);
    }
  };

  const handleBetClick = (amount) => {
    if (phase !== 'waiting') return;
    const newBet = bet + amount;
    if (newBet > credits) {
        alert("Not enough credits!");
        return;
    }
    setBet(newBet);
    const newChip = {
        value: amount,
        id: Math.random(),
        top: `${Math.random() * 20}px`, 
        left: `${(visualBetChips.length % 5) * 5 - 10}px`,
    };
    setVisualBetChips(prev => [...prev, newChip]);
  };

  const clearBet = () => {
    if (phase !== 'waiting') return;
    setBet(0);
    setVisualBetChips([]);
  };
  
  const rebet = () => {
    if (phase !== 'waiting' || prevBet === 0 || bet > 0) return;
    if (prevBet > credits) {
        alert("Not enough credits to place your previous bet!");
        return;
    }
    setBet(prevBet);
    
    const chipsToShow = [];
    let tempBet = prevBet;
    const denominations = [100, 25, 10, 5, 1];
    denominations.forEach(val => {
        const count = Math.floor(tempBet / val);
        for (let i=0; i < count; i++) {
            chipsToShow.push({
                value: val,
                id: Math.random(),
                top: `${Math.random() * 20}px`,
                left: `${(chipsToShow.length % 5) * 5 - 10}px`,
            });
        }
        tempBet %= val;
    });
    setVisualBetChips(chipsToShow);
  }

  const handleModeToggle = (e) => {
    const newMode = e.target.checked ? "credit" : "practice";
    if (newMode === "credit" && !user) {
      alert("You must be logged in to play with credits.");
      e.target.checked = false; // Revert toggle
      return;
    }
    setMode(newMode);
  };

  const showStatsZeroes = !statsLoading && (correctMoves > 0 || wrongMoves > 0 || handsPlayed > 0 || mode === 'credit');

  const isCurrentHand = (index) => {
    return index === currentHandIndex && phase === 'playing';
  };

  return (
    <>
      <style>{`
        .chip-bet-area .visual-chip {
          transition: all 1s ease-in-out;
          position: absolute;
        }
        .chip-bet-area.win .visual-chip {
          transform: translateY(30vh) scale(0.7);
          opacity: 0;
        }
        .chip-bet-area.lose .visual-chip {
          transform: translateY(-50vh) scale(0.5);
          opacity: 0;
        }
        .chip-bet-area.push .visual-chip {
          transform: translateY(30vh) scale(0.7);
          opacity: 0;
        }
      `}</style>
      <div
        className="relative w-full min-h-screen bg-cover bg-center p-4 flex flex-col items-center justify-center"
        style={{ backgroundImage: "url('/blackjack_table.jpeg')" }}
      >
        <ActionFeedback messages={feedbackMessages} />
        <StatsTracker
            correct={correctMoves}
            wrong={wrongMoves}
            hands={handsPlayed}
            showZeroes={showStatsZeroes}
            credits={credits}
            mode={mode}
        />
        <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-6xl flex flex-col relative" style={{ minHeight: '85vh' }}>
            <div className="absolute top-4 left-4 z-20">
                {/* Mode Toggle Switch */}
                <div className="flex items-center justify-center bg-gray-200 rounded-full p-1 border-2 border-gray-300">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={mode === 'credit'} onChange={handleModeToggle} className="sr-only peer" disabled={!user} />
                        <div className="w-28 h-8 bg-gray-400 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:bg-green-600"></div>
                        <span className={`absolute left-1 top-1 w-12 h-6 flex items-center justify-center text-xs font-bold text-white bg-gray-600 rounded-full transition-transform duration-300 ${mode === 'credit' ? 'transform translate-x-14 bg-green-800' : 'bg-blue-600'}`}>
                            {mode === 'credit' ? 'CREDIT' : 'PRACTICE'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-grow flex flex-col text-black">
                {/* Top Section: Dealer and Deck */}
                <div className="w-full max-w-4xl mx-auto grid grid-cols-3 gap-4 items-center justify-items-center h-40">
                    <div className="w-full flex justify-center items-center">
                        <div className="relative w-32 h-40">
                            <CardBack />
                            <div className="absolute top-1 left-1" style={{ zIndex: -1 }}><CardBack /></div>
                            <p className="absolute -bottom-6 text-center w-full font-bold">{remaining}/{6*52}</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold">Blackjack</h1>
                        {dealer.length > 0 && phase !== "waiting" && <p className="font-bold text-xl mt-2">Dealer: {phase !== "playing" ? handTotal(dealer) : "?"}</p>}
                    </div>
                    <div className="flex justify-center items-center space-x-2 min-w-[150px]">
                        {dealer.map((card, index) => (
                            <div key={index}>
                                {phase !== "playing" || index !== 1 ? <CardFace card={card} /> : <CardBack />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle Section: Betting and Player Hands */}
                <div className="flex-grow flex flex-col justify-center">
                    {mode === 'credit' && (
                        <div ref={betAreaRef} className="relative h-28 w-full flex justify-center items-center">
                            <div className={`chip-bet-area ${chipAnimation}`}>
                                {visualBetChips.map((chip) => (
                                    <div key={chip.id} className="visual-chip" style={{ top: chip.top, left: `calc(50% + ${chip.left}px)`}}>
                                        <Chip value={chip.value} />
                                    </div>
                                ))}
                            </div>
                            {placedBet > 0 && phase !== 'finished' && (
                                <div className="absolute bottom-0 text-center">
                                    <p className="font-bold text-xl text-yellow-600">Bet: ${placedBet}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center justify-center min-h-[150px]">
                        {playerHands.map((hand, index) => (
                            <div key={index} className={`flex flex-col items-center p-2 rounded ${isCurrentHand(index) ? "border-4 border-blue-500" : "border-4 border-transparent"}`}>
                                <div className="relative">
                                    {results[index] && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
                                            <p className={`font-bold text-2xl px-4 py-1 rounded-full text-white ${results[index] === 'win' ? 'bg-green-600' : results[index] === 'lose' ? 'bg-red-600' : 'bg-gray-500'}`}>
                                                {results[index].toUpperCase()}
                                                {mode === 'credit' && results[index] === 'win' && ` $${handBets[index] * (handTotal(hand) === 21 && hand.length === 2 ? 2.5 : 2)}`}
                                                {mode === 'credit' && results[index] === 'lose' && ` -$${handBets[index]}`}
                                            </p>
                                        </div>
                                    )}
                                    <section className="flex justify-center gap-2">
                                        {hand.map(c => <CardFace key={c.code + Math.random()} card={c} />)}
                                    </section>
                                </div>
                                <p className="font-bold text-xl mt-2">{isCurrentHand(index) && "Your Turn -> "}Total: {handTotal(hand)}</p>
                                {mode === 'credit' && handBets[index] > 0 && <p className="font-bold text-lg text-yellow-600">Bet: ${handBets[index]}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Player Controls */}
                <div className="w-full h-48 flex-shrink-0">
                    {phase === "waiting" ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-2">
                            {mode === "credit" ? (
                                <>
                                    <div className="text-black font-bold text-2xl">Place Your Bet</div>
                                    <div className="text-yellow-600 font-bold text-4xl">${bet}</div>
                                    <div className="flex justify-center space-x-2">
                                        {[5, 10, 25, 100].map(val => <Chip key={val} value={val} onClick={() => handleBetClick(val)} />)}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={deal} disabled={bet === 0} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-xl hover:bg-green-700 disabled:bg-gray-500">Deal</button>
                                        <button onClick={clearBet} disabled={bet === 0} className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-xl hover:bg-red-700 disabled:bg-gray-500">Clear Bet</button>
                                        <button onClick={rebet} disabled={prevBet === 0 || bet > 0} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-xl hover:bg-blue-700 disabled:bg-gray-500">Re-bet</button>
                                    </div>
                                </>
                            ) : (
                                <button onClick={deal} disabled={betLocked} className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg shadow-xl hover:bg-green-700 disabled:bg-gray-500">Deal</button>
                            )}
                        </div>
                    ) : phase !== "dealing" && (
                        <div className="flex justify-center items-center space-x-4 h-full">
                            {phase === 'finished' ? (
                                <button className="px-8 py-4 bg-gray-800 text-white font-bold rounded-lg shadow-xl hover:bg-gray-900" onClick={resetHand}>Next Hand</button>
                            ) : (
                                <>
                                    <button onClick={hit} disabled={!isCurrentHand(currentHandIndex)} className="btn disabled:bg-gray-500">Hit</button>
                                    <button onClick={stand} disabled={!isCurrentHand(currentHandIndex)} className="btn disabled:bg-gray-500">Stand</button>
                                    <button onClick={double} disabled={!canDouble()} className="btn disabled:bg-gray-500">Double</button>
                                    <button onClick={split} disabled={!canSplit()} className="btn disabled:bg-gray-500">Split</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
