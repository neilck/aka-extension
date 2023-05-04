import React from "react";
import { useRouteLoaderData } from "react-router-dom";

export type Relay = Record<string, { read: boolean; write: boolean }>;

function Relays() {
  // const relays = useRouteLoaderData("options") as Relay[];

  const relayStore = {
    "relay.nostr.info": { read: true, write: true },
    "eden.nostr": { read: true, write: false },
  };

  const relaysList = [];
  for (let url in relayStore) {
    relaysList.push({
      url,
      policy: relayStore[url],
    });
  }

  return (
    <>
      <div className="flex flex-col">
        {relaysList.map(({ url, policy }, i) => (
          <div key={i} style={{ display: "flex" }}>
            <input
              style={{ marginRight: "10px", width: "400px" }}
              value={url}
            />
            <label>
              read
              <input type="checkbox" checked={policy.read} />
            </label>
            <label>
              write
              <input type="checkbox" checked={policy.write} />
            </label>
          </div>
        ))}
      </div>
    </>
  );
}

export default Relays;
