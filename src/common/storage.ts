import browser from "webextension-polyfill";
import { KeyPair } from "./model/KeyPair";
import { Relay } from "./model/Relay";
import {
  readKeys,
  readCurrentPubkey,
  saveKeys,
  saveCurrentPubkey,
  readRelays as jsReadRelays,
  saveRelays as jsSaveRelays,
} from "./common";

/*** Local Storage ***/
class Storage {
  private static instance: Storage;

  private keypairs: KeyPair[] = null;
  private loadPromise: Promise<void> | null;

  private constructor() {
    this.loadPromise = null;
  }

  private async load() {
    if (!this.loadPromise) {
      this.loadPromise = this.loadKeyPairs();
    }

    return this.loadPromise;
  }

  private async loadKeyPairs() {
    // console.log("loadKeyPairs() called");

    // {<public_key>: {name: string, private_key: string, created_at: number}}, ... }
    let keys = await readKeys();
    let currentPubkey = await readCurrentPubkey();
    this.keypairs = [];

    if (keys) {
      let keyList = Object.entries<{
        name: string;
        private_key: string;
        created_at: number;
      }>(keys);

      keyList.map(([public_key, data]) => {
        let isCurrent = public_key === currentPubkey;
        this.keypairs.push(
          KeyPair.initKeyPair(
            data.private_key,
            data.name,
            isCurrent,
            data.created_at
          )
        );
      });
    }
  }

  private async saveKeyPairs() {
    // convert list to look like
    // [ [<public_key>,{name: string, private_key: string, created_at: number}],
    //   [<public_key>,{...} ]]
    // so Object.fromEntries converts to {<public_key>: {name: string, private_key: string, created_at: number}}, ... }
    let filteredList = this.keypairs.filter(
      (keypair) => keypair.public_key != ""
    );
    let keys = Object.fromEntries(
      filteredList.map((keypair) => [
        keypair.public_key,
        {
          name: keypair.name,
          private_key: keypair.private_key,
          created_at: keypair.created_at,
        },
      ])
    );
    await saveKeys(keys);

    // and save current publickey
    let i = 0;
    for (i = 0; i < this.keypairs.length; i++) {
      let keypair = this.keypairs[i];
      // console.log(`loop: ${keypair}`);
      if (keypair.isCurrent) {
        // console.log("current found");
        break;
      }
    }

    if (i < this.keypairs.length) {
      // console.log(`saving ${i} ${this.keypairs[i]} as current`);
      await saveCurrentPubkey(this.keypairs[i].public_key);
    }
    // let current = this.keypairs.find((keypair) => {
    //   keypair.isCurrent;
    // });
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }

    return Storage.instance;
  }

  // returns undefined if not found
  public async getCurrentKey(): Promise<KeyPair> {
    await this.load();
    let current = this.keypairs.find((keypair) => keypair.isCurrent);
    return current;
  }

  public async getKey(pubkey: string): Promise<KeyPair> {
    await this.load();
    return this.keypairs.find((keypair) => keypair.public_key == pubkey);
  }

  public async getKeys(): Promise<KeyPair[]> {
    await this.load();
    return this.keypairs;
  }

  public async upsertKey(newKeypair: KeyPair) {
    await this.load();
    let existingKey = this.keypairs.find(
      (keypair) => keypair.private_key === newKeypair.private_key
    );

    // new isCurrent
    if (newKeypair.isCurrent) {
      this.keypairs.map((keypair) => {
        if (keypair.private_key != newKeypair.private_key)
          keypair.isCurrent = false;
      });
    }

    if (!existingKey) {
      // insert key
      this.keypairs.push(newKeypair);
    } else {
      // update key
      existingKey.name = newKeypair.name;
      existingKey.isCurrent = newKeypair.isCurrent;
    }

    return this.saveKeyPairs();
  }

  public async setCurrentPubkey(pubkey: string) {
    await this.load();
    let existingKey = this.keypairs.find(
      (keypair) => keypair.public_key === pubkey
    );

    if (!existingKey) throw new Error("Pubkey not found: " + pubkey);

    this.keypairs.map((keypair) => {
      keypair.isCurrent = keypair.public_key === pubkey;
    });

    return this.saveKeyPairs();
  }

  public async deleteKey(pubkey: string) {
    // console.log(`deleting pubkey ${pubkey}`);
    await this.load();

    let i = -1;

    // get index of element to delete
    for (i = 0; i < this.keypairs.length; i++) {
      if (this.keypairs[i].public_key === pubkey) break;
    }

    // ensure index in range
    if (i < 0 || i > this.keypairs.length - 1) return;

    // delete item
    // console.log(`Before delete i=${i}: ${JSON.stringify(this.keypairs)}`);
    this.keypairs.splice(i, 1);
    // console.log(`After delete: ${JSON.stringify(this.keypairs)}`);
    // set new current
    if (this.keypairs.length > 0) {
      this.keypairs[0].isCurrent = true;
    }

    return this.saveKeyPairs();
  }

  /* <!--- relays ---> */

  // { <url>: {read: boolean, write: boolean} }
  public async readRelays(pubkey: string): Promise<Relay[]> {
    let relays = await jsReadRelays(pubkey);
    let relayList: Relay[] = [];
    let relayEntries = [];

    if (relays) {
      let relayEntries = Object.entries<{
        read: boolean;
        write: boolean;
      }>(relays);

      relayEntries.map(([url, data]) => {
        relayList.push(new Relay(url, data.read, data.write));
      });
    }

    return relayList;
  }

  public async saveRelays(
    pubkey: string,
    relayList: Relay[]
  ): Promise<boolean> {
    // console.log(`saveRelays(${pubkey},${JSON.stringify(relayList)})`);
    let filteredList = relayList.filter((relay) => relay.url != "");
    let relays = Object.fromEntries(
      filteredList.map((relay) => [
        relay.url,
        {
          read: relay.read,
          write: relay.write,
        },
      ])
    );

    // console.log(`saveRelays relays ${JSON.stringify(relays)}`);

    await jsSaveRelays(pubkey, relays);
    return true;
  }
}

export default Storage;
