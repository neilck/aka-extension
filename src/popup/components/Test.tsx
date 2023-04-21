import React from "react";
import { useLoaderData, Form, redirect } from "react-router-dom";
import browser from "webextension-polyfill";

export function Test() {
  const name: any = useLoaderData();
  console.log("Test Render: " + JSON.stringify(name));

  return (
    <>
      <h1>{name}</h1>
      <Form method="post">
        <input
          type="text"
          id="name"
          name="name"
          className=" border-2 border-black"
        />
        <button type="submit">Submit</button>
      </Form>
    </>
  );
}

export const loader = async (): Promise<string> => {
  const data = await browser.storage.local.get("test");
  console.log("test loader called: " + JSON.stringify(data));
  if (!data || !data.test || !data.test.name) return "<not set>";
  return data.test.name;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const data = Object.fromEntries(formData);
  console.log("test action called: " + JSON.stringify(data));
  const name = data.name;

  browser.storage.local.set({ test: { name: name } });
  return redirect("/test");
}

export default Test;
