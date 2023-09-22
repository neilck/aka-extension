import browser from "webextension-polyfill";
import {
  validateEvent,
  getEventHash,
  getSignature,
  nip04,
  nip19,
} from "nostr-tools";
import { Mutex } from "async-mutex";
import {
  PERMISSIONS_REQUIRED,
  NO_PERMISSIONS_REQUIRED,
  readPermissionLevel,
  updatePermission,
  getPrivateKey,
  readRelays,
  getProtocolHandler,
  readCurrentPubkey,
} from "../common/common";

// console.log("background.js started");

const { encrypt, decrypt } = nip04;

let openPrompt = null;
let promptMutex = new Mutex();
let releasePromptMutex = () => {};

browser.runtime.onInstalled.addListener((_, __, reason) => {
  if (reason === "install") browser.runtime.openOptionsPage();
});

browser.runtime.onMessage.addListener(async (req, sender) => {
  let { prompt } = req;

  if (prompt) {
    return handlePromptMessage(req, sender);
  } else {
    return handleContentScriptMessage(req);
  }
});

browser.runtime.onMessageExternal.addListener(
  async ({ type, params }, sender) => {
    let extensionId = new URL(sender.url).host;
    return handleContentScriptMessage({ type, params, host: extensionId });
  }
);

browser.windows.onRemoved.addListener((windowId) => {
  if (openPrompt) {
    handlePromptMessage({ condition: "no" }, null);
  }
});

async function handleContentScriptMessage({ type, params, host }) {
  let pubkey = await readCurrentPubkey();
  // console.log("[hcsm] message received, pubkey: " + pubkey + " type " + type);
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
    }
    return;
  } else {
    // console.log(`[hcsm] Checking permission level ${pubkey} ${host}`);
    let level = await readPermissionLevel(pubkey, host);

    // console.log("[hcsm] Permission level " + level);
    if (level >= PERMISSIONS_REQUIRED[type]) {
      // authorized, proceed
    } else {
      // ask for authorization
      try {
        await promptPermission(host, PERMISSIONS_REQUIRED[type], params);
        // authorized, proceed
      } catch (_) {
        // not authorized, stop here
        return {
          error: `insufficient permissions, required ${PERMISSIONS_REQUIRED[type]}`,
        };
      }
    }
  }

  // console.log(`[hcsm] getPrivateKey(${pubkey}) `);
  let sk = await getPrivateKey(pubkey);
  // console.log(`[hcsm] private key length ${sk.length}) `);
  if (!sk) {
    return { error: "no private key found" };
  }

  try {
    switch (type) {
      case "getPublicKey": {
        return pubkey;
      }
      case "getRelays": {
        let relays = await readRelays(pubkey);
        return relays || {};
      }
      case "signEvent": {
        let { event } = params;

        if (!event.pubkey) event.pubkey = pubkey;
        if (!event.id) event.id = getEventHash(event);
        if (!validateEvent(event))
          return { error: { message: "invalid event" } };

        event.sig = await getSignature(event, sk);
        return event;
      }
      case "nip04.encrypt": {
        let { peer, plaintext } = params;
        return encrypt(sk, peer, plaintext);
      }
      case "nip04.decrypt": {
        let { peer, ciphertext } = params;
        return decrypt(sk, peer, ciphertext);
      }
    }
  } catch (error) {
    return { error: { message: error.message, stack: error.stack } };
  }
}

async function handlePromptMessage({ id, condition, host, level }, sender) {
  switch (condition) {
    case "forever":
    case "expirable":
      openPrompt?.resolve?.();
      let pubkey = await readCurrentPubkey();
      updatePermission(pubkey, host, {
        level,
        condition,
      });
      break;
    case "single":
      openPrompt?.resolve?.();
      break;
    case "no":
      openPrompt?.reject?.();
      break;
  }

  openPrompt = null;
  releasePromptMutex();

  if (sender) {
    browser.windows.remove(sender.tab.windowId);
  }
}

async function promptPermission(host, level, params) {
  releasePromptMutex = await promptMutex.acquire();

  let id = Math.random().toString().slice(4);
  let qs = new URLSearchParams({
    host,
    level,
    id,
    params: JSON.stringify(params),
  });

  return new Promise((resolve, reject) => {
    openPrompt = { resolve, reject };

    browser.windows.create({
      url: `${browser.runtime.getURL("prompt.html")}?${qs.toString()}`,
      type: "popup",
      width: 340,
      height: 520,
    });
  });
}
