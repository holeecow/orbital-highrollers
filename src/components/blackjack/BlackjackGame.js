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

  //State for the summary of the Game
  const [summary, setSummary] = useState("");

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

  const deal = async () => {
    if (!ready) return;
    // Draw 4 cards, 2 for the player and 2 for dealer
    const cards = await drawCards(4);
    setPlayer([cards[0], cards[2]]);
    setDealer([cards[1], cards[3]]);
    setPhase("playing");
    setDealerTurn(false);
  };

  const hit = async () => {
    if (phase !== "playing") return;
    if (handTotal(player) < 22) {
      const [card] = await drawCards(1);
      setPlayer((p) => [...p, card]);
    } else {
      setResult("lose");
      setPhase("finished");
      //   setDealerTurn(false);
    }
  };

  const stand = () => {
    setDealerTurn(true);
  };

  const summaryRef = useRef(null);

  const openSummary = () => {
    const playerCards = cardPoints(player[0]).concat(cardPoints(player[1]));
    const dealerCards = cardPoints(dealer[0])[0];
    const recomendation = GetRecommendedPlayerAction(playerCards, dealerCards, 1, false, null);
    setSummary(recomendation);
    summaryRef.current?.showModal();
  };

  const closeSummary = () => {
    summaryRef.current?.close();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
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
      {phase === "finished" && (
        <button className="btn" onClick={openSummary}>Summary!</button>
      )}
      
      <dialog ref={summaryRef} className="p-6 rounded-lg bg-white text-black">
        <h2 className="text-xl mb-4">Game Summary</h2>
        <ul className="list-disc pl-5 mb-6">
          <li>Recommendation: {summary}</li>
        </ul>
        <button onClick={closeSummary}>Close</button>
      </dialog>

      <p className="text-black">{phase}</p>
      <p className="text-sm text-gray-400">Cards left in shoe: {remaining}</p>
    </main>
  );
}
