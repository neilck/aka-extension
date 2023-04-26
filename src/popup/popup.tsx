import React from "react";
import { Form, useActionData, redirect, useLoaderData } from "react-router-dom";
import { nip19 } from "nostr-tools";

import Splash from "./components/Splash";
import Panel from "./components/Panel";
import InputButton from "./components/InputButton";
import { KeyPair } from "../common/model/keypair";
import { saveKeyPairs } from "../common/storage";
import { isKeyValid } from "../common/util";

const Popup = () => {
  const errors = useActionData() as { privateKey: "" };

  return (
    <div className="flex flex-col items-center flex-1 w-auto ">
      <div className=" w-full bg-aka-yellow p-1">
        <Splash className="mx-auto  h-48 w-48 fill-aka-blue" />
      </div>

      <div className="p-5">
        <Panel>
          <div className="flex flex-col items-center flex-1 p-2 w-auto gap-1">
            <div className="pb-2">
              <h1 className="font-semibold text-lg text-aka-blue">Welcome!</h1>
              <p className="text-slate-500 dark:text-slate-400" />
              <span className="font-semibold">AKA Profiles</span> allows to you
              connect to apps without revealing your real identity.
            </div>
            <Form id="loginForm" method="post" className="w-full">
              <div className="text-black">
                <input
                  type="text"
                  id="privateKey"
                  name="privateKey"
                  autoFocus
                  className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
                  placeholder="private key (nsec or hex)"
                />
                <div className="h-4 text-red-500">
                  {errors?.privateKey && <span>{errors.privateKey}</span>}
                </div>
              </div>

              <div className="pt-4">
                <div className="mx-auto w-[4.5rem]">
                  <InputButton>Login</InputButton>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-center text-slate-500 dark:text-slate-400">
                  Don't have a private key yet? Try{" "}
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
    </div>
  );
};

export default Popup;

export async function action({ request }) {
  const formData = await request.formData();
  const formkey = formData.get("privateKey");
  const errors = { privateKey: "" };

  const privatekey = isKeyValid(formkey);
  if (!privatekey) {
    errors.privateKey = "not a valid private key";
    return errors;
  }

  const newPair = new KeyPair("", true, privatekey);
  saveKeyPairs([newPair]);

  // otherwise save the profile and redirect
  // await createUser(email, password);
  return redirect("/profile");
}
