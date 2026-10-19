const DAY_MS = 86_400_000;
const FIRST_CYCLE_START = Date.UTC(1997, 9, 7);
const SECOND_CYCLE_START = Date.UTC(2025, 1, 22);
const SECOND_CYCLE_FIRST_FACTOR = 1000;

const toIsoDate = (time: number): string => new Date(time).toISOString().slice(0, 10);

export const dueDateFromFactor = (factor: string, today: Date): string | undefined => {
  const value = Number(factor);
  if (value === 0) {
    return undefined;
  }
  const firstCycle = FIRST_CYCLE_START + value * DAY_MS;
  const secondCycle = SECOND_CYCLE_START + (value - SECOND_CYCLE_FIRST_FACTOR) * DAY_MS;
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return toIsoDate(Math.abs(secondCycle - now) < Math.abs(firstCycle - now) ? secondCycle : firstCycle);
};

export const factorFromDueDate = (isoDate: string): string => {
  const time = Date.parse(`${isoDate}T00:00:00Z`);
  const factor = time >= SECOND_CYCLE_START ? SECOND_CYCLE_FIRST_FACTOR + (time - SECOND_CYCLE_START) / DAY_MS : (time - FIRST_CYCLE_START) / DAY_MS;
  return String(Math.round(factor)).padStart(4, '0');
};
