import React, { useState, useEffect } from "react";
import Storage from "../../common/Storage";
import { Permission } from "../../common/model/Permission";
import Alert from "../../common/components/Alert";

function Permissions({ currentPublicKey }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [alert, setAlert] = useState(false);
  const [message, setMessage] = useState("");
  const storage = Storage.getInstance();

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
          <div key={i} className="flex flex-row content-center space-x-1">
            <div>{host}</div>
            <div>{leveltoText(level)}</div>
            <div>{" REVOKE "}</div>
          </div>
        ))}
      </div>

      <div className="mx-auto w-40 pt-2">
        {alert && <Alert>{message}</Alert>}
      </div>

      <div>
        <ul>
          <li>P: read your public key</li>
          <li>R: read your list of preferred relays</li>
          <li>S: sign events using your private key</li>
          <li>E: encrypt and decrypt messages from peers</li>
        </ul>
      </div>
    </>
  );

  // levels defined in ORDERED_PERMISSIONS
  function leveltoText(level: number) {
    if (level >= 20) return "PRSE";
    if (level >= 10) return "PRS";
    if (level >= 5) return "PR";
    if (level >= 1) return "P";

    return "";
  }

  async function readPermissions(
    currentPublicKey: string
  ): Promise<Permission[]> {
    return storage.readPermissions(currentPublicKey);
  }
}

export default Permissions;
