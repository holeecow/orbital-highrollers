import blackjackTable from "../images/blackjack_table.jpeg";

export default function Hero() {
  return (
    <div>
      <header
        id="up"
        className="bg-center bg-fixed bg-no-repeat bg-cover h-screen relative"
      >
        <div
          className="min-h-screen bg-cover bg-center bg-no-repeat
                 flex items-center justify-center"
          style={{ backgroundImage: `url(${blackjackTable})` }}
        >
          <div className="mx-2 text-center border-solid border-2 border-gray-200 bg-gray-900 bg-opacity-50 rounded-lg p-10">
            <h1 className="text-gray-100 font-extrabold text-4xl xs:text-5xl md:text-6xl">
              Master Blackjack like a pro
            </h1>
            <h2 className="text-gray-200 font-extrabold text-3xl xs:text-4xl md:text-5xl leading-tight">
              Play against the dealer and win big!
            </h2>
            <div className="inline-flex">
              <button className="p-2 my-5 mx-2 bg-indigo-700 hover:bg-indigo-800 font-bold text-white rounded border-2 border-transparent hover:border-indigo-800 shadow-md transition duration-500 md:text-xl">
                Practice Rounds
              </button>
              <a href="#about">
                <button className="p-2 my-5 mx-2 bg-transparent border-2 bg-indigo-200 bg-opacity-75 hover:bg-opacity-100 border-indigo-700 rounded hover:border-indigo-800 font-bold text-white shadow-md transition duration-500 md:text-lg">
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
