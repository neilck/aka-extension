import { nip19 } from "nostr-tools";

// takes in hex or nsec... string
// returns hex privatekey is valid, null if not
export function isKeyValid(key: string): string {
  if (key.match(/^[a-f0-9]{64}$/)) return key;
  try {
    const decoded = nip19.decode(key);
    if (decoded.type === "nsec") return decoded.data;
  } catch (_) {}
  return null;
}
