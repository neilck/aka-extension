import browser from "webextension-polyfill";
import { render } from "react-dom";
import React from "react";

import { getAllowedCapabilities } from "../common/common";
import { PencilSquareIcon } from "../popup/components/PencilSquareIcon";

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

  return (
    <>
      <PencilSquareIcon />
      <div>
        <b style={{ display: "block", textAlign: "center", fontSize: "200%" }}>
          {host}
        </b>{" "}
        <p>is requesting your permission to </p>
        <ul>
          {getAllowedCapabilities(level).map((cap) => (
            <li key={cap}>
              <i style={{ fontSize: "140%" }}>{cap}</i>
            </li>
          ))}
        </ul>
      </div>
      {params && (
        <>
          <p>now acting on</p>
          <pre style={{ overflow: "auto", maxHeight: "100px" }}>
            <code>{JSON.stringify(params, null, 2)}</code>
          </pre>
        </>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-around",
        }}
      >
        <button
          style={{ marginTop: "5px" }}
          onClick={authorizeHandler("forever")}
        >
          authorize forever
        </button>
        <button
          style={{ marginTop: "5px" }}
          onClick={authorizeHandler("expirable")}
        >
          authorize for 5 minutes
        </button>
        <button
          style={{ marginTop: "5px" }}
          onClick={authorizeHandler("single")}
        >
          authorize just this
        </button>
        <button style={{ marginTop: "5px" }} onClick={authorizeHandler("no")}>
          cancel
        </button>
      </div>
    </>
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

export default Prompt;
