import React, { FocusEvent, useContext } from "react";
import {
  Link,
  Form,
  redirect,
  useLoaderData,
  useActionData,
} from "react-router-dom";
import Panel from "../../common/components/Panel";
import InputButton from "../../common/components/InputButton";
import { KeyPair } from "../../common/model/KeyPair";
import * as storage from "../../common/storage";
import { isKeyValid } from "../../common/util";
import { BackButton } from "../components//BackButton";
import { saveProfile } from "../../common/common";
import { Profile } from "../../common/model/Profile";

type LoaderData = {
  keypair: KeyPair;
  profile: Profile;
};

function ProfileEdit() {
  const { keypair, profile } = useLoaderData() as LoaderData;
  const error = useActionData() as string;

  return (
    <div className="flex flex-col items-center flex-1 w-[360px] ">
      <Panel>
        <div className="h-6 w-6 cursor-pointer hover:bg-gray-100">
          <BackButton />
        </div>
        <h1 className="font-semibold text-lg text-aka-blue pt-1">
          Edit {keypair.name}
        </h1>
        <Form id="profileForm" method="post">
          <input
            type="hidden"
            id="privateKey"
            name="privateKey"
            value={keypair.private_key}
          />
          <div className="w-full pt-2 font-semibold">
            <label htmlFor="name">Profile name</label>
            <input
              autoFocus
              type="text"
              id="name"
              name="name"
              placeholder="profile name"
              defaultValue={keypair.name}
              className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
            />
            <div className="h-4 text-red-500">
              {error && <span>{error}</span>}
            </div>
          </div>

          <div className="w-full font-semibold">
            <label htmlFor="color">Profile color</label>
            <input
              type="color"
              id="color"
              name="color"
              defaultValue={profile.color}
              className="w-full h-10 p-1 bg-gray-100 dark:bg-slate-900 border border-slate-300"
            />
          </div>

          <div className="flex flex-col items-center flex-1 w-auto pt-4">
            <div id="npub" className="w-80">
              <div id="npub_label" className="font-semibold">
                Public Key (npub)
              </div>
              <div id="npub_value" className="break-words">
                {keypair.npub}
              </div>
            </div>
          </div>
          <div className="mx-auto w-[4.5rem] pt-4">
            <InputButton>Save</InputButton>
          </div>
        </Form>
        <div>
          <div className="flex justify-end text-slate-500">
            <Link className="hover:text-red-500" to={`/profiles/delete`}>
              delete
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export const loader = async ({ params }) => {
  const currentKey = await storage.getCurrentKey();
  if (currentKey == null) return redirect("/popup");

  const profile = await storage.getProfile(currentKey.public_key);
  return { keypair: currentKey, profile };
};

export async function action({ request, params }) {
  const formData = await request.formData();
  const formkey = formData.get("privateKey");
  const color = formData.get("color");
  let name = formData.get("name") as string;
  name = name.replace(/\p{C}/gu, "");

  if (name == "") return "name can not be blank";

  // save data
  const keypair = KeyPair.initKeyPair(formkey, name, true);
  await storage.upsertKey(keypair);

  // Get existing profile data first
  const existingProfile = await storage.getProfile(keypair.public_key);

  // Merge existing data with updates
  let profileData = {
    ...existingProfile,
    color: color
  };
  saveProfile(keypair.public_key, profileData);

  return redirect("/profiles");
}

export default ProfileEdit;
