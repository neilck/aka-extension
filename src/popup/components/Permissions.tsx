import React from "react";
import { Policy } from "../../common/model/Policy";
import { PermissionItem } from "./PermissionItem";
import * as storage from "../../common/storage";

function Permissions(props: {
  currentKey: string;
  policies: Policy[];
  onChange: () => void;
}) {
  const { currentKey, policies, onChange } = props;

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
    onChange();
  }
}

export default Permissions;
