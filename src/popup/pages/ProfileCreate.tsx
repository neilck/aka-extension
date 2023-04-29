import React, { FocusEvent, useState, useEffect } from "react";
import { Form, redirect, useLoaderData, useActionData } from "react-router-dom";
import Panel from "../components/Panel";
import InputButton from "../components/InputButton";
import { BackButton } from "../components//BackButton";
import { IKeyPair, KeyPair } from "../../common/model/keypair";
import Storage from "../../common/Storage";
import { isKeyValid } from "../../common/util";

function ProfileCreate() {
  const [errors, setErrors] = useState({ privateKey: "", name: "" });

  const keypair = useLoaderData() as IKeyPair;

  const actionError = useActionData() as string;

  const privateKeyOnBlurHandler = (e: FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (value == "") {
      return;
    }

    const privatekey = isKeyValid(value);
    if (!privatekey) {
      setErrors({ privateKey: "not a valid private key", name: errors.name });
      return;
    }

    keypair.set_privatekey(privatekey);
    const inputName = document.querySelector("#name") as HTMLInputElement;
    inputName.value = keypair.get_npubshort();
  };

  const nameOnBlurHandler = (e: FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (value == "")
      setErrors({
        privateKey: errors.privateKey,
        name: "name can not be empty",
      });
  };

  return (
    <div className="p-5">
      <Panel>
        <div className="h-4 w-4 cursor-pointer hover:bg-gray-100">
          <BackButton />
        </div>
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
                onFocus={(e) =>
                  setErrors({ privateKey: "", name: errors.name })
                }
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
                onBlur={nameOnBlurHandler}
                onFocus={(e) =>
                  setErrors({ privateKey: errors.privateKey, name: "" })
                }
                defaultValue={keypair.get_name()}
                className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
              />
              <div className="h-4 text-red-500">
                {errors?.name && <span>{errors.name}</span>}
              </div>
            </div>
          </div>
          {actionError && (
            <div id="actionError" className="h-4 text-red-500 text-center">
              {actionError}
            </div>
          )}
          <div className="mx-auto w-[4.5rem] pt-4">
            <InputButton>Save</InputButton>
          </div>
        </Form>
      </Panel>
    </div>
  );
}

export const loader = async () => {
  return new KeyPair("New Profile", false, "");
};

export async function action({ request, params }) {
  const storage = Storage.getInstance();
  const formData = await request.formData();
  const formkey = formData.get("privateKey");

  let name = formData.get("name") as string;
  name = name.replace(/\p{C}/gu, "");

  if (name == "") return "name can not be blank";

  const privatekey = isKeyValid(formkey);
  if (privatekey == null) return "private key is not valid";

  const keypairs = await storage.getKeys();
  const existingKey = keypairs.find(
    (keypair) => keypair.get_privatekey() == privatekey
  );

  if (existingKey) {
    return `private key already in use by profile ${existingKey.get_name()}`;
  }

  // save data
  const keypair = new KeyPair(name, true, privatekey);
  await storage.upsertKey(keypair);

  return redirect("/profiles");
}

export default ProfileCreate;
