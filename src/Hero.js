export default function Hero() {
  return (
    <div>
      <header
        id="up"
        class="bg-center bg-fixed bg-no-repeat bg-center bg-cover h-screen relative"
      >
        <div class="h-screen bg-opacity-50 bg-black flex items-center justify-center">
          <div class="mx-2 text-center">
            <h1 class="text-gray-100 font-extrabold text-4xl xs:text-5xl md:text-6xl">
              Master Blackjack like a pro
            </h1>
            <h2 class="text-gray-200 font-extrabold text-3xl xs:text-4xl md:text-5xl leading-tight">
              Play against the dealer and win big!
            </h2>
            <div class="inline-flex">
              <button class="p-2 my-5 mx-2 bg-indigo-700 hover:bg-indigo-800 font-bold text-white rounded border-2 border-transparent hover:border-indigo-800 shadow-md transition duration-500 md:text-xl">
                Practice Rounds
              </button>
              <a href="#about">
                <button class="p-2 my-5 mx-2 bg-transparent border-2 bg-indigo-200 bg-opacity-75 hover:bg-opacity-100 border-indigo-700 rounded hover:border-indigo-800 font-bold text-indigo-800 shadow-md transition duration-500 md:text-lg">
                  Credit Rounds
                </button>
              </a>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
