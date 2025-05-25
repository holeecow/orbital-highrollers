export default function Button({ children, onClick, className }) {
  // Button takes in an argument i.e. name of button. There is destructuring involved (destructure props)
  return (
    <button
      onClick={onClick}
      className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
