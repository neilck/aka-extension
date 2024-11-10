import React, { useState, useEffect } from "react";
import { isRecentsEnabled, setRecentsEnabled } from "../../common/common";
import Panel from "../../common/components/Panel";
const ToggleRecents = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  // Load initial value from storage or default to false
  useEffect(() => {
    const loadRecentsStatus = async () => {
      const status = await isRecentsEnabled(); // Assuming this function returns the current status.
      setIsEnabled(status);
    };
    loadRecentsStatus();
  }, []);

  const handleToggle = async () => {
    const newStatus = !isEnabled;
    setIsEnabled(newStatus);
    await setRecentsEnabled(newStatus); // Toggle the feature on or off
  };

  return (
    <Panel>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-lg text-aka-blue pt-1">
            Most Recent Visits (Global Setting)
          </h1>
          Quick links to most recent apps with <i>get public key</i>{" "}
          permissions. <br /> Disabling clears history for all profiles.
        </div>

        <button
          onClick={handleToggle}
          className={`className="bg-transparent hover:bg-aka-blue-light text-aka-blue font-semibold hover:text-white py-1 px-2 border hover:border-transparent rounded"
         ${isEnabled ? "bg-green-500" : "bg-gray-500"} text-white`}
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </button>
      </div>
    </Panel>
  );
};

export default ToggleRecents;
