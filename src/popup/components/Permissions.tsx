import React, { useState, useEffect } from "react";
import { useRouteLoaderData } from "react-router-dom";
import { Profile } from "../../common/model/Profile";
import { Policy } from "../../common/model/Policy";
import { PermissionItem } from "./PermissionItem";
import browser from "webextension-polyfill";
import * as storage from "../../common/storage";

function Permissions(props: { currentKey: string; policies: Policy[] }) {
  const { currentKey, policies } = props;

  return (
    <>
      <div className="flex flex-col space-y-1">
        {policies.map((policy, i) => (
          <div key={i}>
            <PermissionItem
              policy={policy}
              onDelete={onPermissionDeletedHandler}
            />
          </div>
        ))}
      </div>
    </>
  );

  async function onPermissionDeletedHandler(
    host: string,
    accept: string,
    type: string
  ) {
    // delete permission
    await storage.deletePermission(currentKey, host, accept, type);
  }
}

export default Permissions;
