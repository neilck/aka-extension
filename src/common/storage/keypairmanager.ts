import browser from "webextension-polyfill";
import { IKeyPair, KeyPair } from "./keypair";

export class KeyPairManager {
  localKey = "keypairs";
  local: any = null;
  keypairs: IKeyPair[] = [];

  constructor() {}

  async load() {
    this.local = browser.storage.local;
    const data = await this.local.get(this.localKey);
    console.log("load data:" + JSON.stringify(data));
    if (data.keypairs && data.keypairs.length > 0) {
      this.keypairs = [];
      data.keypairs.map((item: any) => {
        console.log("Item: " + JSON.stringify(item));
        this.keypairs.push(
          new KeyPair(item.name, item.isCurrent, item.privatekey)
        );
      });
    }
  }

  async save() {
    let data = { keypairs: [] };
    this.keypairs.map((keypair: IKeyPair) => {
      data.keypairs.push({
        name: keypair.get_name(),
        isCurrent: keypair.get_isCurrent(),
        privatekey: keypair.get_privatekey(),
      });
    });
    await this.local.set(data);
  }
}
