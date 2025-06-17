"use client";
import { useState, useEffect, useRef } from "react";
import { useShoe } from "../hooks/Hook";

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
          <div key={index} className={isWrong ? "text-red-500" : "text-green-400"}>
            {msg}
          </div>
        );
      })}
    </div>
  );
}

function StatsTracker({ correct, wrong, hands }) {
  const totalMoves = correct + wrong;
  const score = totalMoves > 0 ? Math.round((correct / totalMoves) * 100) : 0;
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

//Function to calculate the number of points of the cards
function cardPoints(card) {
  const v = card.value; // "ACE", "7", "KING", …
  if (v === "ACE") return [1, 11];
  if (["KING", "QUEEN", "JACK"].includes(v)) return [10];
  return [Number(v)];
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

export default function BlackjackGame() {
  // State for controlling the Shoe
  const { drawCards, ready, remaining } = useShoe();

  // State for controlling the cards the player has
  const [player, setPlayer] = useState([]);
  
  // State for controlling the cards the dealer has
  const [dealer, setDealer] = useState([]);

  // State for the phase of the game: waiting | playing | finished
  const [phase, setPhase] = useState("waiting"); 

  // State for the result of the game: win | lose | push
  const [result, setResult] = useState(null); 

  // State for controlling whether it is the dealer's turn
  const [dealerTurn, setDealerTurn] = useState(false);

  // State for controlling the feedback and stats of the game
  const [feedbackMessages, setFeedbackMessages] = useState([]); // NEW
  const [correctMoves, setCorrectMoves] = useState(0);         // NEW
  const [wrongMoves, setWrongMoves] = useState(0);             // NEW
  const [handsPlayed, setHandsPlayed] = useState(0); 

  //useEffect hook to handle the logic when it is the dealer's turn
  useEffect(() => {
    // runDealer is a Promise that only only runs when it is the dealerTurn
    const runDealer = async () => {
      if (!dealerTurn) return;

      let current = [...dealer];
      // Dealer only draws when his current hand is less than 17
      while (handTotal(current) < 17) {
        const [card] = await drawCards(1);
        current.push(card);
        setDealer(current);
      }

      const playerTotal = handTotal(player);
      const dealerTotal = handTotal(current);
      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        setResult("win");
      } else if (playerTotal < dealerTotal) {
        setResult("lose");
      } else {
        setResult("push"); // tie
      }

      setPhase("finished");
      // setDealerTurn(false);
    };
    if (dealerTurn) {
      runDealer();
    }
  }, [dealerTurn, dealer, player, drawCards]);

  // useEffect hook to handle the result of the game 
  useEffect(() => {
    if (handTotal(player) === 21 && player.length === 2) {
      setResult("win");
      setPhase("finished");
      setDealerTurn(false);
    } else if (
      handTotal(player) > 21 ||
      (handTotal(dealer) === 21 && dealer.length === 2)
    ) {
      setResult("lose");
      setPhase("finished");
      setDealerTurn(false);
    }
  }, [player]);

  //useEffect hook to update the number of hands played
  useEffect(() => {
    if (phase === "finished") {
      setHandsPlayed(h => h + 1);
    }
  }, [phase]);

  const deal = async () => {
    if (!ready) return;
    setFeedbackMessages([]); // reset the feedback window when the player deals a new hand
    setResult(null);

    // Draw 4 cards, 2 for the player and 2 for dealer
    const cards = await drawCards(4);
    setPlayer([cards[0], cards[2]]);
    setDealer([cards[1], cards[3]]);
    setPhase("playing");
    setDealerTurn(false);
  };

  const hit = async () => {
    if (phase !== "playing") return;
    const playerValues = player.map(cardPoints); //maps all the cards to their values
    const dealerUpValue = dealer[0] ? cardPoints(dealer[0]) : 0; //if dealer card exists, then calculate the card point
    const recommended = GetRecommendedPlayerAction(
      playerValues,
      dealerUpValue,
      1,
      true,
      null
    );
    const isCorrect = recommended === "hit";
    const msg = `Dealer ${dealerUpValue}, Player ${handTotal(player)}: Hit (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
  
    setFeedbackMessages((prev) => [msg, ...prev]); // append msg to the existing feedback

    if (isCorrect) setCorrectMoves((c) => c + 1);  
    else setWrongMoves((w) => w + 1);             
    if (handTotal(player) < 22) {
      const [card] = await drawCards(1);
      setPlayer((p) => [...p, card]);
    } else {
      setResult("lose");
      setPhase("finished");
    
    }
  };

  const stand = () => {
    if (phase !== "playing") return;
    // Evaluate correctness
    const playerVals = player.map(cardPoints);
    const dealerUpVal = dealer[0] ? cardPoints(dealer[0]) : 0;
    const recommended = GetRecommendedPlayerAction(
      playerVals,
      dealerUpVal,
      1,
      true,
      null
    );
    const isCorrect = recommended === "stand";
    const msg = `Dealer ${dealerUpVal}, Player ${handTotal(player)}: Stand (${isCorrect ? "correct" : `wrong, you should ${recommended}`})`;
    // Append feedback
    setFeedbackMessages((prev) => [msg, ...prev]); 
    if (isCorrect) setCorrectMoves((c) => c + 1);  
    else setWrongMoves((w) => w + 1);             
    setDealerTurn(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <ActionFeedback messages={feedbackMessages} />
      <StatsTracker correct={correctMoves} wrong={wrongMoves} hands={handsPlayed} />

      <h1 className="text-3xl font-bold text-black">Blackjack</h1>

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

      {/* player */}
      <section className="flex gap-2">
        {player.map((c) => (
          <CardFace key={c.code + Math.random()} card={c} />
        ))}
      </section>
      <p className="mt-2 text-sm text-black">
        Player {handTotal(player) || 0} – Dealer{" "}
        {phase === "waiting"
          ? 0
          : dealerTurn
          ? handTotal(dealer)
          : handTotal(dealer.slice(0, 1)) || 0}
      </p>

      {phase === "finished" && (
        <p className="text-3xl font-bold text-black">
          {result === "win" && "You win! 🎉"}
          {result === "lose" && "You lose 😢"}
          {result === "push" && "Push – tie."}
        </p>
      )}
      {/* controls */}
      <div
        className={phase === "playing" ? "flex gap-4" : "flex justify-center"}
      >
        <button className="btn" onClick={deal}>
          Deal
        </button>

        {phase === "playing" && (
          <>
            <button className="btn" onClick={hit}>
              Hit
            </button>
            <button className="btn" onClick={stand}>
              Stand
            </button>
          </>
        )}
      </div>

      <p className="text-black">{phase}</p>
      <p className="text-sm text-gray-400">Cards left in shoe: {remaining}</p>
    </main>
  );
}
