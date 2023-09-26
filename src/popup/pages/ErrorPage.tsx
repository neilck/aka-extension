import React from "react";
import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div
      id="error-page"
      className="bg-gray-100 dark:bg-slate-900 flex flex-col items-center h-80 pt-4 w-[360px]"
    >
      <h1 className="text-slate-900 dark:text-white text-lg">Oops!</h1>
      <p className="text-slate-500 dark:text-slate-400">
        Sorry, an unexpected error has occurred.
      </p>
      <p className="text-slate-500 dark:text-slate-400">
        <i>{error.statusText || error.message}</i>
      </p>
      <p className="text-slate-500 dark:text-slate-400">
        <Link to="/">Back to home</Link>
      </p>
    </div>
  );
}
