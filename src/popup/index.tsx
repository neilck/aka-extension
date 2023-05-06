import React from "react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "../assets/tailwind.css";

import Root, {
  loader as rootLoader,
  action as rootAction,
} from "./routes/Root";
import Popup, { action as popupAction } from "./pages/Popup";
import Profile, {
  loader as profileLoader,
  action as profileAction,
} from "./pages/Profile";
import ProfileEdit, {
  loader as profileEditLoader,
  action as profileEditAction,
} from "./pages/ProfileEdit";
import ProfileCreate, {
  action as profileCreateAction,
} from "./pages/ProfileCreate";
import ProfileDelete, {
  loader as profileDeleteLoader,
  action as profileDeleteAction,
} from "./pages/ProfileDelete";
import ErrorPage from "./pages/ErrorPage";
import Test, { loader as testLoader, action as testAction } from "./pages/Test";

import Storage from "../common/Storage";

const routes = [
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    loader: rootLoader,
    action: rootAction,
    id: "root",
    children: [
      {
        index: true,
        loader: profileLoader,
        action: profileAction,
        element: <Profile />,
      },
      {
        path: "/popup",
        action: popupAction,
        element: <Popup />,
      },
      {
        path: "/profiles",
        loader: profileLoader,
        action: profileAction,
        element: <Profile />,
      },
      {
        path: "/profiles/create",
        action: profileCreateAction,
        element: <ProfileCreate />,
      },
      {
        path: "/profiles/delete",
        loader: profileDeleteLoader,
        action: profileDeleteAction,
        element: <ProfileDelete />,
      },
      {
        path: "/profiles/edit",
        loader: profileEditLoader,
        action: profileEditAction,
        element: <ProfileEdit />,
      },
      {
        path: "/test",
        element: <Test />,
        loader: testLoader,
        action: testAction,
      },
    ],
  },
];

const router = createMemoryRouter(routes);

const storage = Storage.getInstance();
// loads keys to load static class
storage.getKeys();

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
