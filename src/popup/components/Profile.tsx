import React from "react";
import { Link, useLoaderData, redirect } from "react-router-dom";
import Storage from "../../common/Storage";
import { IKeyPair } from "../../common/model/keypair";

function Profile() {
  const currentProfile = useLoaderData() as IKeyPair;
  return (
    <div>
      <h1>Profile Component</h1>
      {currentProfile.get_name()}
      <br />
      {currentProfile.get_npubshort()}
      <br />
      <button
        type="submit"
        className="bg-aka-blue hover:bg-blue text-white font-bold py-2 px-4 rounded"
      >
        <p className="tracking-widest">
          <Link to={`/profiles/${currentProfile.get_publickey()}/edit`}>
            EDIT
          </Link>
        </p>
      </button>
    </div>
  );
}

export const loader = async () => {
  const storage = Storage.getInstance();
  const currentKey = await storage.getCurrentKey();

  console.log("Profile loader() currentKey: " + JSON.stringify(currentKey));
  if (currentKey == null) return redirect("/popup");

  return currentKey;
  /*
  return redirect("/profiles/" + currentKey.get_publickey());
  */
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;

  return null;
}

export default Profile;
