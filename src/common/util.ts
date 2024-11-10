import { getPublicKey } from "nostr-tools";
import { nip19 } from "nostr-tools";

function hexToUint8Array(hexString) {
  // Ensure the hex string has a length of 64 characters (32 bytes in hex representation)
  if (hexString.length !== 64) {
    throw new Error("Hex string must be 64 characters long.");
  }

  // Convert each pair of hex characters to an integer and store it in Uint8Array
  return Uint8Array.from(
    hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
}

function uint8ArrayToHex(uint8Array: Uint8Array): string {
  // Convert each byte in the Uint8Array to a 2-digit hex string
  return Array.from(uint8Array, (byte: number) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

// takes in hex or nsec... string
// returns hex privatekey is valid, null if not
export function isKeyValid(key: string): string {
  if (key.match(/^[a-f0-9]{64}$/)) return key;
  try {
    const decoded = nip19.decode(key);
    if (decoded.type === "nsec") return uint8ArrayToHex(decoded.data);
  } catch (_) {}
  return null;
}

export function getPublicKeyStr(private_key: string): string | null {
  console.log(`getPublicKeyStr ${private_key}`);
  const privateKeyArray = hexToUint8Array(private_key);
  console.log(`privateKeyArray ${privateKeyArray}`);
  try {
    const pubkey = getPublicKey(privateKeyArray);
    console.log(`result: ${pubkey}`);
    return pubkey;
  } catch (error) {
    console.error(`getPublicKey error:`);
    console.log(error);
    return null;
  }
}
