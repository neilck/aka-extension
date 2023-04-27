import browser from "webextension-polyfill";
import { IKeyPair, KeyPair } from "./model/keypair";

/*** Local Storage ***/

export async function loadKeyPairs() {
  let keypairs: IKeyPair[] = [];
  const data = await browser.storage.local.get("keypairs");
  console.log("loading data:" + JSON.stringify(data));
  if (data.keypairs && data.keypairs.length > 0) {
    data.keypairs.map((item: any) => {
      keypairs.push(new KeyPair(item.name, item.isCurrent, item.privatekey));
    });
  }
  return keypairs;
}

export async function saveKeyPairs(keypairs: IKeyPair[]) {
  let data = { keypairs: [] };
  keypairs.map((keypair: IKeyPair) => {
    data.keypairs.push({
      name: keypair.get_name(),
      isCurrent: keypair.get_isCurrent(),
      privatekey: keypair.get_privatekey(),
    });
  });
  console.log("saving data:" + JSON.stringify(data));
  await browser.storage.local.set(data);
}
