import browser from "webextension-polyfill";
import { IKeyPair, KeyPair } from "./model/keypair";
import { isKeyValid } from "./util";

/*** Local Storage ***/
class Storage {
  private static instance: Storage;

  private keypairs: IKeyPair[] = null;
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
    console.log("loadKeyPairs() called");

    this.keypairs = [];
    const data = await browser.storage.local.get("keypairs");
    if (data.keypairs && data.keypairs.length > 0) {
      data.keypairs.map((item: any) => {
        this.keypairs.push(
          new KeyPair(item.name, item.isCurrent, item.privatekey)
        );
      });
      console.log(
        "loadKeyPairs() loaded keys: " + JSON.stringify(this.keypairs)
      );
    }
  }

  private async saveKeyPairs() {
    let data = { keypairs: [] };
    this.keypairs.map((keypair: IKeyPair) => {
      data.keypairs.push({
        name: keypair.get_name(),
        isCurrent: keypair.get_isCurrent(),
        privatekey: keypair.get_privatekey(),
      });
    });
    console.log("saving data:" + JSON.stringify(data));
    await browser.storage.local.set(data);
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
  public async getCurrentKey(): Promise<IKeyPair> {
    await this.load();
    const current = this.keypairs.find((keypair) => keypair.get_isCurrent());
    return current;
  }

  public async getKey(pubkey: string): Promise<IKeyPair> {
    await this.load();
    const found = this.keypairs.find(
      (keypair) => keypair.get_publickey() == pubkey
    );
    return found;
  }

  public async getKeys(): Promise<IKeyPair[]> {
    await this.load();
    return this.keypairs;
  }

  public async upsertKey(newKeypair: IKeyPair) {
    await this.load();
    const existingKey = this.keypairs.find(
      (keypair) => keypair.get_privatekey() == newKeypair.get_privatekey()
    );

    // new isCurrent
    if (newKeypair.get_isCurrent()) {
      this.keypairs.map((keypair) => {
        keypair.set_isCurrent(false);
      });
    }

    if (!existingKey) {
      // insert key
      this.keypairs.push(newKeypair);
    } else {
      // update key
      existingKey.set_name(newKeypair.get_name());
      existingKey.set_isCurrent(newKeypair.get_isCurrent());
    }

    await this.saveKeyPairs();
  }

  public async setCurrentPubkey(pubkey: string) {
    await this.load();
    const existingKey = this.keypairs.find(
      (keypair) => keypair.get_publickey() == pubkey
    );

    if (!existingKey) throw new Error("Pubkey not found: " + pubkey);

    this.keypairs.map((keypair) => {
      keypair.set_isCurrent(keypair.get_publickey() == pubkey);
    });

    await this.saveKeyPairs();
  }

  public async deleteKey(pubkey: string) {
    console.log(`deleting pubkey ${pubkey}`);
    await this.load();

    let i = -1;

    // get index of element to delete
    for (i = 0; i < this.keypairs.length; i++) {
      if (this.keypairs[i].get_publickey() == pubkey) break;
    }

    // ensure index in range
    if (i < 0 || i > this.keypairs.length - 1) return;

    // delete item
    console.log(`Before delete i=${i}: ${JSON.stringify(this.keypairs)}`);
    this.keypairs.splice(i, 1);
    console.log(`After delete: ${JSON.stringify(this.keypairs)}`);
    // set new current
    if (this.keypairs.length > 0) {
      this.keypairs[0].set_isCurrent(true);
    }

    await this.saveKeyPairs();
  }
}

export default Storage;
