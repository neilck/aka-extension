import React from "react";

function InputButton({ children }) {
  return (
    <button
      type="submit"
      className="bg-aka-blue hover:bg-blue text-white font-bold py-2 px-4 rounded"
    >
      <p className="tracking-widest">{children}</p>
    </button>
  );
}

export default InputButton;
