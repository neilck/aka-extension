import "./prompt.css";

import browser from "webextension-polyfill";
import { render } from "react-dom";
import { redirect } from "react-router-dom";
import React from "react";

import { getAllowedCapabilities } from "../common/common";
import * as storage from "../common/storage";
import { KeyPair } from "../common/model/KeyPair";
import AppBar from "./Appbar";
import Panel from "../common/components/Panel";
import ProfileSelect from "./ProfileSelect";
import EventModal from "./EventModal";

function Prompt() {
  let qs = new URLSearchParams(location.search);
  // token id
  let id = qs.get("id");
  // host name from URL
  let host = qs.get("host");
  // index to permission description
  let level = parseInt(qs.get("level"));
  let params;
  try {
    params = JSON.parse(qs.get("params"));
    if (Object.keys(params).length === 0) params = null;
  } catch (err) {
    params = null;
  }

  const result = getAllowedCapabilities(level);
  const allowedCapabilities = result == "nothing" ? null : result;

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
          <div className="pt-2 italic text-slate-900 dark:text-white font-semibold flex flex-col flex-nowrap justify-center">
            {allowedCapabilities && (
              <div className="mx-auto">
                {allowedCapabilities.map((cap) => (
                  <div key={cap}>{cap}</div>
                ))}
              </div>
            )}
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
                <ProfileSelect></ProfileSelect>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center flex-1 w-auto space-y-2 pt-6">
            <button
              className="w-36 bg-aka-blue hover:bg-blue text-white font-semibold py-2 px-4 rounded"
              onClick={authorizeHandler("forever")}
            >
              <p className="tracking-wider">authorize</p>
            </button>

            <button
              className="w-36 bg-white hover:bg-blue text-aka-blue  font-semibold py-2 px-4 border-2 border-aka-blue rounded"
              onClick={authorizeHandler("expirable")}
            >
              <p className="tracking-wider">5 minutes only</p>
            </button>

            <button
              className="w-36 bg-white hover:bg-blue text-aka-blue  font-semibold py-2 px-4 border-2 border-aka-blue rounded"
              onClick={authorizeHandler("single")}
            >
              <p className="tracking-wider">just once</p>
            </button>

            <button
              style={{ marginTop: "5px" }}
              onClick={authorizeHandler("no")}
            >
              <p className="tracking-wider text-aka-blue pt-1">cancel</p>
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );

  function authorizeHandler(condition) {
    return function (ev) {
      ev.preventDefault();
      browser.runtime.sendMessage({
        prompt: true,
        id,
        host,
        level,
        condition,
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
