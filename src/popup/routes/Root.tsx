import "./Root.css";

import React from "react";
import { Link, Outlet, useLoaderData, redirect } from "react-router-dom";
import ProfileNav from "../components/ProfileNav";
import {
  Profile,
  getProfiles,
  changeCurrentProfile,
} from "../../common/storage";
import { KeyPairManager } from "../../common/storage/keypairmanager";
import { IKeyPair, KeyPair } from "../../common/storage/keypair";

export default function Root() {
  const keypairs = useLoaderData() as IKeyPair[];

  return (
    <div className="bg-gray-100 dark:bg-slate-900 w-full h-full">
      <div>
        {window.location.pathname + "  "} <Link to="/test">Test</Link>{" "}
        <Link to="/profile">Profile</Link>
      </div>

      <ProfileNav />

      <div id="detail">
        <Outlet />
      </div>
    </div>
  );
}

export const loader = async (): Promise<IKeyPair[]> => {
  const keyPairManager = new KeyPairManager();
  await keyPairManager.load();
  return keyPairManager.keypairs;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedID = updates.selectedID;

  changeCurrentProfile(selectedID);
  return redirect("/");
}
