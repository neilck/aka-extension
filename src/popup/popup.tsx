import React from "react";
import { Form } from "react-router-dom";
import Splash from "./components/Splash";
import Panel from "./components/Panel";
import InputButton from "./components/InputButton";

const Popup = () => {
  return (
    <div className="flex flex-col items-center flex-1 p-3 w-auto gap-4">
      <Panel>
        <h1 className="font-semibold text-lg text-aka-blue">Welcome!</h1>
        <p className="text-slate-500 dark:text-slate-400">
          <span className="font-semibold">AKA Profiles</span> allows to you
          connect to apps without revealing your real identity.
        </p>
      </Panel>
      <div className=" w-full rounded-lg shadow-xl bg-aka-yellow p-3">
        <Splash className="mx-auto  h-48 f-48 fill-aka-blue" />
      </div>

      <Panel>
        <div className="flex flex-col items-center flex-1 p-2 w-auto gap-1">
          <Form id="loginForm" method="post" className="w-full">
            <div className="text-black">
              <input
                type="text"
                id="privateKey"
                name="fPrivateKey"
                autoFocus
                className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
                placeholder="private key (nsec or hex)"
              />
            </div>

            <div className="pt-4">
              <div className="mx-auto w-[4.5rem]">
                <InputButton>Login</InputButton>
              </div>
            </div>
            <div className="pt-4">
              <p className="text-center text-slate-500 dark:text-slate-400">
                Don't have a profile yet? Try{" "}
                <a
                  className="font-semibold text-blue-900 dark:text-blue-200"
                  href="https://nosta.me"
                  target="_blank"
                >
                  nostra.me!
                </a>
              </p>
            </div>
          </Form>
        </div>
      </Panel>
    </div>
  );
};

export default Popup;
