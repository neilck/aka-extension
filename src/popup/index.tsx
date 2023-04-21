import React from "react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "../assets/tailwind.css";

import Root, { loader as rootLoader } from "./routes/Root";
import Popup from "./popup";
import About from "./components/About";
import Badge from "./components/Badge";
import ErrorPage from "./components/ErrorPage";

const routes = [
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    loader: rootLoader,
    id: "root",
    children: [
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/badge",
        element: <Badge />,
      },
    ],
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
