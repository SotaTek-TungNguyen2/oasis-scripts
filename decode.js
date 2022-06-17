const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const ALPHABET_MAP = {};
for (let z = 0; z < ALPHABET.length; z++) {
  const x = ALPHABET.charAt(z);
  ALPHABET_MAP[x] = z;
}

function polymodStep(pre) {
  const b = pre >> 25;
  return (
    ((pre & 0x1ffffff) << 5) ^
    (-((b >> 0) & 1) & 0x3b6a57b2) ^
    (-((b >> 1) & 1) & 0x26508e6d) ^
    (-((b >> 2) & 1) & 0x1ea119fa) ^
    (-((b >> 3) & 1) & 0x3d4233dd) ^
    (-((b >> 4) & 1) & 0x2a1462b3)
  );
}

function prefixChk(prefix) {
  let chk = 1;
  for (let i = 0; i < prefix.length; ++i) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) return "Invalid prefix (" + prefix + ")";
    chk = polymodStep(chk) ^ (c >> 5);
  }
  chk = polymodStep(chk);
  for (let i = 0; i < prefix.length; ++i) {
    const v = prefix.charCodeAt(i);
    chk = polymodStep(chk) ^ (v & 0x1f);
  }
  return chk;
}

function __decode(str, LIMIT) {
  LIMIT = LIMIT || 90;
  if (str.length < 8) return str + " too short";
  if (str.length > LIMIT) return "Exceeds length limit";
  // don't allow mixed case
  const lowered = str.toLowerCase();
  const uppered = str.toUpperCase();
  if (str !== lowered && str !== uppered) return "Mixed-case string " + str;
  str = lowered;
  const split = str.lastIndexOf("1");
  if (split === -1) return "No separator character for " + str;
  if (split === 0) return "Missing prefix for " + str;
  const prefix = str.slice(0, split);
  const wordChars = str.slice(split + 1);
  if (wordChars.length < 6) return "Data too short";
  let chk = prefixChk(prefix);
  if (typeof chk === "string") return chk;
  const words = [];
  for (let i = 0; i < wordChars.length; ++i) {
    const c = wordChars.charAt(i);
    const v = ALPHABET_MAP[c];
    if (v === undefined) return "Unknown character " + c;
    chk = polymodStep(chk) ^ v;
    // not in the checksum?
    if (i + 6 >= wordChars.length) continue;
    words.push(v);
  }
  if (chk !== 1) return "Invalid checksum for " + str;
  return { prefix, words };
}

function convert(data, inBits, outBits, pad) {
  let value = 0;
  let bits = 0;
  const maxV = (1 << outBits) - 1;
  const result = [];
  for (let i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i];
    bits += inBits;
    while (bits >= outBits) {
      bits -= outBits;
      result.push((value >> bits) & maxV);
    }
  }
  if (pad) {
    if (bits > 0) {
      result.push((value << (outBits - bits)) & maxV);
    }
  } else {
    if (bits >= inBits) return "Excess padding";
    if ((value << (outBits - bits)) & maxV) return "Non-zero padding";
  }
  return result;
}

function fromWords(words) {
  const res = convert(words, 5, 8, false);
  if (Array.isArray(res)) return res;
  throw new Error(res);
}

const fromBech32 = (expectedPrefix, str) => {
  const { prefix, words } = __decode(str);
  if (prefix !== expectedPrefix) {
    throw new Error(`wrong prefix: ${prefix}, expected ${expectedPrefix}`);
  }
  return new Uint8Array(fromWords(words));
};

module.exports = {
  fromBech32,
};
