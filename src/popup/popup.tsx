import React from "react";
import { Form } from "react-router-dom";
import Splash from "./components/Splash";

import "./popup.css";

const Popup = () => {
  return (
    <div className="flex flex-col items-center flex-1 bg-black p-3">
      <div className="mx-auto rounded-md bg-aka-blue-dark p-3">
        <Splash className="mx-auto  h-48 f-48 fill-current text-aka-yellow" />
      </div>
      <div className="text-white bg-aka-blue-dark w-52 pt-3">
        <Form id="loginForm" method="post">
          <div>
            <label htmlFor="privateKey">Login with private key</label>
          </div>
          <div className="text-black">
            <input
              type="text"
              id="privateKey"
              name="fPrivateKey"
              className="w-full bg-white "
            />
          </div>
          <br />
          <br />
          <input type="submit" value="Submit" />
        </Form>
      </div>
    </div>
  );
};

export default Popup;
