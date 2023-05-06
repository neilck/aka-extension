# AKA Profiles

This project is still in progress.

## Nostr signer extension with multiple keys

AKA profiles is based on [nos2x](https://github.com/fiatjaf/nos2x) and adds support for multiple public / private key pairs.
At any given time, the user selects one active profile (public key and associated private key, relays, permissions) using the extension popup.

AKA Profiles works just like `nos2x` with the selected active key.

## How it works

As much underlying code as possible was reused from `nos2x`. For reference, this is how both `AKA Profiles` and `nos2x` processes application requests.

As specified in [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md), the browser extension's `contentScript.js` adds a script element `window.nostr` on page load. The calling application needs to wait for the insertion before accessing.

Functions like `window.nostr.getPublicKey()` are defined in nostr-provider.js, and when called, post a message (`window.postMessage`) with `ext: "aka-profiles"`.

`contentScript.js`, which runs in the context of the web page, listens for those messages, and in turn sends the message (`browser.runtime.sendMessage`) to `background.js`.

`background.js` then processes the request, opening up a new window if user interaction is necessary. The result is then returned as as reponse back up the chain of message senders.
