import React from "react";
import {
  Link,
  useRouteLoaderData,
  Form,
  useSubmit,
  useLocation,
  redirect,
} from "react-router-dom";

function Profile() {
  return (
    <div>
      <h1>Profile Component</h1>
    </div>
  );
}

export const loader = async () => {
  return null;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;

  return null;
}

export default Profile;
