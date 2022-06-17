const { decode: base64decode } = require("base64-arraybuffer");
const nacl = require("tweetnacl");
const oasis = require("@oasisprotocol/client");

const toNonExponential = (num_str) => {
  const num_bn = new BigNumber(num_str);
  return num_bn.toFixed();
};

const amountDecimals = (amount, decimal = cointypes.decimals) => {
  let realBalance = new BigNumber(amount)
    .dividedBy(new BigNumber(10).pow(decimal))
    .toString();
  return realBalance;
};

const hex2uint = (hex) => new Uint8Array(Buffer.from(hex, "hex"));
const uint2hex = (uint) => Buffer.from(uint).toString("hex");

const cointypes = {
  name: "OASIS",
  coinType: 474,
  network: null,
  symbol: "ROSE",
  testNetSymbol: "TEST",
  decimals: 9,
};

const base64ToUint = (value) => new Uint8Array(base64decode(value));

const genOasisKeyFromPrivateKey = (key) => {
  if (key.length === 32) {
    return nacl.sign.keyPair.fromSeed(key).secretKey;
  } else if (key.length === 64) {
    return nacl.sign.keyPair.fromSecretKey(key).secretKey;
  } else {
    throw new Error("Invalid private key shape");
  }
};

const parseKey = (key) => {
  const keyWithoutEnvelope = key
    .replace(/\n/gm, "")
    .replace(/ /g, "")
    .replace(/^-----.*?-----/, "")
    .replace(/-----.*?-----$/, "");

  const key_bytes = base64ToUint(keyWithoutEnvelope);
  return genOasisKeyFromPrivateKey(key_bytes);
};

const publicKeyToAddress = async (publicKey) => {
  const data = await oasis.staking.addressFromPublicKey(publicKey);
  return oasis.staking.addressToBech32(data);
};
module.exports = {
  toNonExponential,
  amountDecimals,
  hex2uint,
  uint2hex,
  base64ToUint,
  cointypes,
  genOasisKeyFromPrivateKey,
  parseKey,
  publicKeyToAddress,
};
