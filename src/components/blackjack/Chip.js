import React from 'react';

const Chip = ({ value, onClick, className = '' }) => {
  const chipColors = {
    1: 'bg-gray-400',
    5: 'bg-red-600',
    10: 'bg-blue-600',
    25: 'bg-green-600',
    100: 'bg-black',
  };

  const color = chipColors[value] || 'bg-yellow-500';

  return (
    <button
      onClick={() => onClick && onClick(value)}
      className={`relative w-16 h-16 rounded-full font-bold text-white shadow-lg transform transition-transform hover:scale-110 focus:outline-none ${className}`}
    >
      <div className={`w-full h-full rounded-full ${color} flex items-center justify-center`}>
        <div className="absolute w-12 h-12 rounded-full border-4 border-white opacity-50"></div>
        <span className="relative z-10 text-lg">${value}</span>
      </div>
    </button>
  );
};

export default Chip; 