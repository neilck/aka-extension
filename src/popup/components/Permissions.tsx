import React, { useState, useEffect } from "react";
import { Permission } from "../../common/model/Permission";
import { PermissionItem } from "./PermissionItem";
import * as storage from "../../common/storage";

import Alert from "../../common/components/Alert";

function Permissions({ currentPublicKey }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [alert, setAlert] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setAlert(false);
    }, 5000);
    return () => clearTimeout(timer);
  });

  useEffect(() => {
    readPermissions(currentPublicKey).then((permissions) => {
      console.log(permissions);
      setPermissions(permissions);
    });
    console.log(
      `Permissions for ${currentPublicKey}: ${JSON.stringify(permissions)}`
    );
  }, [currentPublicKey]);

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

      <div className="mx-auto w-40 pt-2">
        {alert && <Alert>{message}</Alert>}
      </div>
    </>
  );

  async function onPermissionDeletedHandler(host: string) {
    // delete permission
    await storage.deletePermission(currentPublicKey, host);
    readPermissions(currentPublicKey).then((permissions) => {
      console.log(permissions);
      setPermissions(permissions);
    });
  }

  async function readPermissions(
    currentPublicKey: string
  ): Promise<Permission[]> {
    return storage.readPermissions(currentPublicKey);
  }
}

export default Permissions;
