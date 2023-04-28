import React from "react";
import { useNavigate } from "react-router-dom";

export function BackButton(props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        navigate(-1);
      }}
    >
      <svg
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        ></path>
      </svg>
    </div>
  );
}
