import Link from "next/link";
export default function Hero() {
  return (
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage: "url(/blackjack_table.jpeg)",
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content text-neutral-content text-center">
        <div className="max-w-md">
          <h1 className="mb-5 text-5xl font-bold">
            Master Blackjack Like a Pro!
          </h1>
          <p className="mb-5">
            Play against the dealer and win big! Practice your skills with our
            free rounds or test your luck with credit rounds. Join us now and
            become a Blackjack champion!
          </p>
          <div className="flex w-full justify-center gap-8">
            <Link href="/blackjackgame" className="btn btn-outline">
              Practice Rounds
            </Link>
            <button className="btn btn-dash">Credit Rounds</button>{" "}
          </div>
        </div>
      </div>
    </div>
  );
}
