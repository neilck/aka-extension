import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import "../assets/tailwind.css";

import Options, {
  loader as optionsLoader,
  action as optionsAction,
} from "./options";

const routes = [
  {
    path: "/",
    element: <Options />,
    loader: optionsLoader,
    action: optionsAction,
    id: "options",
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
  console.log(appContainer);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

init();
