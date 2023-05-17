import React from "react";
import { Form, useLoaderData, redirect } from "react-router-dom";
import Panel from "../../common/components/Panel";
import { BackButton } from "../components//BackButton";
import { KeyPair } from "../../common/model/KeyPair";
import * as storage from "../../common/storage";

function ProfileDelete() {
  const currentProfile = useLoaderData() as KeyPair;

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
              className="w-full flex flex-col flex-nowrap justify-between space-y-1"
            >
              <div className="font-semibold text-lg text-aka-blue">
                <p>Remove profile {currentProfile.name}?</p>
              </div>
              <div className="italic">
                <p>This profile and associated keys will be removed.</p>
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
                {currentProfile.npub}
              </div>
            </div>
          </div>
          <Form id="deleteForm" method="post">
            <div className="mx-auto w-[4.5rem] pt-4">
              <input
                type="hidden"
                id="pubkey"
                name="pubkey"
                value={currentProfile.public_key}
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-blue text-white font-bold py-2 px-4 rounded"
              >
                <p className="tracking-widest">Remove</p>
              </button>
            </div>
          </Form>
        </Panel>
      </div>
    </div>
  );
}

export const loader = async ({ params }) => {
  const currentKey = await storage.getCurrentKey();
  if (currentKey == null) return redirect("/popup");

  return currentKey;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const pubkey = updates.pubkey;

  await storage.deleteKey(pubkey);

  return redirect("/profiles");
}

export default ProfileDelete;
