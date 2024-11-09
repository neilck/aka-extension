import React from "react";
import {
  Link,
  useRouteLoaderData,
  Form,
  useSubmit,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { KeyPair } from "../common/model/KeyPair";

function ProfileSelect({ disabled }: { disabled: boolean }) {
  const keypairs = useRouteLoaderData("prompt") as KeyPair[];
  const navigate = useNavigate();

  const curProfile = keypairs.find((profile) => profile.isCurrent);
  const otherProfiles = keypairs.filter((profile) => !profile.isCurrent);

  const hideDropdownPaths = ["/popup", "/profiles/create"];
  const pathname = useLocation().pathname;
  let hideDropdown = hideDropdownPaths.some((path) => pathname.includes(path));

  const profileButtonClick = () => {
    if (disabled) return;
    const dropdown = document.querySelector("#dropdown");
    dropdown?.classList.toggle("hidden");
  };

  const profileItemClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;

    const hiddenInput = document.querySelector(
      "#selectedPubkey"
    ) as HTMLInputElement;
    hiddenInput.value = e.currentTarget.id;

    const dropdown = document.querySelector("#dropdown");
    dropdown?.classList.add("hidden");

    const form = document.querySelector("#profileForm") as HTMLFormElement;
    submit(form);
  };

  const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const dropdown = document.querySelector("#dropdown");
    dropdown?.classList.add("hidden");
  };

  const submit = useSubmit();

  return (
    <div className="flex justify-between">
      <div className={`py-[0.1rem] ${hideDropdown ? "hidden" : ""}`}>
        <button
          id="profileButton"
          data-dropdown-toggle="dropdown"
          className="h-5 w-[12rem] bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-gray-200 focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm  text-center inline-flex items-center"
          type="button"
          onClick={profileButtonClick}
          disabled={disabled}
        >
          <div id="profileButtonText" className="flex-1">
            {curProfile ? curProfile.name + " " : "Select Profile"}
          </div>
          {!disabled && (
            <svg
              className="w-4 h-4 ml-2 mr-1"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          )}
        </button>
        {/* <!-- Dropdown menu --> */}
        <Form id="profileForm" action="/" method="post">
          <input
            type="hidden"
            id="selectedPubkey"
            name="selectedPubkey"
            value="test"
          />
          <div
            id="dropdown"
            onMouseLeave={onMouseLeave}
            className="w-full hidden bg-gray-100 divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700"
          >
            <ul
              className="py-1 text-sm text-gray-700 dark:text-gray-200"
              aria-labelledby="dropdownDefaultButton"
            >
              {otherProfiles.map((profile) => (
                <li key={profile.public_key}>
                  <div
                    id={profile.public_key}
                    onClick={profileItemClick}
                    className="block px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    {profile.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default ProfileSelect;
