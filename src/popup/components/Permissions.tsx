import React, { useState, useEffect } from "react";
import { useRouteLoaderData } from "react-router-dom";
import { Profile } from "../../common/model/Profile";
import { Permission } from "../../common/model/Permission";
import { PermissionItem } from "./PermissionItem";
import browser from "webextension-polyfill";
import * as storage from "../../common/storage";

function Permissions({ currentKey, profile }) {
  let permissions = profile.permissions;

  return (
    <>
      <div className="flex flex-col space-y-1">
        {permissions.map(({ host, level }, i) => (
          <div key={host}>
            <PermissionItem
              host={host}
              level={level}
              onDelete={onPermissionDeletedHandler}
            />
          </div>
        ))}
      </div>
    </>
  );

  async function onPermissionDeletedHandler(host: string) {
    // delete permission
    await storage.deletePermission(currentKey, host);
  }
}

export default Permissions;
