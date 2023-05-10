import React, { useState, useEffect } from "react";
import { Permission } from "../../common/model/Permission";
import { PermissionItem } from "./PermissionItem";
import browser from "webextension-polyfill";
import * as storage from "../../common/storage";

function Permissions({ currentPublicKey }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    browser.storage.local.onChanged.addListener(handleChange);
    return () => {
      browser.storage.local.onChanged.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    load(currentPublicKey);
  }, [currentPublicKey]);

  const handleChange = (changes) => {
    for (var key in changes) {
      if (key === currentPublicKey) {
        let profile = changes[key].newValue;
        setPermissions(storage.getPermissionsFromProfile(profile));
        break;
      }
    }
  };

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
    await storage.deletePermission(currentPublicKey, host);
  }

  function load(currentPublicKey: string) {
    storage.readPermissions(currentPublicKey).then((permissions) => {
      setPermissions(permissions);
    });
  }
}

export default Permissions;
