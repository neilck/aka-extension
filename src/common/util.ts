import { getPublicKey } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// takes in hex or nsec... string
// returns hex privatekey is valid, null if not
export function isKeyValid(key: string): string {
  if (key.match(/^[a-f0-9]{64}$/)) return key;
  try {
    const decoded = nip19.decode(key);
    if (decoded.type === "nsec") return bytesToHex(decoded.data);
  } catch (_) {}
  return null;
}

export function getPublicKeyStr(private_key: string): string | null {
  const privateKeyArray = hexToBytes(private_key);

  try {
    const pubkey = getPublicKey(privateKeyArray);

    return pubkey;
  } catch (error) {
    console.error(`getPublicKey error:`);
    console.error(error);
    return null;
  }
}
