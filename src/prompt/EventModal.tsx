import React from "react";

interface IEventModalProps {
  details: string;
}

export default function EventModal(props: IEventModalProps) {
  const [showModal, setShowModal] = React.useState(false);
  const details = props.details;
  return (
    <>
      <button
        className="text-slate-500 hover:text-slate-900 mr-1 mb-1 ease-linear transition-all duration-150"
        type="button"
        onClick={() => setShowModal(true)}
      >
        Show details...
      </button>
      {showModal && (
        <>
          <div className="bg-slate-300 bg-opacity-50 border-2 border-solid border-slate-500 justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-1 mx-auto max-w-3xl">
              {/*content*/}
              <div className="rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start font-semibold justify-between py-2 px-4 border-b border-solid border-slate-200 rounded-t">
                  Details
                </div>
                {/*body*/}
                <div className="px-2">
                  <div className="w-[18rem] text-left">
                    <pre style={{ overflow: "scroll", height: "300px" }}>
                      {/* <code>{JSON.stringify(params, null, 2)}</code> */}
                      <code>{details}</code>
                    </pre>
                  </div>
                </div>
                {/*footer*/}
                <div className="flex justify-center p-3 border-t border-solid border-slate-200 rounded-b">
                  <button
                    className="background-transparent font-bold py-2 outline-none mr-1 mb-1"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    <p className="tracking-wider">close</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
