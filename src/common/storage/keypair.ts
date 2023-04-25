import browser from "webextension-polyfill";
import { getPublicKey, nip19 } from "nostr-tools";
import { isPrivateKeyValid } from "../util";

export interface IKeyPair {
  get_discriminator: () => string;
  get_name: () => string;
  get_npub: () => string;
  get_nsec: () => string;
  get_publickey: () => string;
  get_privatekey: () => string;
  get_isCurrent: () => boolean;
  set_name: (name: string) => void;
  set_privatekey: (privatekey: string) => void;
  set_isCurrent: (value: boolean) => void;
}

// only name, isCurrent, and privatekey actually stored
// all other values calculated as needed
export class KeyPair implements IKeyPair {
  discriminator: string = "V1";
  privatekey: string;
  name: string;
  publickey = "";
  npub = "";
  nsec = "";
  isCurrent = false;

  constructor(name: string, isCurrent: boolean, privatekey: string) {
    const key = isPrivateKeyValid(privatekey);
    if (key != null) {
      this.name = name;
      this.privatekey = privatekey;
      this.isCurrent = isCurrent;
    } else {
      throw new Error("Invalid private key.");
    }
  }

  get_discriminator() {
    return this.discriminator;
  }

  get_name() {
    return this.name;
  }

  get_npub() {
    if (this.npub != "") return this.npub;
    else {
      const pubkey = this.get_publickey();
      this.npub = nip19.npubEncode(pubkey);
    }
    return this.npub;
  }

  get_nsec() {
    if (this.nsec != "") return this.nsec;
    else {
      this.nsec = nip19.nsecEncode(this.privatekey);
    }
    return this.nsec;
  }

  get_publickey() {
    if (this.publickey != "") return this.publickey;
    else {
      this.publickey = getPublicKey(this.privatekey);
    }
    return this.publickey;
  }

  get_privatekey() {
    return this.privatekey;
  }

  get_isCurrent() {
    return this.isCurrent;
  }

  set_name(name: string) {
    this.name = name;
  }

  set_privatekey(privatekey: string) {
    this.privatekey = privatekey;
    this.publickey = "";
    this.npub = "";
    this.nsec = "";
  }

  set_isCurrent(value: boolean) {
    this.isCurrent = value;
  }
}
