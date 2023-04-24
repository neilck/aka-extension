import "./Root.css";

import React from "react";
import { Link, Outlet, useLoaderData, redirect } from "react-router-dom";
import ProfileNav from "../components/ProfileNav";
import { Profile, getProfiles, changeCurrentProfile } from "../common";
export default function Root() {
  const profiles: any = useLoaderData();

  return (
    <div className="bg-gray-100 dark:bg-slate-900 w-full h-full">
      <div>
        {profiles.selected} ( {window.location.pathname} + " " )
        <Link to="/test">Test</Link>
      </div>

      <ProfileNav />

      <div id="detail">
        <Outlet />
      </div>
    </div>
  );
}

export const loader = async (): Promise<Profile[]> => {
  let profiles: Profile[] = null;
  profiles = await getProfiles();
  // profiles = [{ id: "1", name: "name", isCurrent: true }];
  return profiles;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedID = updates.selectedID;

  changeCurrentProfile(selectedID);
  return redirect("/");
}
