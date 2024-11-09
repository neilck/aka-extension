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
  NO_PERMISSIONS_REQUIRED,
  updatePermission,
  getPrivateKey,
  readRelays,
  getProtocolHandler,
  readCurrentPubkey,
  getPermissionStatus,
  getSharedPublicKeys,
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
  let { accountChanged } = req;
  if (accountChanged) {
    // console.log("[bg] received accountChanged: " + JSON.stringify(req));
    sendAccountChanged();
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

async function handleContentScriptMessage({ type, params, host }) {
  // if pubic specified in event for signing, use that
  // otherwise current pubkey
  let pubkey = "";
  let pubkeySpecified = false;
  if (type === "signEvent" && typeof params?.event?.pubkey === "string") {
    pubkey = params.event.pubkey;
    pubkeySpecified = true;
  } else {
    pubkey = await readCurrentPubkey();
  }

  console.log(
    "[bg.hcsm] message received, pubkey: " + pubkey + " type " + type
  );
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
      return { error: "No public key" };
    }

    console.log(`GetPermissionStatus ${pubkey} ${host} ${type}`);
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
      return { error: "denied" };
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

        // prompt will be resolved with true or false
        let accept = await new Promise((resolve, reject) => {
          openPrompt = { resolve, reject };

          browser.windows.create({
            url: `${browser.runtime.getURL("prompt.html")}?${qs.toString()}`,
            type: "popup",
            width: 360,
            height: 620,
          });
        });

        // denied, stop here
        if (!accept) return { error: "denied" };
      } catch (err) {
        // errored, stop here
        releasePromptMutex();
        return {
          error: `error: ${err}`,
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

        event.sig = getSignature(event, sk);
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

async function handlePromptMessage(result, sender) {
  console.log("handlePromptMessage received " + JSON.stringify(result));
  const { host, type, accept, conditions, pubkey } = result;

  // return response
  openPrompt?.resolve?.(accept);

  // update policies
  if (conditions) {
    {
      console.log(`updatePermission ${pubkey}`);
      await updatePermission(pubkey, host, type, accept, conditions);
    }
  }

  // cleanup this
  openPrompt = null;

  // release mutex here after updating policies
  releasePromptMutex();

  if (sender) {
    browser.windows.remove(sender.tab.windowId);
  }
}
