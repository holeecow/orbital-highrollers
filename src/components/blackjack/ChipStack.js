import React from 'react';
import Chip from './Chip';

const ChipStack = ({ amount, className = '' }) => {
  const denominations = [100, 25, 10, 5, 1];
  const chips = [];
  let remainingAmount = amount;

  denominations.forEach(value => {
    const count = Math.floor(remainingAmount / value);
    for (let i = 0; i < count; i++) {
      chips.push({ value, id: `chip-${value}-${i}-${Math.random()}` });
    }
    remainingAmount %= value;
  });
  
  // Add chips for the remainder
  if (remainingAmount > 0) {
      // This part is imperfect for minimal chips, but will show the remainder.
      // For this game logic, we should mostly be dealing with multiples of 5 or 10.
  }

  return (
    <div className={`relative w-16 h-20 ${className}`}>
      {chips.map((chip, index) => (
        <div key={chip.id} className="absolute" style={{ bottom: `${index * 4}px` }}>
          <Chip value={chip.value} />
        </div>
      ))}
    </div>
  );
};

export default ChipStack; 