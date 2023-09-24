import React, { useState, useEffect } from "react";
import * as storage from "../../common/storage";
import { Relay } from "../../common/model/Relay";
import { Policy } from "../../common/model/Policy";
import { getKindName } from "../../common/model/KindNames";

export function PermissionItem(props: {
  policy: Policy;
  onDelete: (host: string, accept: string, type: string) => Promise<void>;
}) {
  const { host, accept, type, conditions, created_at } = props.policy;
  const onDelete = props.onDelete;

  const strDate = new Date(created_at * 1000)
    .toISOString()
    .split(".")[0]
    .split("T")
    .join(" ");

  const hasConditions = conditions && Object.keys(conditions).length > 0;
  let strEvents = "";
  if (hasConditions) {
    Object.keys(conditions.kinds).map((kind) => {
      const name = getKindName(kind);
      if (strEvents == "") strEvents = name;
      else strEvents = strEvents + ", " + name;
    });
  }

  let strMesg = "";
  switch (type) {
    case "getPublicKey":
      strMesg = "get public key";
      break;
    case "getRelays":
      strMesg = "get relays";
      break;
    case "nip04.encrypt":
      strMesg = "send encrypted messagees";
      break;
    case "nip04.decrypt":
      strMesg = "decrypt received messages";
      break;
    case "signEvent":
      if (strEvents != "") {
        strMesg = `sign ${strEvents} events`;
        break;
      } else {
        strMesg = "sign all events";
        break;
      }
    default:
      strMesg = type;
  }

  const line1 = `${host}  ${strMesg}`;
  const line2 = `${strDate}`;

  const onButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    onDelete(host, accept, type);
  };

  return (
    <div id="outerBox" className="flex flex-row">
      <div id="detail" className="flex flex-grow flex-col justify-center">
        <div className="font-semibold">{line1}</div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          {line2}
        </div>
      </div>
      <div id="action" className="">
        <button
          onClick={(e) => {
            onButtonClick(e);
          }}
          className="bg-transparent hover:bg-aka-blue-light text-aka-blue font-semibold hover:text-white py-1 px-2 border border-aka-blue-light hover:border-transparent rounded"
        >
          revoke
        </button>
      </div>
    </div>
  );
}
