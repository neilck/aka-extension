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
import { BackButton } from "./BackButton";

function ProfileEdit() {
  const keypair = useLoaderData() as IKeyPair;
  const error = useActionData() as string;

  const isUpdating = keypair.get_privatekey() != "";
  console.log("ProfileEdit isUpdating: " + JSON.stringify(isUpdating));

  return (
    <div className="p-5">
      <Panel>
        <div className="h-4 w-4 cursor-pointer hover:bg-gray-100">
          <BackButton />
        </div>
        <h1 className="font-semibold text-lg text-aka-blue pt-1">
          {keypair.get_name()}
        </h1>
        <Form id="profileForm" method="post">
          <input
            type="hidden"
            id="privateKey"
            name="privateKey"
            value={keypair.get_privatekey()}
          />
          <div className="w-full pt-2 font-semibold">
            <label htmlFor="name">Profile name</label>
            <input
              autoFocus
              type="text"
              id="name"
              name="name"
              placeholder="profile name"
              defaultValue={keypair.get_name()}
              className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
            />
            <div className="h-4 text-red-500">
              {error && <span>{error}</span>}
            </div>
          </div>
          <div className="flex flex-col items-center flex-1 w-auto">
            <div id="npub" className="w-80">
              <div id="npub_label" className="font-semibold">
                Public Key (npub)
              </div>
              <div id="npub_value" className="break-words">
                {keypair.get_npub()}
              </div>
            </div>
          </div>
          <div className="mx-auto w-[4.5rem] pt-4">
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
  let name = formData.get("name") as string;
  name = name.replace(/\p{C}/gu, "");

  if (name == "") return "name can not be blank";

  // save data
  const keypair = new KeyPair(name, true, formkey);
  storage.upsertKey(keypair);

  return redirect(`/profiles/${keypair.get_publickey()}`);
}

export default ProfileEdit;
