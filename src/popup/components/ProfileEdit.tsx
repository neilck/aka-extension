import React, { FocusEvent, useContext } from "react";
import {
  Link,
  useRouteLoaderData,
  Form,
  useSubmit,
  useLocation,
  redirect,
  useLoaderData,
  useActionData,
} from "react-router-dom";
import Panel from "../components/Panel";
import InputButton from "./InputButton";
import { IKeyPair, KeyPair } from "../../common/model/keypair";
import Storage from "../../common/Storage";
import { isKeyValid } from "../../common/util";

function ProfileEdit() {
  const keypair = useLoaderData() as IKeyPair;
  const errors = useActionData() as { privateKey: ""; name: "" };

  const isUpdating = keypair.get_privatekey() != "";
  console.log("ProfileEdit isUpdating: " + JSON.stringify(isUpdating));

  const privateKeyOnBlurHandler = (e: FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    const errors = { privateKey: "", name: "" };
    if (value == "") return;

    const privatekey = isKeyValid(value);
    if (!privatekey) {
      // TODO: show error message
      return;
    }

    keypair.set_privatekey(privatekey);
    const inputName = document.querySelector("#name") as HTMLInputElement;
    inputName.value = keypair.get_npubshort();
  };

  return (
    <div className="p-5">
      <Panel>
        <h1 className="font-semibold text-lg text-aka-blue">New Profile</h1>
        <Form id="profileForm" action="/profiles/create" method="post">
          <div className="flex flex-col items-center flex-1 w-auto">
            <div className="w-full">
              <label htmlFor="privateKey">Private key</label>
              <input
                type="text"
                id="privateKey"
                name="privateKey"
                placeholder="private key (nsec or hex)"
                onBlur={privateKeyOnBlurHandler}
                defaultValue={keypair.get_privatekey()}
                className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
              />
              <div className="h-4 text-red-500">
                {errors?.privateKey && <span>{errors.privateKey}</span>}
              </div>
            </div>

            <div className="w-full pt-4">
              <label htmlFor="privateKey">Profile name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="profile name"
                defaultValue={keypair.get_name()}
                className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
              />
              <div className="h-4 text-red-500">
                {errors?.name && <span>{errors.name}</span>}
              </div>
            </div>
          </div>
          <div className="mx-auto w-[4.5rem]">
            <InputButton>Save</InputButton>
          </div>
        </Form>
      </Panel>
    </div>
  );
}

export const loader = async ({ params }) => {
  console.log("ProfileEdit loader(): " + JSON.stringify(params));
  if (!params || !params.pubkey) {
    // create new pubkey
    return new KeyPair("New Profile", false, "");
  }

  const storage = Storage.getInstance();
  const foundKeypair = await storage.getKey(params.pubkey);
  return foundKeypair ? foundKeypair : new KeyPair("Not Found", false, "");
};

export async function action({ request, params }) {
  const storage = Storage.getInstance();
  const formData = await request.formData();
  const formkey = formData.get("privateKey");
  const name = formData.get("name");
  const errors = { privateKey: "", name: "" };

  if (name == "") {
    errors.name = "name can not be blank";
  }

  const privatekey = isKeyValid(formkey);
  if (!privatekey) {
    errors.privateKey = "not a valid private key";
    return;
  }

  const keypairs = await storage.getKeys();
  const existingKey = keypairs.find(
    (keypair) => keypair.get_privatekey() == privatekey
  );

  if (existingKey) {
    errors.privateKey = `profile ${existingKey.get_name()} already associated with private key`;
    return;
  }

  if (errors.name != "" || errors.privateKey != "") {
    return errors;
  }
  const keypair = new KeyPair(name, true, privatekey);
  storage.upsertKey(keypair);

  return redirect(`/profiles/${keypair.get_publickey()}`);
}

export default ProfileEdit;
