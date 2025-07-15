import React from "react";

// Helper to group chips by denomination
export function getChipGroups(bet) {
  const denominations = [
    { value: 100, color: "black" },
    { value: 25, color: "green" },
    { value: 5, color: "red" },
    { value: 1, color: "white" },
  ];
  const groups = [];
  let remaining = bet;
  for (const denom of denominations) {
    let count = 0;
    while (remaining >= denom.value) {
      count++;
      remaining -= denom.value;
    }
    if (count > 0) {
      groups.push({ ...denom, count });
    }
  }
  return groups;
}

// StackedChips component
export function StackedChips({ value, color, count }) {
  return (
    <div
      className="relative w-10"
      style={{ height: `${40 + (count - 1) * 8}px` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 absolute left-0"
          style={{
            backgroundColor: color,
            borderColor: "#000",
            bottom: `${i * 8}px`,
            zIndex: i,
            color: "#000",
          }}
        >
          ${value}
        </div>
      ))}
    </div>
  );
}
