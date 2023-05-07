import browser from "webextension-polyfill";

export const NO_PERMISSIONS_REQUIRED = {
  replaceURL: true,
};

export const PERMISSIONS_REQUIRED = {
  getPublicKey: 1,
  getRelays: 5,
  signEvent: 10,
  "nip26.delegate": 10,
  "nip04.encrypt": 20,
  "nip04.decrypt": 20,
};

const ORDERED_PERMISSIONS = [
  [1, ["getPublicKey"]],
  [5, ["getRelays"]],
  [10, ["signEvent"]],
  [10, ["nip26.delegate"]],
  [20, ["nip04.encrypt"]],
  [20, ["nip04.decrypt"]],
];

const PERMISSION_NAMES = {
  getPublicKey: "read your public key",
  getRelays: "read your list of preferred relays",
  signEvent: "sign events using your private key",
  "nip04.encrypt": "encrypt messages to peers",
  "nip04.decrypt": "decrypt messages from peers",
  "nip26.delegate": "create key delegation tokens",
};

/* <--- Keys ---> */

// list of profiles in "keys"
// returns {<public_key>: {name: string, private_key: string, created_at: number}, ... }
export async function readKeys() {
  let results = await browser.storage.local.get("keys");
  return results.keys;
}

export async function saveKeys(keys) {
  return browser.storage.local.set({
    keys: keys,
  });
}

export async function getPrivateKey(pubkey) {
  // console.log(`getPrivateKey(${pubkey})`);
  let results = await browser.storage.local.get("keys");
  // console.log(`getPrivateKey results ${JSON.stringify(results)}`);

  let key = results.keys[pubkey];
  // console.log(`getPrivateKey results[pubkey] ${JSON.stringify(key)}`);
  if (!key) return "";

  return key.private_key;
}

/* <--- Profiles ---> */

// returns {permissions: {[]}, relays: {[]}, ... }
export async function readProfile(pubkey) {
  // console.log(`readProfile(${pubkey})`);
  let results = await browser.storage.local.get(pubkey);

  // if profile doesn't exist, create and save
  if (!results[pubkey]) {
    let profileData = { permissions: {}, relays: {}, protocol_handler: "" };
    saveProfile(pubkey, profileData);
    // console.log(
    //   `readProfile(${pubkey}) returning new profile ${JSON.stringify(
    //     profileData
    //   )}`
    // );
    return profileData;
  }

  // console.log(
  //   `readProfile(${pubkey}) returning ${JSON.stringify(results[pubkey])}`
  // );
  return results[pubkey];
}

// expects profileData = {permissions: {[]}, relays: {[]}, ... }
export async function saveProfile(pubkey, profileData) {
  let profile = {};
  profile[pubkey] = profileData;
  return browser.storage.local.set(profile);
}

// returns current pubkey string, "" if not found
export async function readCurrentPubkey() {
  const result = await browser.storage.local.get("current_pubkey");
  if (result.current_pubkey) return result.current_pubkey;
  return "";
}

export async function saveCurrentPubkey(pubkey) {
  // console.log(`saveCurrentPubkey() ${pubkey}`);
  return browser.storage.local.set({
    current_pubkey: pubkey,
  });
}

export function getAllowedCapabilities(permission) {
  let requestedMethods = [];
  for (let i = 0; i < ORDERED_PERMISSIONS.length; i++) {
    let [perm, methods] = ORDERED_PERMISSIONS[i];
    if (perm > permission) break;
    requestedMethods = requestedMethods.concat(methods);
  }

  if (requestedMethods.length === 0) return "nothing";

  return requestedMethods.map((method) => PERMISSION_NAMES[method]);
}

export function getPermissionsString(permission) {
  let capabilities = getAllowedCapabilities(permission);

  if (capabilities.length === 0) return "none";
  if (capabilities.length === 1) return capabilities[0];

  return (
    capabilities.slice(0, -1).join(", ") +
    " and " +
    capabilities[capabilities.length - 1]
  );
}

// returns [{ host: <host>, policy: {condition: string, level: number, created_at: number}}]
export async function readPermissions(pubkey) {
  console.log(`readPermissions(${pubkey})`);
  let profile = await readProfile(pubkey);
  if (profile === null) {
    console.log(`readPermissions(${pubkey}) returning null`);
    return null;
  }

  let permissions = profile.permissions;

  // delete expired
  var needsUpdate = false;
  for (let host in permissions) {
    if (
      permissions[host].condition === "expirable" &&
      permissions[host].created_at < Date.now() / 1000 - 5 * 60
    ) {
      delete permissions[host];
      needsUpdate = true;
    }
  }

  if (needsUpdate) await saveProfile(pubkey, profile);
  console.log(
    `readPermissions(${pubkey}) returning ${JSON.stringify(permissions)}`
  );
  return permissions;
}

export async function readPermissionLevel(pubkey, host) {
  // console.log(`readPermissionLevel(${pubkey},${host})`);

  let permissions = await readPermissions(pubkey);
  // console.log(`readPermissionLevel permissions ${JSON.stringify(permissions)}`);

  let hostPermission = permissions[host];
  // console.log(
  //   `readPermissionLevel hostPermission ${JSON.stringify(hostPermission)}`
  // );

  if (hostPermission === undefined) {
    // console.log(`readPermissionLevel(${pubkey},${host}) returning 0`);
    return 0;
  }

  // console.log(
  //   `readPermissionLevel(${pubkey},${host}) returning ${hostPermission.level}`
  // );
  return hostPermission.level;
}

// returns [{ host: <host>, policy: {condition: string, level: number, created_at: number}}]
export async function updatePermission(pubkey, host, policy) {
  let profile = await readProfile(pubkey);
  let permissions = {};
  // if profile exists
  if (profile === null) {
    throw Error("Profile does not exist " + pubkey);
  }
  permissions = profile.permissions;
  permissions[host] = {
    ...policy,
    created_at: Math.round(Date.now() / 1000),
  };

  saveProfile(pubkey, profile);
}

export async function removePermissions(pubkey, host) {
  let profile = await readProfile(pubkey);
  let permissions = profile.permissions;

  delete permissions[host];
  saveProfile(pubkey, profile);
}

export async function readRelays(pubkey) {
  // console.log(`readRelays(${pubkey})`);
  let profile = await readProfile(pubkey);
  if (profile === null) {
    // console.log(`readRelays(${pubkey}) returning null`);
    return null;
  }

  return profile.relays;
}

export async function saveRelays(pubkey, relays) {
  let profile = await readProfile(pubkey);

  if (profile === null) {
    throw Error("Profile does not exist " + pubkey);
  }

  profile.relays = relays;
  return saveProfile(pubkey, profile);
}

export async function getProtocolHandler(pubkey) {
  let profile = await readProfile(pubkey);
  if (profile === null) {
    // console.log(`getProtocolHandler(${pubkey}) returning null`);
    return null;
  }
  return profile.protocol_handler;
}
