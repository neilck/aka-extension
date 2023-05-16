import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import "../assets/tailwind.css";

import Prompt, {
  loader as promptLoader,
  action as promptAction,
} from "./prompt";

const routes = [
  {
    path: "/",
    element: <Prompt />,
    loader: promptLoader,
    action: promptAction,
    id: "prompt",
  },
];

const router = createMemoryRouter(routes);

function init() {
  const appContainer = document.createElement("div");
  document.body.appendChild(appContainer);
  if (!appContainer) {
    throw new Error("Can not find AppContainer");
  }
  const root = createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

init();
