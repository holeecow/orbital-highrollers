// Logic to create, draw from, and shuffle a deck of cards using the Deck of Cards API

export async function createShoe(deckCount = 6) {
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${deckCount}`
  );
  const data = await res.json();
  if (!data.success) throw new Error("Deck API failed");
  return { deckId: data.deck_id, remaining: data.remaining };
}

export async function draw(deckId, count = 1) {
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`
  );
  const data = await res.json();
  if (!data.success) throw new Error("Draw failed");
  return { cards: data.cards, remaining: data.remaining };
}

export async function shuffle(deckId) {
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`
  );
  const data = await res.json();
  if (!data.success) throw new Error("Shuffle failed");
  return { deckId: data.deck_id, remaining: data.remaining };
}
