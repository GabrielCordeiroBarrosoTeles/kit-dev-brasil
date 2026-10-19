const POLYNOMIAL = 0x1021;
const INITIAL_VALUE = 0xffff;
const HIGH_BIT = 0x8000;
const MASK = 0xffff;
const encoder = new TextEncoder();

export const crc16Ccitt = (input: string): string => {
  let crc = INITIAL_VALUE;
  for (const byte of encoder.encode(input)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & HIGH_BIT ? ((crc << 1) ^ POLYNOMIAL) & MASK : (crc << 1) & MASK;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};
