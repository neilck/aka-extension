import React, { useState, useEffect } from "react";
import Alert from "../../common/components/Alert";
import { Relay } from "../../common/model/Relay";
import * as storage from "../../common/storage";

function Relays({ currentKey, profile }) {
  const [relays, setRelays] = useState(profile.relays);
  const [alert, setAlert] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setRelays(profile.relays);
  }, [profile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAlert(false);
    }, 5000);
    return () => clearTimeout(timer);
  });

  return (
    <>
      <div key={currentKey} className="flex flex-col space-y-1">
        {relays.map(({ url, read, write }, i) => (
          <div key={i} className="flex flex-row content-center space-x-1">
            <input
              style={{ marginRight: "10px", width: "400px" }}
              value={url}
              className="h-6 bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white px-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
              onChange={changeRelayURL.bind(null, i)}
              onBlur={deleteRelay.bind(null, i)}
            />
            <label htmlFor={`read${i}`} className="pt-0.5">
              read
            </label>
            <input
              id={`read${i}`}
              type="checkbox"
              checked={read}
              className="accent-aka-blue"
              onChange={toggleRelayPolicy.bind(null, i, "read")}
            />

            <label htmlFor={`write${i}`} className="pt-0.5 pl-1">
              write
            </label>
            <input
              id={`write${i}`}
              type="checkbox"
              checked={write}
              className="accent-aka-blue"
              onChange={toggleRelayPolicy.bind(null, i, "write")}
            />
          </div>
        ))}
      </div>
      <button
        onClick={(e) => {
          addNewRelay();
        }}
        className="bg-transparent hover:bg-blue-500 text-aka-blue hover:text-white py-1 px-2"
      >
        add new...
      </button>
      <div className="flex flex-col justify-center pt-1">
        <button
          className="mx-auto w-20 bg-aka-blue hover:bg-blue text-white font-bold py-1 px-4 rounded"
          onClick={(e) => {
            saveRelays(currentKey);
          }}
        >
          <p className="tracking-widest">Save</p>
        </button>
        <div className="mx-auto w-40 pt-2">
          {alert && <Alert>{message}</Alert>}
        </div>
      </div>
    </>
  );

  function changeRelayURL(i, ev) {
    let relay: Relay = relays[i];
    setRelays([
      ...relays.slice(0, i),
      new Relay(ev.target.value, relay.read, relay.write),
      ...relays.slice(i + 1),
    ]);
  }

  function deleteRelay(i, ev) {
    if (relays[i].url == "") {
      const newArr = [...relays.slice(0, i), ...relays.slice(i + 1)];
      setRelays(newArr);
    }
  }

  function toggleRelayPolicy(i, cat) {
    let relay: Relay = relays[i];
    if (cat === "read") relay.read = !relay.read;
    if (cat === "write") relay.write = !relay.write;

    setRelays([...relays.slice(0, i), relay, ...relays.slice(i + 1)]);
  }

  function addNewRelay() {
    const newArr: Relay[] = [...relays];

    newArr.push(new Relay("", true, true));
    setRelays(newArr);
  }

  async function saveRelays(currentPublicKey: string) {
    storage.saveRelays(currentPublicKey, relays);
    setAlert(true);
    setMessage("saved");
  }
}

export default Relays;
