const oasis = require("@oasisprotocol/client");
const nacl = require("tweetnacl");
const { fromBech32 } = require("./decode");
const {
  hex2uint,
  uint2hex,
  parseKey,
  publicKeyToAddress,
} = require("./helper");

const RETRY_DELAY = 1000;
let params = {
  feeAmount: "2",
  feeGas: "3000",
  fromAddress: "oasis1qzpwxt85r2zx50egjet8f5sagredc28pfuqzlzz8",
  method: "staking.Transfer",
  // nonce: 46,
  shares: "NaN",
  toAddress: "oasis1qrry5phpkctpqhxrgdzvsdze57x8m488p5ze52g2",
  amount: "1",
  currentAccount: {
    accountName: "Account 1",
    address: "oasis1qrry5phpkctpqhxrgdzvsdze57x8m488p5ze52g2",
    hdPath: 0,
    isUnlocked: true,
    localAccount: { keyringData: "keyringData" },
    publicKey:
      "04f9eeb54a83a82b76e7dfc53efa8c7e8ac9bafbd9efb8ac608134819f2b694c",
    type: "WALLET_INSIDE",
    typeIndex: 1,
  },
};

const buildTransfer = async (nic, signer, to, amount) => {
  const tw = oasis.staking.transferWrapper();
  const nonce = await nic.consensusGetSignerNonce({
    account_address: await oasis.staking.addressFromPublicKey(signer.public()),
    height: 0,
  });
  tw.setNonce(nonce);
  tw.setFeeAmount(oasis.quantity.fromBigInt(0n));
  tw.setBody({
    to: fromBech32("oasis", to),
    amount: oasis.quantity.fromBigInt(amount),
  });

  const gas = await tw.estimateGas(nic, signer.public());
  tw.setFeeGas(gas);
  return tw;
};

(async () => {
  const originalPrivateKey = `yuRwDxQeAZKTP1Ndu7+OkZTfe6Jwdzem3FNJCcYxE/K5M3UdddmXK9A4j721SwMebr6mt90lU1T7uKGG7/cfFA==`;
  const privateKey = uint2hex(parseKey(originalPrivateKey));

  const publicKeyBytes = nacl.sign.keyPair.fromSecretKey(
    hex2uint(privateKey)
  ).publicKey;

  const walletAddress = await publicKeyToAddress(publicKeyBytes);

  const publicKey = uint2hex(publicKeyBytes);

  console.log(`
  originalPrivateKey: ${originalPrivateKey}
  walletAddress: ${walletAddress}
  publicKey: ${publicKey}
  privateKey (secret key): ${privateKey}`);

  const nic = new oasis.client.NodeInternal("https://testnet.grpc.oasis.dev");
  const bytes = hex2uint(privateKey);
  const signer = oasis.signature.NaclSigner.fromSecret(
    bytes,
    "this key is not important"
  );
  const receiver = "oasis1qrry5phpkctpqhxrgdzvsdze57x8m488p5ze52g2";
  const tx = await buildTransfer(nic, signer, receiver, 1);

  console.log(`- tx:`, tx);
})();
