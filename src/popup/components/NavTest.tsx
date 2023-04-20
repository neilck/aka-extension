import React from "react";
import { Form, Link } from "react-router-dom";

function NavTest(props: any) {
  const selected = props.selected;
  const additional: string[] = props.additional;

  const profileButtonClick = () => {
    const dropdown = document.querySelector("#dropdown");
    dropdown.classList.toggle("hidden");
  };

  const profileItemClick = (e: React.MouseEvent<HTMLElement>) => {
    const value = e.currentTarget.id;
    // save new value and refresh
    // const profileButton = document.querySelector("#profileButtonText");
    // profileButton.innerHTML = value;

    // hide dropdown
    const dropdown = document.querySelector("#dropdown");
    dropdown.classList.toggle("hidden");
  };

  return (
    <nav className="bg-aka-blue text-aka-yellow shadow-lg">
      <div className="max-w-6xl mx-auto h-10 px-4 py-2">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <Link to="/">
              <div className="flex items-center">
                <img src="logo.svg" alt="Logo" className="h-4 w-4 mr-2" />
                <span className="font-semibold text-lg">AKA Profiles</span>
              </div>
            </Link>
          </div>
          <div className="py-[0.3rem]">
            <button
              id="profileButton"
              data-dropdown-toggle="dropdown"
              className="h-4 w-40  text-black bg-white hover:bg-gray-100 focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm  text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              type="button"
              onClick={profileButtonClick}
            >
              <div id="profileButtonText" className="flex-1">
                {selected}{" "}
              </div>
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
            </button>
            {/* <!-- Dropdown menu --> */}
            <div
              id="dropdown"
              className="w-40 z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow  dark:bg-gray-700"
            >
              <ul
                className="py-2 text-sm text-gray-700 dark:text-gray-200"
                aria-labelledby="dropdownDefaultButton"
              >
                {additional.map((value) => (
                  <li key={value}>
                    <div
                      id={value}
                      onClick={profileItemClick}
                      className="block px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      {value}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavTest;
