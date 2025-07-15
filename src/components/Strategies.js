import React from "react";

export default function BlackjackStrategies() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-justify">
      {/* Introductory Section: How Blackjack Works */}
      <h1 className="text-3xl font-bold mb-4 text-center">
        How Blackjack Works
      </h1>
      <p className="mb-4">
        <b>Blackjack</b> is a classic card game where your goal is to beat the
        dealer by having a hand value as close to <b>21</b> as possible, without
        going over. Each card has a value: number cards are worth their number,
        face cards (Jack, Queen, King) are worth 10, and Aces can be worth 1 or
        11.
      </p>
      <ul className="mb-6 list-disc pl-6">
        <li>
          <b>Hit</b>: Take another card to try to get closer to 21.
        </li>
        <li>
          <b>Stand</b>: Keep your current hand and end your turn.
        </li>
        <li>
          <b>Double</b>: Double your bet, take one more card, and end your turn.
        </li>
        <li>
          <b>Split</b>: If you have two cards of the same value, split them into
          two separate hands (with an additional bet).
        </li>
      </ul>
      <p className="mb-8">
        The dealer also plays by set rules, usually hitting until they reach 17
        or higher. If your hand is closer to 21 than the dealer&apos;s (without
        going over), you win! If you go over 21, you &apos;bust&apos; and lose
        the round.
      </p>

      {/* YouTube Video Embed */}
      <div className="mb-8 w-full flex justify-center">
        <div className="w-full max-w-2xl aspect-video">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/UXmbwvr3aKk?start=0&end=282"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">
        Basic Blackjack Strategies
      </h1>

      <p className="mb-6">
        Blackjack isn&apos;t just a game of chance—strategy plays a big role in
        long-term success. By following these three core strategies, YOU can
        significantly reduce the house edge and improve your decision-making at
        the table.
      </p>

      {/*Strategy 1*/}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          1. Always Stand on 17 or Higher
        </h2>
        <p className="mb-2">
          If your hand totals 17 or more, it&apos;s generally best to
          <span className="font-bold"> stand</span>. This is especially
          important when the dealer shows a strong upcard like 7, 8, 9, 10, or
          Ace. Trying to hit with a hand like 17 or 18 is risky—there&apos;s a
          high chance of busting.
        </p>
        <div
          tabIndex={0}
          className="collapse collapse-arrow bg-base-100 border-base-300 border"
        >
          <div className="collapse-title font-semibold">Why?</div>
          <div className="collapse-content text-sm">
            This is because you&apos;re in a “danger zone” where taking another
            card has a high chance (around 69%) of making you bust. Even a soft
            17 (Ace + 6) should be played cautiously, depending on the
            dealer&apos;s card. If the dealer has a weak card like 4, 5, or 6,
            they are statistically more likely to bust. Standing on your strong
            hand puts pressure on the dealer to take the risk instead.
          </div>
        </div>
      </div>

      {/*Strategy 2*/}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          2. Hit When You Have 8 or Less
        </h2>
        <p className="mb-2">
          When your total is 8 or less, always
          <span className="font-bold">hit</span>. You can&apos;t bust, so
          there&apos;s no reason to avoid taking another card. The goal is to
          get closer to 21 without going over, and hands below 9 leave plenty of
          room for improvement.
        </p>
        <div
          tabIndex={0}
          className="collapse collapse-arrow bg-base-100 border-base-300 border"
        >
          <div className="collapse-title font-semibold">Why?</div>
          <div className="collapse-content text-sm">
            At such low totals, the only way to improve your hand is by drawing
            more cards. Many beginners hesitate to hit for fear of busting, but
            with 8 or less, that&apos;s impossible with a single draw. Hitting
            here is essential to increase your total and stay competitive
            against the dealer.
          </div>
        </div>
      </div>

      {/*Strategy 3*/}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">3. Double Down on 11</h2>
        <p className="mb-2">
          When you&apos;re dealt a total of 11, it&apos;s one of the best times
          to
          <span className="font-bold"> double down</span>
          —especially if the dealer shows a weak card (anything from 2 to 10).
          This move allows you to double your bet in exchange for receiving just
          one more card.
        </p>
        <div
          tabIndex={0}
          className="collapse collapse-arrow bg-base-100 border-base-300 border"
        >
          <div className="collapse-title font-semibold">Why?</div>
          <div className="collapse-content text-sm">
            At such low totals, the only way to improve your hand is by drawing
            more cards. Many beginners hesitate to hit for fear of busting, but
            with 8 or less, that&apos;s impossible with a single draw. Hitting
            here is essential to increase your total and stay competitive
            against the dealer.
          </div>
        </div>
      </div>

      <p className="mt-6">
        These foundational strategies can guide you through most blackjack
        situations. While the game still involves chance, smart decisions over
        time help tip the odds more in your favour.
      </p>
    </div>
  );
}
