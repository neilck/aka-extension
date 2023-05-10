import browser from "webextension-polyfill";
import { KeyPair } from "./model/KeyPair";
import { Relay } from "./model/Relay";
import { Permission } from "./model/Permission";

import {
  readKeys,
  readCurrentPubkey,
  saveKeys,
  saveCurrentPubkey,
  readRelays as jsReadRelays,
  saveRelays as jsSaveRelays,
  readPermissions as jsReadPermissions,
  removePermissions as jsRemovePermissions,
  removeCurrentPubkey as jsRemoveCurrentPubkey,
  removeProfile as jsRemoveProfile,
} from "./common";

export async function saveKeyPairs(keypairs: KeyPair[]) {
  // convert list to look like
  // [ [<public_key>,{name: string, private_key: string, created_at: number}],
  //   [<public_key>,{...} ]]
  // so Object.fromEntries converts to {<public_key>: {name: string, private_key: string, created_at: number}}, ... }
  if (keypairs.length === 0) {
    jsRemoveCurrentPubkey();
  }

  let filteredList = keypairs.filter((keypair) => keypair.public_key != "");
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
  for (i = 0; i < keypairs.length; i++) {
    let keypair = keypairs[i];
    // console.log(`loop: ${keypair}`);
    if (keypair.isCurrent) break;
  }

  if (i < keypairs.length) {
    // console.log(`saving ${i} ${keypairs[i]} as current`);
    await saveCurrentPubkey(keypairs[i].public_key);
  }
}

/* <!--- KEYS ---> */
export async function getKeys(): Promise<KeyPair[]> {
  // {<public_key>: {name: string, private_key: string, created_at: number}}, ... }
  let keys = await readKeys();
  let currentPubkey = await readCurrentPubkey();
  let keypairs: KeyPair[] = [];

  if (keys) {
    let keyList = Object.entries<{
      name: string;
      private_key: string;
      created_at: number;
    }>(keys);

    keyList.map(([public_key, data]) => {
      let isCurrent = public_key === currentPubkey;
      keypairs.push(
        KeyPair.initKeyPair(
          data.private_key,
          data.name,
          isCurrent,
          data.created_at
        )
      );
    });
  }
  return keypairs;
}

// returns undefined if not found
export async function getCurrentKey(): Promise<KeyPair> {
  let keypairs = await getKeys();
  let current = keypairs.find((keypair) => keypair.isCurrent);
  return current;
}

export async function getKey(pubkey: string): Promise<KeyPair> {
  let keypairs = await getKeys();
  return keypairs.find((keypair) => keypair.public_key === pubkey);
}

export async function upsertKey(newKeypair: KeyPair) {
  let keypairs = await getKeys();
  let existingKey = keypairs.find(
    (keypair) => keypair.private_key === newKeypair.private_key
  );

  // new isCurrent
  if (newKeypair.isCurrent) {
    keypairs.map((keypair) => {
      if (keypair.private_key != newKeypair.private_key)
        keypair.isCurrent = false;
    });
  }

  if (!existingKey) {
    // insert key
    keypairs.push(newKeypair);
  } else {
    // update key
    existingKey.name = newKeypair.name;
    existingKey.isCurrent = newKeypair.isCurrent;
  }

  return saveKeyPairs(keypairs);
}

export async function setCurrentPubkey(pubkey: string) {
  let keypairs = await getKeys();
  let existingKey = keypairs.find((keypair) => keypair.public_key === pubkey);

  if (!existingKey) throw new Error("Pubkey not found: " + pubkey);

  keypairs.map((keypair) => {
    keypair.isCurrent = keypair.public_key === pubkey;
  });

  return saveKeyPairs(keypairs);
}

export async function deleteKey(pubkey: string) {
  let keypairs = await getKeys();

  // delete associated profile
  await jsRemoveProfile(pubkey);

  // get index of element to delete
  let i = -1;
  for (i = 0; i < keypairs.length; i++) {
    if (keypairs[i].public_key === pubkey) break;
  }

  // ensure index in range
  if (i < 0 || i > keypairs.length - 1) return;

  // delete item
  keypairs.splice(i, 1);

  // set new current
  if (keypairs.length > 0) {
    keypairs[0].isCurrent = true;
  }

  return saveKeyPairs(keypairs);
}

/* <!--- RELAYS ---> */

// { <url>: {read: boolean, write: boolean} }
export async function readRelays(pubkey: string): Promise<Relay[]> {
  let relays = await jsReadRelays(pubkey);
  let relayList: Relay[] = [];
  let relayEntries = [];

  if (relays) {
    relayEntries = Object.entries<{
      read: boolean;
      write: boolean;
    }>(relays);

    relayEntries.map(([url, data]) => {
      relayList.push(new Relay(url, data.read, data.write));
    });
  }

  return relayList;
}

export async function saveRelays(
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

/* <!--- PERMISSIONS ---> */
// { <url>: {read: boolean, write: boolean} }
// <host>: {condition: string, level: number, created_at: number}
export async function readPermissions(pubkey: string): Promise<Permission[]> {
  let permissions = await jsReadPermissions(pubkey);
  let permissionList: Permission[] = [];
  let permissionEntries = [];

  if (permissions) {
    permissionEntries = Object.entries<{
      condition: string;
      level: number;
      created_at: number;
    }>(permissions);

    permissionEntries.map(([host, data]) => {
      permissionList.push(
        new Permission(host, data.condition, data.level, data.created_at)
      );
    });
  }

  return permissionList;
}

export async function deletePermission(pubkey: string, host: string) {
  return jsRemovePermissions(pubkey, host);
}
