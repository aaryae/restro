const BASE = 100;
const THRESHOLDS = [
  { limit: 1700, cap: 1000 },
  { limit: 4900, cap: 1000 },
  { limit: 7400, cap: 1000 },
];
const MAX_RANDOM = 1000;

const getRandomIncrement = (max) => {
  if (max <= 0) return 0;
  if (max < BASE) return BASE;
  const steps = Math.floor(max / BASE);
  const randomStep = Math.floor(Math.random() * steps) + 1;
  return randomStep * BASE;
};

const pointCalculator = (userPoint) => {
  for (const { limit, cap } of THRESHOLDS) {
    if (userPoint < limit) {
      let diff = limit - userPoint;
      if (cap !== null) diff = Math.min(diff, cap);
      const increment = getRandomIncrement(diff);
      return { updatedPoint: userPoint + increment, newPoint: increment };
    }
  }

  const increment = getRandomIncrement(MAX_RANDOM);
  return { updatedPoint: userPoint + increment, newPoint: increment };
};

module.exports = { pointCalculator };
