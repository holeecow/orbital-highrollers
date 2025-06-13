import { useState, useEffect, useCallback } from "react";
import { createShoe, draw } from "../blackjack/Deck";

// useShoe hook returns an array containing the information of the cards, remaining number of cards and whether the deck is ready
export function useShoe() {
  //State for controlling the deckID and remaning number of cards
  const [deckId, setDeckId] = useState(null);
  const [remaining, setRemaining] = useState(0);

  // initialised once when useShoe is called
  useEffect(() => {
    createShoe().then(({ deckId, remaining }) => {
      setDeckId(deckId);
      setRemaining(remaining);
    });
  }, []);

  // draw N number of cards from the deck
  // function is recreated only when deckID changes 
  const drawCards = useCallback(
    async (count = 1) => { //count = 1 to draw 1 card
      if (!deckId) throw new Error("Shoe not ready");
      const { cards, remaining } = await draw(deckId, count); //draw 1 card
      setRemaining(remaining); //update state
      return cards; // [{code:'AS', value:'ACE', …}]
    },
    [deckId]
  );

  //if deckID is not undefined or null, Boolean(deckID) is true
  return { drawCards, remaining, ready: Boolean(deckId) };
}
