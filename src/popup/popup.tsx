import React from "react";
import "./popup.css";
import Splash from "./components/Splash";

const Popup = () => {
  return (
    <div className="bg-white">
      <div className="mx-auto h-80 w-80 m-2 rounded-md bg-aka-blue ">
        <Splash className="mx-auto  h-60 w-60 fill-current text-aka-yellow" />
      </div>
    </div>
  );
};

export default Popup;
