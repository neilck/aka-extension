import browser from "webextension-polyfill";

export const NO_PERMISSIONS_REQUIRED = {
  replaceURL: true,
};

export const PERMISSION_NAMES = {
  getPublicKey: "read your public key",
  getRelays: "read your list of preferred relays",
  signEvent: "sign events using your private key",
  "nip04.encrypt": "encrypt messages to peers",
  "nip04.decrypt": "decrypt messages from peers",
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

export async function getPrivateKey(pubkey) {
  let results = await browser.storage.local.get("keys");
  let key = results.keys[pubkey];
  if (!key) return "";

  return key.private_key;
}

/* <--- Profiles ---> */

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
  // console.log("readProfile fetching data from localStorage: " + pubkey);
  let profileDataWithKey = await browser.storage.local.get(pubkey);
  if (!profileDataWithKey) {
    let profileData = { policies: {}, relays: {}, protocol_handler: "" };
    // console.log("readProfile initializing localStorage profile: " + pubkey);
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

// returns current pubkey string, "" if not found
export async function getCurrentOptionsPubkey() {
  let result = await browser.storage.local.get("current_options_pubkey");
  if (result.current_options_pubkey) return result.current_options_pubkey;
  return "";
}

export async function saveCurrentOptionsPubkey(pubkey) {
  return browser.storage.local.set({
    current_options_pubkey: pubkey,
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
