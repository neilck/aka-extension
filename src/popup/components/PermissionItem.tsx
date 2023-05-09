import React, { useState, useEffect } from "react";
import Storage from "../../common/Storage";
import { Relay } from "../../common/model/Relay";

export function PermissionItem({ host, level, onDelete }) {
  const detail = leveltoText(level);

  const onButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    onDelete(e.currentTarget.id);
  };

  return (
    <div id="outerBox" className="flex flex-row">
      <div id="detail" className="flex flex-grow flex-col">
        <div className="font-semibold">{host}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </div>
      </div>
      <div id="action" className="">
        <button
          id={host}
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

// levels defined in ORDERED_PERMISSIONS
function leveltoText(level: number) {
  if (level >= 20)
    return "get public key, get relays, sign events, encrypt/decrypt messages";
  if (level >= 10) return "get public key, get relays, sign events";
  if (level >= 5) return "get public key, get relays";
  if (level >= 1) return "get public key";

  return "";
}
