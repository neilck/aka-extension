import "./Root.css";

import React from "react";
import { Link, Outlet, useLoaderData, redirect } from "react-router-dom";
import ProfileNav from "../components/ProfileNav";
import { loadKeyPairs, saveKeyPairs } from "../../common/storage";
import { IKeyPair } from "../../common/model/keypair";

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
  return await loadKeyPairs();
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;

  const keypairs = useLoaderData() as IKeyPair[];
  keypairs.map((item) => {
    item.set_isCurrent(item.get_publickey() == selectedPubkey);
  });

  saveKeyPairs(keypairs);
  return redirect("/");
}
