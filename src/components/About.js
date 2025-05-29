export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-justify">
      <h1 className="text-3xl font-bold mb-6 text-center">🎯 About This Site</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
        <p>
          Helping new players learn smarter, play sharper. This site aims to turn casual players into confident decision-makers at the blackjack table.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Who We Are</h2>
        <p>
          {`Built by two passionate blackjack enthusiast, this site was born out of a love for strategy and simplicity. We're here to strip away the fluff and provide real, practical advice for beginners.`}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Why This Site Exists</h2>
        <p>
          Too many players jump into blackjack relying purely on luck. We created this site to teach core strategies, correct common mistakes, and help new players build a solid foundation—without overwhelming charts or complex math.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">{`What You'll Learn`}</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>When to hit, stand, or double down with confidence</li>
          <li>How to think in terms of risk and probability</li>
          <li>Common beginner mistakes—and how to avoid them</li>
        </ul>
      </section>
    </div>
  );
}