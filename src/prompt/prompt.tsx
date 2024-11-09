import "./prompt.css";

import { PERMISSION_NAMES } from "../common/common";
import browser from "webextension-polyfill";
import { redirect } from "react-router-dom";
import React from "react";
import * as storage from "../common/storage";
import { KeyPair } from "../common/model/KeyPair";
import AppBar from "./Appbar";
import Panel from "../common/components/Panel";
import ProfileSelect from "./ProfileSelect";
import EventModal from "./EventModal";
import { getKindName } from "../common/model/KindNames";

function Prompt() {
  let qs = new URLSearchParams(location.search);
  // token id
  let id = qs.get("id");
  // host name from URL
  let host = qs.get("host");
  let type = qs.get("type");
  let params, event;
  let hasEventKind = false;
  let pubkeySpecified = false;
  try {
    params = JSON.parse(qs.get("params"));
    if (Object.keys(params).length === 0) params = null;
    else if (params.event) {
      event = params.event;
      if (event.kind) hasEventKind = true;
      if (event.pubkey && event.pubkey !== "") pubkeySpecified = true;
    }
  } catch (err) {
    params = null;
  }

  let strMesg = PERMISSION_NAMES[type];
  let authMesg = "always allow";
  let eventName = "";
  let denyMesg = "never allow";
  if (type === "signEvent") {
    eventName = getKindName(event.kind);
    strMesg = `sign ${eventName} events using your private key`;
    authMesg = "always allow ALL signing";
    denyMesg = "never allow ANY signing";
  }
  const eventMesg = `always allow ${eventName} signing`;
  const rejectEventMesg = `always deny ${eventName} signing`;

  return (
    <div className="h-full">
      <div className="relative z-10">
        <AppBar />
      </div>
      <div id="detail" className="relative z-10 p-3 bg-gray-100">
        <Panel>
          <div className="flex flex-col flex-nowrap justify-center">
            <div className="font-semibold text-lg text-aka-blue mx-auto">
              Access Request
            </div>
          </div>

          <div className="text-center">
            <span className="text-slate-900 dark:text-white font-bold">
              {host + " "}
            </span>
            is requesting permission to
          </div>
          <div className="pt-2 italic text-slate-900 dark:text-white font-semibold text-center">
            {strMesg}
          </div>
          {params && (
            <div className="pt-1 text-center">
              <EventModal details={JSON.stringify(params, null, 2)} />
            </div>
          )}
          <div className="pt-3 px-10 flex justify-center">
            <div className="text-slate-500">
              Use profile
              <div className="relative z-30 text-slate-900 w-full">
                <ProfileSelect disabled={pubkeySpecified}></ProfileSelect>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center flex-1 w-auto space-y-2 pt-6">
            <button
              className="w-48 bg-aka-blue hover:bg-blue text-white font-semibold py-2 px-4 rounded"
              onClick={authorizeHandler(true, {})}
            >
              <p className="tracking-wider">{authMesg}</p>
            </button>

            {hasEventKind && (
              <button
                className="w-48 bg-white hover:bg-blue text-aka-blue  font-semibold py-2 px-4 border-2 border-aka-blue rounded"
                onClick={authorizeHandler(
                  true,
                  { kinds: { [event.kind]: true } } // store and always answer true for all events that match this condition
                )}
              >
                <p className="tracking-wider">{eventMesg}</p>
              </button>
            )}

            <button
              className="w-48 bg-white hover:bg-blue text-aka-blue  font-semibold py-2 px-4 border-2 border-aka-blue rounded"
              onClick={authorizeHandler(true)}
            >
              <p className="tracking-wider">just once</p>
            </button>
            {hasEventKind && (
              <button
                className="w-48 bg-white hover:bg-blue text-aka-blue  font-semibold py-2 px-4 border-2 border-aka-blue rounded"
                onClick={authorizeHandler(
                  false,
                  { kinds: { [event.kind]: true } } // idem
                )}
              >
                <p className="tracking-wider">{rejectEventMesg}</p>
              </button>
            )}
            <button
              className="w-48 bg-white hover:bg-blue text-aka-blue  font-semibold py-2 px-4 border-2 border-aka-blue rounded"
              onClick={authorizeHandler(
                false,
                {} // idem
              )}
            >
              <p className="tracking-wider">{denyMesg}</p>
            </button>

            <button
              style={{ marginTop: "5px" }}
              onClick={authorizeHandler(false)}
            >
              <p className="tracking-wider text-aka-blue pt-1">cancel</p>
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );

  function authorizeHandler(accept, conditions?) {
    return function (ev) {
      ev.preventDefault();
      browser.runtime.sendMessage({
        prompt: true,
        id,
        host,
        type,
        accept,
        conditions,
      });
    };
  }
}

export const loader = async (): Promise<KeyPair[]> => {
  const keypairs = await storage.getKeys();
  return keypairs;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;

  await storage.setCurrentPubkey(selectedPubkey);
  return redirect("/");
}

export default Prompt;
