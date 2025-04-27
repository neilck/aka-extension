import browser from "webextension-polyfill";

export const NO_PERMISSIONS_REQUIRED = {
  replaceURL: true,
  getSharedPublicKeys: true,
};

export const PERMISSION_NAMES = {
  getPublicKey: "read your public key",
  getRelays: "read your list of preferred relays",
  signEvent: "sign events using your private key",
  signString: "sign messages using your private key",
  "nip04.encrypt": "encrypt messages to peers",
  "nip04.decrypt": "decrypt messages from peers",
  "nip44.encrypt": "encrypt messages to peers",
  "nip44.decrypt": "decrypt messages from peers",
  "nip60.signSecret": "sign cashu secrets using your private key",
};

function matchConditions(conditions, event) {
  if (conditions?.kinds) {
    if (event.kind in conditions.kinds) return true;
    else return false;
  }

  return true;
}

export async function getPermissionStatus(pubkey, host, type, event) {
  // console.log("getPermissionStatus calling readProfile: " + pubkey);
  let profile = await readProfile(pubkey);
  // console.log("getPermissionStatus profile: " + JSON.stringify(profile));
  // if profile exists
  if (profile === null) {
    throw Error("Profile does not exist " + pubkey);
  }
  let policies = profile.policies;
  // console.log("getPermissionStatus policies:" + JSON.stringify(policies));
  let answers = [true, false];
  for (let i = 0; i < answers.length; i++) {
    let accept = answers[i];
    let { conditions } = policies?.[host]?.[accept]?.[type] || {};

    if (conditions) {
      if (type === "signEvent") {
        if (matchConditions(conditions, event)) {
          return accept; // may be true or false
        } else {
          // if this doesn't match we just continue so it will either match for the opposite answer (reject)
          // or it will end up returning undefined at the end
          continue;
        }
      } else {
        return accept; // may be true or false
      }
    }
  }

  return undefined;
}

// returns [{ host: <host>, policy: {condition: string, level: number, created_at: number}}]
export async function updatePermission(pubkey, host, type, accept, conditions) {
  let profile = await readProfile(pubkey);

  // if profile exists
  if (profile === null) {
    throw Error("Profile does not exist " + pubkey);
  }
  let policies = profile.policies;

  // if the new conditions is "match everything", override the previous
  if (Object.keys(conditions).length === 0) {
    conditions = {};
  } else {
    // if we already had a policy for this, merge the conditions
    let existingConditions = policies[host]?.[accept]?.[type]?.conditions;
    if (existingConditions) {
      if (existingConditions.kinds && conditions.kinds) {
        Object.keys(existingConditions.kinds).forEach((kind) => {
          conditions.kinds[kind] = true;
        });
      }
    }
  }

  // if we have a reverse policy (accept / reject) that is exactly equal to this, remove it
  let other = !accept;
  let reverse = policies?.[host]?.[other]?.[type];
  if (
    reverse &&
    JSON.stringify(reverse.conditions) === JSON.stringify(conditions)
  ) {
    delete policies[host][other][type];
  }

  // insert our new policy
  policies[host] = policies[host] || {};
  policies[host][accept] = policies[host][accept] || {};
  policies[host][accept][type] = {
    conditions, // filter that must match the event (in case of signEvent)
    created_at: Math.round(Date.now() / 1000),
  };

  profile.policies = policies;
  saveProfile(pubkey, profile);
}

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

export async function hasPublicKey(pubkey) {
  let data = await browser.storage.local.get("keys");

  // Check if data exists and pubkey is a property
  const keys = data?.keys;
  if (!keys || !keys.hasOwnProperty(pubkey)) {
    return false;
  }

  const key = keys[pubkey];
  if (!keys || !keys.hasOwnProperty(pubkey)) {
    return false;
  }

  return true;
}

export async function getPrivateKey(pubkey) {
  let results = await browser.storage.local.get("keys");
  let key = results.keys[pubkey];
  if (!key) return "";

  return key.private_key;
}

// returns all pubkeys for host with getPublicKey permission
export async function getSharedPublicKeys(host) {
  // console.log(`getSharedPublicKeys host: ${host}`);
  // Step 1: Retrieve the 'keys' data from localStorage and parse it
  const keysObject = await browser.storage.local.get("keys");

  // Extract the public key values as an array
  const publicKeys = Object.keys(keysObject.keys);

  // Step 2: Filter public keys that have the "getPublicKey" condition in localStorage
  const result = [];
  for (let i = 0; i < publicKeys.length; i++) {
    const pubkey = publicKeys[i];
    const record = await browser.storage.local.get(pubkey);
    if (record[pubkey].policies?.[host]?.true?.getPublicKey !== undefined) {
      result.push(pubkey);
    }
  }

  // Step 3: Return only the public key values where the above condition is true
  return result;
}

/* <--- Profiles ---> */

const PROFILE_DEFAULT_COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ffbc42', '#d81159', '#293241', '#4e148c'];

export function getDefaultColor(npub) {
  // Use last 4 chars of npub as a simple hash
  if (npub) {
    const hash = npub.slice(-4);
    const index = parseInt(hash, 16) % PROFILE_DEFAULT_COLORS.length;
    return PROFILE_DEFAULT_COLORS[index];
  }
  return PROFILE_DEFAULT_COLORS[Date.now() % PROFILE_DEFAULT_COLORS.length];
}

function schemaUpdate(pubkey, profileData) {
  let needsSave = false;

  // from version < 1.0.4
  if (profileData.permissions) {
    delete profileData.permissions;
    needsSave = true;
  }

  if (!profileData.policies) {
    profileData.policies = {};
    needsSave = true;
  }

  if (!profileData.relays) {
    profileData.relays = {};
    needsSave = true;
  }

  if (profileData.protocol_handler === undefined) {
    profileData.protocol_handler = "";
    needsSave = true;
  }

  if (profileData.color === undefined) {
    profileData.color = getDefaultColor(pubkey);
    needsSave = true;
  }

  if (needsSave) {
    // console.log( "schemaUpdate updating profile: " + stringify.JSON(profileData) );
    saveProfile(pubkey, profileData);
  } else {
    // console.log("schemaUpdate pass, no schema update needed");
  }
  return profileData;
}

// returns {polides: {[{}]}, relays: {[]}, ... }
export async function readProfile(pubkey) {
  let profileDataWithKey = await browser.storage.local.get(pubkey);

  if (!profileDataWithKey) {
    let profileData = { policies: {}, relays: {}, protocol_handler: "" };

    saveProfile(pubkey, profileData);
    return profileData;
  } else {
    let profileData = profileDataWithKey[pubkey];
    profileData = schemaUpdate(pubkey, profileData);
    return profileData;
  }
}

// expects profileData = {policies: {[]}, relays: {[]}, ... }
export async function saveProfile(pubkey, profileData) {
  let profile = {};
  profile[pubkey] = profileData;
  // console.log("saveProfile: " + profile);
  return browser.storage.local.set(profile);
}

export async function removeProfile(pubkey) {
  return browser.storage.local.remove(pubkey);
}

// returns current pubkey string, "" if not found
export async function readCurrentPubkey() {
  const result = await browser.storage.local.get("current_pubkey");
  if (result.current_pubkey) return result.current_pubkey;
  return "";
}

// returns current pubkey string, "" if not found
export async function removeCurrentPubkey() {
  return browser.storage.local.remove("current_pubkey");
}

export async function saveCurrentPubkey(pubkey) {
  return browser.storage.local.set({
    current_pubkey: pubkey,
  });
}

export async function removePermissions(pubkey, host, accept, type) {
  let profile = await readProfile(pubkey);
  let policies = profile.policies;
  delete policies[host]?.[accept]?.[type];
  profile.policies = policies;
  saveProfile(pubkey, profile);
}

export async function readRelays(pubkey) {
  let profile = await readProfile(pubkey);
  if (profile === null) {
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
    return null;
  }
  return profile.protocol_handler;
}

export async function getPosition(width, height) {
  let left = 0;
  let top = 0;

  try {
    const lastFocused = await browser.windows.getLastFocused();

    if (
      lastFocused &&
      lastFocused.top !== undefined &&
      lastFocused.left !== undefined &&
      lastFocused.width !== undefined &&
      lastFocused.height !== undefined
    ) {
      // Position window in the center of the lastFocused window
      top = Math.round(lastFocused.top + (lastFocused.height - height) / 2);
      left = Math.round(lastFocused.left + (lastFocused.width - width) / 2);
    } else {
      console.error("Last focused window properties are undefined.");
    }
  } catch (error) {
    console.error("Error getting window position:", error);
  }

  return {
    top,
    left,
  };
}

// Enable or disable the recents feature explicitly
export async function setRecentsEnabled(isEnabled) {
  await browser.storage.local.set({ recentsEnabled: isEnabled });
  if (!isEnabled) {
    await clearRecents();
  }
}

// Check if the recents feature is enabled, defaulting to 'on' if not set
export async function isRecentsEnabled() {
  const { recentsEnabled } = await browser.storage.local.get("recentsEnabled");

  // If recentsEnabled is undefined, default to enabling the feature
  if (recentsEnabled === undefined) {
    await setRecentsEnabled(true);
    return true;
  }

  return recentsEnabled === true;
}

// Save a recent entry if the feature is enabled
export async function saveRecent(host, protocol, pubkey) {
  if (!(await isRecentsEnabled())) return;

  const recents = await getRecents("");

  // Find the index of an existing entry with the same host and pubkey
  const existingIndex = recents.findIndex(
    (entry) =>
      entry.host === host &&
      entry.protocol === protocol &&
      entry.pubkey === pubkey
  );

  // If the entry exists, remove it from its current position
  if (existingIndex !== -1) {
    recents.splice(existingIndex, 1);
  }

  // Add the entry to the front of the list
  const newEntry = { host, protocol, pubkey };
  const updatedRecents = [newEntry, ...recents];

  // Keep only the last 100 entries
  if (updatedRecents.length > 100) {
    updatedRecents.splice(100);
  }

  // Save the updated recents array to local storage
  await browser.storage.local.set({ recents: updatedRecents });
}

export async function getRecents(pubkey) {
  if (!(await isRecentsEnabled())) return [];

  // Retrieve the 'recents' data from storage
  const { recents = [] } = await browser.storage.local.get("recents");

  // Filter by 'pubkey' if provided
  const filteredRecents = pubkey
    ? recents.filter((element) => element.pubkey === pubkey)
    : recents;

  // Return the most recent 5 entries (most recent first)
  return filteredRecents.slice(0, 10);
}

// Clear all recent entries
export async function clearRecents() {
  await browser.storage.local.remove("recents");
}
