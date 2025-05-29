import React from 'react';

export default function BlackjackStrategies() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-justify">
      <h1 className="text-3xl font-bold mb-6 text-center">Basic Blackjack Strategies</h1>

      <p className="mb-6">
        Blackjack isn't just a game of chance—strategy plays a big role in long-term success. 
        By following these three core strategies, YOU can significantly reduce the house edge and improve your decision-making at the table.
      </p>

        {/*Strategy 1*/}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">1. Always Stand on 17 or Higher</h2>
        <p className="mb-2">
          If your hand totals 17 or more, it's generally best to <span className="font-bold">stand</span>. This is especially important when the dealer shows a strong upcard like 7, 8, 9, 10, or Ace. Trying to hit with a hand like 17 or 18 is risky—there's a high chance of busting.
        </p>
        <div tabIndex={0} className="collapse collapse-arrow bg-base-100 border-base-300 border">
            <div className="collapse-title font-semibold">Why?</div>
            <div className="collapse-content text-sm">
                This is because you're in a “danger zone” where taking another card has a high chance (around 69%) of making you bust.
                Even a soft 17 (Ace + 6) should be played cautiously, depending on the dealer’s card.
                If the dealer has a weak card like 4, 5, or 6, they are statistically more likely to bust. Standing on your strong hand puts pressure on the dealer to take the risk instead.
            </div>
        </div>
      </div>

        {/*Strategy 2*/}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">2. Hit When You Have 8 or Less</h2>
        <p className="mb-2">
          When your total is 8 or less, always <span className="font-bold">hit</span>. You can't bust, so there's no reason to avoid taking another card. The goal is to get closer to 21 without going over, and hands below 9 leave plenty of room for improvement.
        </p>
        <div tabIndex={0} className="collapse collapse-arrow bg-base-100 border-base-300 border">
            <div className="collapse-title font-semibold">Why?</div>
            <div className="collapse-content text-sm">
                At such low totals, the only way to improve your hand is by drawing more cards.
                Many beginners hesitate to hit for fear of busting, but with 8 or less, that's impossible with a single draw.
                Hitting here is essential to increase your total and stay competitive against the dealer.
            </div>
        </div>
      </div>

        {/*Strategy 3*/}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">3. Double Down on 11</h2>
        <p className="mb-2">
          When you’re dealt a total of 11, it’s one of the best times to <span className="font-bold">double down</span>—especially if the dealer shows a weak card (anything from 2 to 10). This move allows you to double your bet in exchange for receiving just one more card.
        </p>
        <div tabIndex={0} className="collapse collapse-arrow bg-base-100 border-base-300 border">
            <div className="collapse-title font-semibold">Why?</div>
            <div className="collapse-content text-sm">
                At such low totals, the only way to improve your hand is by drawing more cards.
                Many beginners hesitate to hit for fear of busting, but with 8 or less, that's impossible with a single draw.
                Hitting here is essential to increase your total and stay competitive against the dealer.
            </div>
        </div>
      </div>

      <p className="mt-6">
        These foundational strategies can guide you through most blackjack situations. While the game still involves chance, smart decisions over time help tip the odds more in your favour.
      </p>
    </div>
  );
}