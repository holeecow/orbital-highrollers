// Logic to create, draw from, and shuffle a deck of cards using the Deck of Cards API

//Function to create Shoe, returns an array with the deck id and number of remaning cards
export async function createShoe(deckCount = 5) {
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${deckCount}`
  );
  const data = await res.json(); //parses the responses as JSON. await resolves the Promise
  if (!data.success) throw new Error("Deck API failed"); // throw an error if the success field is false
  return { deckId: data.deck_id, remaining: data.remaining };
}

//Function to draw 1 card, returns an array with the cards and the number of remaning cards in the Shoe
export async function draw(deckId, count = 1) {
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`
  );
  const data = await res.json();
  if (!data.success) throw new Error("Draw failed");// throw an error if the success field is false
  return { cards: data.cards, remaining: data.remaining };
}

//Function to shuffle the deck, returns an array with the deckID and number of remaining cards in the Shoe
export async function shuffle(deckId) {
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`
  );
  const data = await res.json();
  if (!data.success) throw new Error("Shuffle failed");
  return { deckId: data.deck_id, remaining: data.remaining };
}
