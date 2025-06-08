import { useState, useEffect, useCallback } from "react";
import { createShoe, draw } from "../blackjack/Deck";

export function useShoe() {
  const [deckId, setDeckId] = useState(null);
  const [remaining, setRemaining] = useState(0);

  // initialise once
  useEffect(() => {
    createShoe().then(({ deckId, remaining }) => {
      setDeckId(deckId);
      setRemaining(remaining);
    });
  }, []);

  // draw N cards
  const drawCards = useCallback(
    async (count = 1) => {
      if (!deckId) throw new Error("Shoe not ready");
      const { cards, remaining } = await draw(deckId, count);
      setRemaining(remaining);
      return cards; // [{code:'AS', value:'ACE', …}]
    },
    [deckId]
  );

  return { drawCards, remaining, ready: Boolean(deckId) };
}
