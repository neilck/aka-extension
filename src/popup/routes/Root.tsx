import React from "react";
import { Link, Outlet, useLoaderData, redirect } from "react-router-dom";
import ProfileNav from "../components/ProfileNav";
import Test from "../components/Test";

import "./Root.css";
import { Profile, getProfiles, changeCurrentProfile } from "../common";
export default function Root() {
  const profiles: any = useLoaderData();

  return (
    <>
      <ProfileNav />
      <div className=" bg-aka-blue text-aka-yellow">
        <div id="sidebar">
          <h1>
            {profiles.selected} ( {window.location.pathname} )
          </h1>
          <nav>
            <ul>
              <li>
                <Link to="/badge">Badge</Link>
              </li>
              <li>
                <Link to="/test">Test</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="bg-green-300 border-green-600 border-b p-4 m-4 rounded">
          Hello World
        </div>
        <div id="detail">
          <Outlet />
        </div>
      </div>
    </>
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
