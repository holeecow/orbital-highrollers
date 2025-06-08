import BlackjackGame from "../components/blackjack/BlackjackGame";

export default function BlackjackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Blackjack Game</h1>
      <BlackjackGame />
    </div>
  );
}
