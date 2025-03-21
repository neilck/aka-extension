import browser from "webextension-polyfill";
import { validateEvent, finalizeEvent } from "nostr-tools/pure";
import * as nip19 from "nostr-tools/nip19";
import * as nip04 from "nostr-tools/nip04";
import * as nip44 from "nostr-tools/nip44";

import { Mutex } from "async-mutex";
import { LRUCache } from "./utils";

import {sha256} from "@noble/hashes/sha256";
import {bytesToHex} from "@noble/hashes/utils";
import {schnorr} from "@noble/curves/secp256k1";

import {
  NO_PERMISSIONS_REQUIRED,
  updatePermission,
  getPrivateKey,
  hasPublicKey,
  readRelays,
  getProtocolHandler,
  readCurrentPubkey,
  getPermissionStatus,
  getSharedPublicKeys,
  getPosition,
  isRecentsEnabled,
  saveRecent,
  readProfile as jsReadProfile,
} from "../common/common";

let openPrompt = null;
let promptMutex = new Mutex();
let releasePromptMutex = () => {};
let secretsCache = new LRUCache(100);
let previousSk = null;

function getSharedSecret(sk, peer) {
  // Detect a key change and erase the cache if they changed their key
  if (previousSk !== sk) {
    secretsCache.clear();
  }

  let key = secretsCache.get(peer);

  if (!key) {
    key = nip44.v2.utils.getConversationKey(sk, peer);
    secretsCache.set(peer, key);
  }

  return key;
}

async function updateProfileDot() {
  let profile = await jsReadProfile(await readCurrentPubkey());
  let color = profile.color;

  if (color) {
    chrome.action.setBadgeText({ text: " " });
    chrome.action.setBadgeBackgroundColor({ color: color });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

browser.runtime.onStartup.addListener(async () => {
  await updateProfileDot();
});

browser.runtime.onInstalled.addListener(async (_, __, reason) => {
  if (reason === "install") {
    browser.runtime.openOptionsPage();
  }
  await updateProfileDot();
});

browser.runtime.onMessage.addListener(async (req, sender) => {
  let { profileChanged, accountChanged } = req;

  let handled = false;
  if (profileChanged) {
    await updateProfileDot();
    handled = true;
  }

  if (accountChanged) {
    // console.log("[bg] received accountChanged: " + JSON.stringify(req));
    sendAccountChanged();
    handled = true;
  }

  if (handled) {
    return true;
  }

  let { prompt } = req;

  if (prompt) {
    return handlePromptMessage(req, sender);
  } else {
    return handleContentScriptMessage(req);
  }
});

async function sendAccountChanged() {
  // send to contentScript
  const tabs = await chrome.tabs.query({});
  const mesg = {
    accountChanged: true,
  };
  // console.log("[bg] sending accountChanged to tabs " + tabs.length);

  for (const tab of tabs) {
    if (!tab.id) return;
    try {
      // send message to tab
      const response = await browser.tabs.sendMessage(tab.id, mesg);
    } catch (e) {
      // console.log("Warning: ", e);
    }
  }
}

browser.runtime.onMessageExternal.addListener(
  async ({ type, params }, sender) => {
    let extensionId = new URL(sender.url).host;
    return handleContentScriptMessage({ type, params, host: extensionId });
  }
);

browser.windows.onRemoved.addListener((windowId) => {
  if (openPrompt) {
    // calling this with a simple "no" response will not store anything, so it's fine
    // it will just return a failure
    handlePromptMessage({ accept: false }, null);
  }
});

async function handleContentScriptMessage({ type, params, host, protocol }) {
  // if pubic specified in event for signing, use that
  // otherwise current pubkey
  let pubkey = "";
  let pubkeySpecified = false;
  if (type === "signEvent" && typeof params?.event?.pubkey === "string") {
    pubkey = params.event.pubkey;
    const pubkeyFound = await hasPublicKey(pubkey);

    if (!pubkeyFound) {
      return {
        error: { message: "denied" },
      };
    } else {
      pubkeySpecified = true;
    }
  } else {
    pubkey = await readCurrentPubkey();
  }

  // console.log(
  //   "[bg.hcsm] message received, pubkey: " + pubkey + " type " + type
  // );
  if (NO_PERMISSIONS_REQUIRED[type]) {
    // authorized, and we won't do anything with private key here, so do a separate handler
    switch (type) {
      case "replaceURL": {
        let { protocol_handler: ph } = await getProtocolHandler(pubkey);
        if (!ph) return false;

        let { url } = params;
        let raw = url.split("nostr:")[1];
        let { type, data } = nip19.decode(raw);
        let replacements = {
          raw,
          hrp: type,
          hex:
            type === "npub" || type === "note"
              ? data
              : type === "nprofile"
              ? data.pubkey
              : type === "nevent"
              ? data.id
              : null,
          p_or_e: { npub: "p", note: "e", nprofile: "p", nevent: "e" }[type],
          u_or_n: { npub: "u", note: "n", nprofile: "u", nevent: "n" }[type],
          relay0: type === "nprofile" ? data.relays[0] : null,
          relay1: type === "nprofile" ? data.relays[1] : null,
          relay2: type === "nprofile" ? data.relays[2] : null,
        };
        let result = ph;
        Object.entries(replacements).forEach(([pattern, value]) => {
          result = result.replace(new RegExp(`{ *${pattern} *}`, "g"), value);
        });

        return result;
      }
      case "getSharedPublicKeys": {
        const result = await getSharedPublicKeys(host);
        return result;
      }
    }
    return;
  } else {
    // acquire mutex here before reading policies
    releasePromptMutex = await promptMutex.acquire();

    // console.log("[bg] calling getPermissionStatus");

    if (pubkey == "") {
      releasePromptMutex();
      return { error: { message: "no public key" } };
    }

    // console.log(`GetPermissionStatus ${pubkey} ${host} ${type}`);
    let allowed = await getPermissionStatus(
      pubkey,
      host,
      type,
      type === "signEvent" ? params.event : undefined
    );

    // console.log("allowed: " + allowed);

    if (allowed == true) {
      releasePromptMutex();
    } else if (allowed === false) {
      // denied, just refuse immediately
      releasePromptMutex();
      return { error: { message: "denied" } };
    } else {
      // ask for authorization
      try {
        let id = Math.random().toString().slice(4);
        let qs = new URLSearchParams({
          host,
          id,
          params: JSON.stringify(params),
          type,
        });

        // center prompt
        const { top, left } = await getPosition(360, 620);

        // prompt will be resolved with true or false
        let accept = await new Promise((resolve, reject) => {
          openPrompt = { resolve, reject };

          browser.windows.create({
            url: `${browser.runtime.getURL("prompt.html")}?${qs.toString()}`,
            type: "popup",
            width: 360,
            height: 620,
            top: top,
            left: left,
          });
        });

        // denied, stop here
        if (!accept) return { error: { message: "denied" } };
      } catch (error) {
        // errored, stop here
        releasePromptMutex();
        return {
          error: { message: error.message, stack: error.stack },
        };
      }
    }
  }

  // if we're here this means it was accepted
  // console.log(`[hcsm] getPrivateKey(${pubkey}) `);

  // pubkey may be changed during prompt
  if (!pubkeySpecified) {
    pubkey = await readCurrentPubkey();
  }

  let sk = await getPrivateKey(pubkey);
  // console.log(`[hcsm] private key length ${sk.length}) `);
  if (!sk) {
    return { error: { message: "private key missing" } };
  }

  let lib = "x";

  try {
    switch (type) {
      case "getPublicKey": {
        if (isRecentsEnabled() && protocol) {
          saveRecent(host, protocol, pubkey);
        }
        return pubkey;
      }
      case "getRelays": {
        let relays = await readRelays(pubkey);
        return relays || {};
      }
      case "signEvent": {
        lib = "nostr-tools/pure";
        const event = finalizeEvent(params.event, sk);

        return validateEvent(event)
          ? event
          : { error: { message: "invalid event" } };
      }
      case "signString": {
        if (typeof params.message !== 'string') {
          return { error: { message: "message is not a string" } };
        }
        try {
            // Check this is not a stringified event
            // trying to bypass permission checks
            const obj = JSON.parse(params.message);
            if (validateEvent(obj)){
              return { error: { message: "use signEvent() to sign events" } };
            }
        } catch (e) {} // not a JSON string
        const utf8Encoder = new TextEncoder();
        const hash = bytesToHex(sha256(utf8Encoder.encode(params.message)));
        const sig = bytesToHex(schnorr.sign(hash, sk));
        const pubkey = bytesToHex(schnorr.getPublicKey(sk));
        return {hash: hash, sig: sig, pubkey: pubkey};
      }
      case "nip04.encrypt": {
        let { peer, plaintext } = params;
        lib = "nostr-tools/nip04";
        return await nip04.encrypt(sk, peer, plaintext);
      }
      case "nip04.decrypt": {
        let { peer, ciphertext } = params;
        lib = "nostr-tools/nip04";
        return await nip04.decrypt(sk, peer, ciphertext);
      }
      case "nip44.encrypt": {
        const { peer, plaintext } = params;
        lib = "nostr-tools/nip44";
        const key = getSharedSecret(sk, peer);

        return nip44.v2.encrypt(plaintext, key);
      }
      case "nip44.decrypt": {
        const { peer, ciphertext } = params;
        lib = "nostr-tools/nip44";
        const key = getSharedSecret(sk, peer);

        return nip44.v2.decrypt(ciphertext, key);
      }
    }
  } catch (error) {
    return {
      error: { message: `${type} ${lib} ${error.message}`, stack: error.stack },
    };
  }
}

async function handlePromptMessage(result, sender) {
  // console.log("handlePromptMessage received " + JSON.stringify(result));
  const { host, type, accept, conditions, pubkey } = result;

  // return response
  openPrompt?.resolve?.(accept);

  try {
    // update policies
    if (conditions) {
      // console.log(`updatePermission ${pubkey}`);
      await updatePermission(pubkey, host, type, accept, conditions);
    }
  } catch (error) {
    console.error("Error updating permissions:", error);
  } finally {
    // cleanup this
    openPrompt = null;

    // release mutex here after updating policies
    releasePromptMutex();

    if (sender) {
      browser.windows.remove(sender.tab.windowId);
    }
  }
}
