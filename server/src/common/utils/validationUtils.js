const ALPHABET_23_LETTERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

function computeChecksum(numbers) {
  if (!numbers || numbers.length !== 7) {
    throw new Error(`Le code ne doit contenir que 7 caractères sans le checksum`);
  }

  return ALPHABET_23_LETTERS[numbers % 23];
}

function createUAI(code) {
  return `${code}${computeChecksum(code)}`.toUpperCase();
}

/**
 * https://blog.juliendelmas.fr/?qu-est-ce-que-le-code-rne-ou-uai
 */
module.exports = {
  createUAI,
  computeChecksum,
  isUAIValid(code) {
    if (!code || code.length !== 8) {
      return false;
    }

    const numbers = code.substring(0, 7);
    const checksum = code.substring(7, 8).toLowerCase();

    return checksum === computeChecksum(numbers);
  },
};
