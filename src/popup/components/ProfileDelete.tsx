import React from "react";
import { Form, useLoaderData, redirect } from "react-router-dom";
import Panel from "./Panel";
import InputButton from "./InputButton";
import { BackButton } from "./BackButton";
import { IKeyPair } from "../../common/model/keypair";
import Storage from "../../common/Storage";

function ProfileDelete() {
  const currentProfile = useLoaderData() as IKeyPair;

  return (
    <div>
      <div id="panel_outer" className="p-5">
        <Panel>
          <div className="h-6 w-6 cursor-pointer hover:bg-gray-100">
            <BackButton />
          </div>
          <div
            id="panel_inner"
            className="flex flex-col items-center flex-1 p-1 w-auto gap-1"
          >
            <div
              id="top_row"
              className="w-full flex flex-row flex-nowrap justify-between"
            >
              <div className="font-semibold text-lg text-aka-blue">
                Delete {currentProfile.get_name()}
              </div>
            </div>
          </div>
          <div
            id="data"
            className="flex flex-col items-center flex-1 p-1 w-auto gap-2"
          >
            <div id="npub" className="w-80">
              <div id="npub_label" className="font-semibold">
                Public Key (npub)
              </div>
              <div id="npub_value" className="break-words">
                {currentProfile.get_npub()}
              </div>
            </div>
          </div>
          <Form id="deleteForm" method="post">
            <div className="mx-auto w-[4.5rem] pt-4">
              <input
                type="hidden"
                id="pubkey"
                name="pubkey"
                value={currentProfile.get_publickey()}
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-blue text-white font-bold py-2 px-4 rounded"
              >
                <p className="tracking-widest">Delete</p>
              </button>
            </div>
          </Form>
        </Panel>
      </div>
    </div>
  );
}

export const loader = async ({ params }) => {
  const storage = Storage.getInstance();
  const currentKey = await storage.getCurrentKey();

  console.log("Profile loader() currentKey: " + JSON.stringify(currentKey));
  if (currentKey == null) return redirect("/popup");

  return currentKey;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const pubkey = updates.pubkey;

  const storage = Storage.getInstance();
  await storage.deleteKey(pubkey);

  return redirect("/profiles");
}

export default ProfileDelete;
