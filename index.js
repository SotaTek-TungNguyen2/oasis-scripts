const oasis = require("@oasisprotocol/client");
const nacl = require("tweetnacl");
const { fromBech32 } = require("./decode");
const {
  hex2uint,
  uint2hex,
  parseKey,
  publicKeyToAddress,
} = require("./helper");

const buildTransfer = async (nic, signer, to, amount) => {
  const tw = oasis.staking.transferWrapper();
  const nonce = 8; 
  // await nic.consensusGetSignerNonce({
  //   account_address: await oasis.staking.addressFromPublicKey(signer.public()),
  //   height: 0,
  // });
  tw.setNonce(nonce);
  tw.setFeeAmount(oasis.quantity.fromBigInt(0n));
  tw.setBody({
    to: fromBech32("oasis", to),
    amount: oasis.quantity.fromBigInt(amount),
  });

  const gas = 1264; //await tw.estimateGas(nic, signer.public());
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
  privateKey (secret key): ${privateKey}\n`);

  const nic = new oasis.client.NodeInternal("https://testnet.grpc.oasis.dev");
  const bytes = hex2uint(privateKey);
  const signer = oasis.signature.NaclSigner.fromSecret(
    bytes,
    "this key is not important"
  );
  const receiver = "oasis1qrry5phpkctpqhxrgdzvsdze57x8m488p5ze52g2";
  const tw = await buildTransfer(nic, signer, receiver, 1);

  const chainContext = '50304f98ddb656620ea817cc1446c401752a05a249b36c9b90dba4616829977a' //await nic.consensusGetChainContext();
  console.log(`- tx:`, tw);
  console.log(`-chainContext:`, chainContext);
  /**sign transaction */
  await tw.sign(new oasis.signature.BlindContextSigner(signer), chainContext);
  const submitResult = await tw.submit(nic)
  console.log(`-submitResult:`, submitResult);
})();
