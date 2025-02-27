import browser from "webextension-polyfill";
import { KeyPair } from "./model/KeyPair";
import { Relay } from "./model/Relay";
import { Policy } from "./model/Policy";
import { Profile } from "./model/Profile";

import {
  readKeys,
  readCurrentPubkey,
  saveKeys,
  saveCurrentPubkey,
  readRelays as jsReadRelays,
  saveRelays as jsSaveRelays,
  removePermissions as jsRemovePermissions,
  removeCurrentPubkey as jsRemoveCurrentPubkey,
  removeProfile as jsRemoveProfile,
  readProfile as jsReadProfile,
} from "./common";

export async function saveKeyPairs(keypairs: KeyPair[]) {
  // convert list to look like
  // [ [<public_key>,{name: string, private_key: string, created_at: number}],
  //   [<public_key>,{...} ]]
  // so Object.fromEntries converts to {<public_key>: {name: string, private_key: string, created_at: number}}, ... }
  // maybe ""
  // console.log("saveKeyPairs called");
  const oldCurrentKey = await readCurrentPubkey();
  // console.log(`saveKeyPairs oldCurrentKey: ${oldCurrentKey}`);

  if (keypairs.length === 0) {
    await jsRemoveCurrentPubkey();
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

  let newCurrentKeyPair: KeyPair | undefined = undefined;
  let i = 0;
  for (i = 0; i < keypairs.length; i++) {
    let keypair = keypairs[i];
    if (keypair.isCurrent) {
      newCurrentKeyPair = keypairs[i];
      break;
    }
  }

  // console.log(`saveKeyPairs newCurrentKeyPair: ${newCurrentKeyPair} ${i}`);

  if (i < keypairs.length) {
    await saveCurrentPubkey(newCurrentKeyPair.public_key);
  }

  // sent message to background.js that account has changed
  const newCurrentKey = newCurrentKeyPair ? newCurrentKeyPair.public_key : "";
  // console.log(`saveKeyPairs current key, before:${oldCurrentKey} after:${newCurrentKey}`);
  if (oldCurrentKey != newCurrentKey) {
    // console.log(`saveKeyPairs sending accountChanged`);
    browser.runtime.sendMessage({
      accountChanged: true,
      profileChanged: true,
    });
  } else {
  }
}

/* <!--- KEYS ---> */
export async function getKeys(): Promise<KeyPair[]> {
  // {<public_key>: {name: string, private_key: string, created_at: number}}, ... }
  let keys = (await readKeys()) as any;
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

/* <!-- Profiles ---> */
export async function getProfile(pubkey: string): Promise<Profile> {
  let profile: Profile = { relays: [], policies: [], protocol_handler: "", color: "" };

  const profileObject = (await jsReadProfile(pubkey)) as any;

  // protocol_handler
  profile.protocol_handler = profileObject.protocol_handler;
  profile.color = profileObject.color || "";

  // relays
  let relays = profileObject.relays as any;
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
  profile.relays = relayList;

  // permissions
  let policies = profileObject.policies as any;
  let list: Policy[] = [];

  Object.entries(policies).forEach(([host, accepts]) => {
    Object.entries(accepts).forEach(([accept, types]) => {
      // @ts-ignore
      Object.entries(types).forEach(([type, { conditions, created_at }]) => {
        list.push({
          host,
          type,
          accept,
          conditions,
          created_at,
        });
      });
    });
  });

  list.sort((a, b) => {
    if (a.created_at > b.created_at) return -1;
    return 1;
  });

  profile.policies = list;

  return profile;
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

export function getRelaysFromProfile(profile: { relays: {} }): Relay[] {
  let relays = profile.relays;
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

  await jsSaveRelays(pubkey, relays);
  return true;
}

export async function deletePermission(
  pubkey: string,
  host: string,
  accept: string,
  type: string
) {
  return jsRemovePermissions(pubkey, host, accept, type);
  return true;
}
