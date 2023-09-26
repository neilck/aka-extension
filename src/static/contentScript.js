// inject the script that will provide window.nostr
let script = document.createElement("script");
script.setAttribute("async", "false");
script.setAttribute("type", "text/javascript");
script.setAttribute("src", browser.runtime.getURL("nostr-provider.js"));
document.head.appendChild(script);

// listen for messages from that script
window.addEventListener("message", async (message) => {
  if (message.source !== window) return;
  if (!message.data) return;
  if (!message.data.params) return;
  if (message.data.ext !== "aka-profiles") return;
  //console.log("[cs] received message from [np]: " + JSON.stringify(message.data));

  // pass on to background
  var response;
  try {
    // console.log("[cs] sending message to [bg]: " + JSON.stringify(message.data));
    response = await browser.runtime.sendMessage({
      type: message.data.type,
      params: message.data.params,
      host: location.host,
    });
  } catch (error) {
    response = { error };
  }

  // return response
  window.postMessage(
    { id: message.data.id, ext: "aka-profiles", response },
    message.origin
  );
});

// receive message from background
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // console.log("[cs] received message from [bg] " + JSON.stringify(request));

  if (request.accountChanged) {
    const mesg = { ext: "aka-profiles", type: "accountChanged", origin: "*" };
    // console.log("[cs] sending message to [np] " + JSON.stringify(mesg));
    window.postMessage(mesg, mesg.origin);
  }
  return;
});
