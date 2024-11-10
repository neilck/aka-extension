import { getPublicKeyStr } from "../util";
import { nip19 } from "nostr-tools";
import { isKeyValid } from "../util";

// only name, isCurrent, and privatekey actually stored
// all other values calculated as needed
export class KeyPair {
  private _private_key: string;
  private _name: string;
  private _created_at: number;
  private _public_key = "";
  private _isCurrent = false;

  static initKeyPair(
    private_key: string,
    name: string,
    isCurrent?: boolean,
    created_at?: number
  ): KeyPair {
    const key = isKeyValid(private_key);
    if (!key) throw Error("private_key is invalid");

    let keypair = new KeyPair();
    keypair._private_key = private_key;
    keypair._name = name;
    keypair._public_key = getPublicKeyStr(private_key);
    if (typeof isCurrent !== "undefined") keypair._isCurrent = isCurrent;
    else keypair._isCurrent = false;
    if (typeof created_at !== "undefined") keypair._created_at = created_at;
    else keypair._created_at = Math.round(Date.now() / 1000);
    return keypair;
  }

  get name() {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get npub() {
    return nip19.npubEncode(this._public_key);
  }

  get created_at() {
    return this._created_at;
  }

  get npubshort() {
    let npub = this.npub;
    return npub.substring(0, 9) + "..." + npub.substring(npub.length - 5);
  }

  get nsec() {
    return nip19.nsecEncode(new TextEncoder().encode(this._private_key));
  }

  get public_key() {
    return this._public_key;
  }

  get private_key() {
    return this._private_key;
  }

  get isCurrent() {
    return this._isCurrent;
  }

  set isCurrent(value: boolean) {
    this._isCurrent = value;
  }
}
