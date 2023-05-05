import browser from "webextension-polyfill";
import React, { useState, useEffect } from "react";
import Alert from "../../common/components/Alert";

export type Permission = Record<
  string,
  { condition: string; created_at: number; level: number }
>;

function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [alert, setAlert] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setAlert(false);
    }, 5000);

    // To clear or cancel a timer, you call the clearTimeout(); method,
    // passing in the timer object that you created into clearTimeout().

    return () => clearTimeout(timer);
  });

  useEffect(() => {
    browser.storage.local.get(["permissions"]).then((results) => {
      if (results.permissions) {
        let permissionsList = [];
        for (let host in results.permissions) {
          permissionsList.push({
            host,
            data: results.permissions[host],
          });
        }
        setPermissions(permissionsList);
      }
    });
  }, []);

  return (
    <>
      <div>
        <ul>
          <li>P: read your public key</li>
          <li>R: read your list of preferred relays</li>
          <li>S: sign events using your private key</li>
          <li>E: encrypt and decrypt messages from peers</li>
        </ul>
      </div>
      <div className="flex flex-col space-y-1">
        {permissions.map(({ host, data }, i) => (
          <div key={i} className="flex flex-row content-center space-x-1">
            <div>{host}</div>
            <div>{leveltoText(data.level)}</div>
            <div>{" REVOKE "}</div>
          </div>
        ))}
      </div>

      <div className="mx-auto w-40 pt-2">
        {alert && <Alert>{message}</Alert>}
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
}

export default Permissions;
