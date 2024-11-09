window.nostr = {
  _requests: {},
  _accountChangedListeners: null,

  async getPublicKey() {
    return this._call("getPublicKey", {});
  },

  async getSharedPublicKeys() {
    return this._call("getSharedPublicKeys", {});
  },

  async signEvent(event) {
    return this._call("signEvent", { event });
  },

  async getRelays() {
    return this._call("getRelays", {});
  },

  nip04: {
    async encrypt(peer, plaintext) {
      return window.nostr._call("nip04.encrypt", { peer, plaintext });
    },

    async decrypt(peer, ciphertext) {
      return window.nostr._call("nip04.decrypt", { peer, ciphertext });
    },
  },

  // send request to contentScript.js
  _call(type, params) {
    // console.log("[np] sending mesg to [cs]: " + type + " " + JSON.stringify(params));
    return new Promise((resolve, reject) => {
      let id = Math.random().toString().slice(4);
      this._requests[id] = { resolve, reject };
      window.postMessage(
        {
          id,
          ext: "aka-profiles",
          type,
          params,
        },
        "*"
      );
    });
  },

  on(name, listener) {
    if (name != "accountChanged") throw new Error(name + " not supported");
    if (!this._accountChangedListeners) this._accountChangedListeners = [];
    this._accountChangedListeners.push(listener);
  },

  off(name, listener) {
    if (name != "accountChanged") throw new Error(name + " not supported");
    if (this._accountChangedListeners) {
      for (i = 0; i < this._listeners.length; i++) {
        if (this._listeners[i] == listener) this._listeners.splice(i, 1);
        return;
      }
    }
  },
};

window.addEventListener("message", (message) => {
  if (message.data && message.data.ext === "aka-profiles") {
    // console.log("[np] recived message from [cs]: " + JSON.stringify(message.data));
  }

  if (
    message.data.ext === "aka-profiles" &&
    message.data.type === "accountChanged"
  ) {
    if (window.nostr && window.nostr._accountChangedListeners) {
      for (let i = 0; i < window.nostr._accountChangedListeners.length; i++) {
        // console.log("[n[] calling listener callbacks");
        // console.log(window.nostr._accountChangedListeners[i]);
        window.nostr._accountChangedListeners[i]();
      }
    }
    return;
  }

  if (
    !message.data ||
    message.data.response === null ||
    message.data.response === undefined ||
    message.data.ext !== "aka-profiles" ||
    !window.nostr._requests[message.data.id]
  )
    return;

  if (message.data.response.error) {
    let error = new Error("aka-profiles: " + JSON.stringify(message.data));
    error.stack = message.data.response.error.stack;
    window.nostr._requests[message.data.id].reject(error);
  } else {
    window.nostr._requests[message.data.id].resolve(message.data.response);
  }

  delete window.nostr._requests[message.data.id];
});

// hack to replace nostr:nprofile.../etc links with something else
let replacing = null;
document.addEventListener("mousedown", replaceNostrSchemeLink);
async function replaceNostrSchemeLink(e) {
  if (e.target.tagName !== "A" || !e.target.href.startsWith("nostr:")) return;
  if (replacing === false) return;

  let response = await window.nostr._call("replaceURL", { url: e.target.href });
  if (response === false) {
    replacing = false;
    return;
  }

  e.target.href = response;
}
