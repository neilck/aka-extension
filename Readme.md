# AKA Profiles

![screenshot](docs/images/screenshot.png "AKA Profiles")

## Nostr signer extension with multiple keys

AKA Profiles is a [Chrome Extension](https://chrome.google.com/webstore/detail/aka-profiles/ncmflpbbagcnakkolfpcpogheckolnad), based on [nos2x](https://github.com/fiatjaf/nos2x) and adds support for multiple public / private key pairs.

The primary purpose is enabling web apps to request the signing of events using the locally stored private key, thereby eliminating the need to give the private key to web apps.

It also stores a list of your public keys, reducing copying / pasting of keys into various apps.

## Version 1.07

- set autoComplete="off" so browser doesn't save nsec in autocomplete
- updated list of kind names

## Version 1.06

- fixed issued where profile didn't change during permission ask

## Version 1.05

- updated to newer permission model in nos2x
- support for NIP-07 switching accounts
- removed support for signing delegation
- fixed screen width errors

**Supported**

[NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md)

- getPublicKey()
- signEvent()
- getRelays()

[NIP-04](https://github.com/nostr-protocol/nips/blob/master/04.md)

- nip04.encrypt()
- nip04.decrypt()

[NIP-07 switching accounts](https://github.com/nostr-protocol/nips/pull/701)

- window.nostr.on('accountChanged', accountChangedHandler)

These javascript functions are made available to web apps through injection of `window.nostr` script element defined in `nostr-provider.js` into the DOM.

AKA Profiles uses the same app permission model as nos2x

## User Guide

### Compiling

`npm run build`

The built extension files are written to `dist` folder.

### Installation

Install from [Chrome Web Store](https://chrome.google.com/webstore/detail/aka-profiles/ncmflpbbagcnakkolfpcpogheckolnad),

Otherwise, use the files in the `dist` folder after compiling:

1. Open Chrome browser and paste `chrome://extensions` into the address bar.
2. Enable Developer mode by clicking Developer mode toggle (top right)
3. Click Load Unpacked button in the menu bar.
4. Select the `dist` folder.
5. Click the Extension icon in Chrome, and click AKA Profiles icon.
6. Paste in your private key.

### Tips

- "Add new profile..." is available in dropdown in top right
- Right click on AKA Profiles icon and select Options to revoke app permissions or to add preferred relays

If Access Request prompt dialog doesn't appear when loading a web page

- Check to see if it is already open, but got hidden behind the current window
- Ensure other signer extensions are not also enabled (e.g. nos2x, Alby)

## Integration Examples

To integrate, see the following compatible web apps

- [Nostr.chat](https://nostr.chat) - [repo](https://github.com/NostrChat/NostrChat)
- [Snort.social](https://snort.social) - [repo](https://git.v0l.io/Kieran/snort)
- [nostra.me](https://nosta.me/) - [repo](https://github.com/GBKS/nosta-me)

Search repositories for `window.nostr.getPublicKey()`

## Developer Notes

As much underlying code as possible was reused from `nos2x`. For reference, this is how both `AKA Profiles` and `nos2x` processes application requests.

As specified in [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md), the browser extension's `contentScript.js` injects nostr-provider.js script into element `window.nostr` on page load. The calling application needs to wait for the insertion before accessing.

Functions like `window.nostr.getPublicKey()` are defined in nostr-provider.js, and when called, post a message (`window.postMessage`) with `ext: "aka-profiles"`.

`contentScript.js`, which runs in the context of the web page, listens for those messages, and in turn sends the message (`browser.runtime.sendMessage`) to `background.js`.

`background.js` then processes the request, opening up a new window if user interaction is necessary. The result is then returned as as response back up the chain of message senders.
