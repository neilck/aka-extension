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

/* <--- Profiles ---> */

// sort by order created asc
function compareProfiles(a, b) {
  if (a.details.created_at < b.details.created_at) return -1;
  if (a.details.created_at > b.details.created_at) return 1;
  return 0;
}

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

// returns {permissions: {[]}, relays: {[]}, ... }
export async function readProfile(pubkey) {
  let results = await browser.storage.local.get(pubkey);
  if (!results)
    throw Error("readProfile failed. Storage with key not found: " + pubkey);
  return results[pubkey];
}

// expects profileData = {permissions: {[]}, relays: {[]}, ... }
export async function saveProfile(pubkey, profileData) {
  let profile = {};
  profile[pubkey] = profileData;
  return browser.local.set(profile);
}

// returns current pubkey string, "" if not found
export async function readCurrentPubkey() {
  const result = await browser.storage.local.get("current_pubkey");
  if (result.current_pubkey) return result.current_pubkey;
  return "";
}

export async function saveCurrentPubkey(pubkey) {
  console.log(`saveCurrentPubkey() ${pubkey}`);
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

/* <--- Permissions ---> */

// return in order created
function comparePermissions(a, b) {
  if (a.policy.created_at < b.policy.created_at) return -1;
  if (a.policy.created_at > b.policy.created_at) return 1;
  return 0;
}

// returns [{ host: <host>, policy: {condition: string, level: number, created_at: number}}]
export async function readPermissions(pubkey) {
  let profile = await readProfile(pubkey);

  let { permissions = {} } = profile.permissions;

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
  return permissions;
}

export async function readPermissionLevel(pubkey, host) {
  let permissionList = await readPermissions(pubkey);
  let permission = permissionList.find(
    (permission) => permission.host === host
  );
  if (permission) return permission.policy.level;
  return 0;
}

// returns [{ host: <host>, policy: {condition: string, level: number, created_at: number}}]
export async function updatePermission(pubkey, host, policy) {
  let profile = await readProfile(pubkey);
  let permissions = profile.permissions;

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

export async function getPrivateKey(pubkey) {
  let profile = await readProfile(pubkey);
  return profile.private_key;
}

export async function getRelays(pubkey) {
  let profile = await readProfile(pubkey);
  return profile.relays;
}

export async function getProtocolHandler(pubkey) {
  let profile = await readProfile(pubkey);
  return profile.protocol_handler;
}
