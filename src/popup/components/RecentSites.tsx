import React, { useEffect, useState } from "react";
import { getRecents } from "../../common/common";
import Panel from "../../common/components/Panel";
// Define the type for items returned by getRecents
type RecentItem = {
  host: string;
  protocol: string;
  pubkey: string;
};

function getFaviconUrl(u: string) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "32");
  return url.toString();
}

const RecentSites: React.FC<{
  pubkey?: string;
  showMore: boolean;
  onShowMore: (isShowingMore: boolean) => void;
}> = ({ pubkey, showMore, onShowMore }) => {
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [showRecents, setShowRecents] = useState<RecentItem[]>([]);

  useEffect(() => {
    // Fetch recent items on component mount
    const fetchRecents = async (pubkey?: string) => {
      try {
        const data = (await getRecents(pubkey)) as RecentItem[];
        setRecents(data);
      } catch (error) {
        console.error("Failed to fetch recent items:", error);
      }
    };
    fetchRecents(pubkey);
  }, [pubkey, recents]);

  useEffect(() => {
    setShowRecents(recents.slice(0, showMore ? 10 : 5));
  }, [recents, showMore]);

  if (recents.length == 0) {
    return <></>;
  }

  return (
    <Panel>
      <div
        id="panel_inner"
        className="flex flex-col items-center flex-1 p-1 w-full gap-1"
      >
        <div className="font-semibold">Most Recent Visits</div>
        <ul className="w-full">
          {showRecents.map((item, index) => {
            // Construct the URL from protocol and host
            const url = `${item.protocol}//${item.host}`;
            const faviconUrl = getFaviconUrl(url);

            return (
              <li
                key={index}
                className="flex items-center justify-between p-1 hover:bg-gray-200 cursor-pointer mb-1"
              >
                {/* Anchor link to the URL */}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center"
                >
                  {/* Display the favicon */}
                  <img
                    src={faviconUrl}
                    alt={`${item.host} favicon`}
                    className="w-4 h-4 mr-3"
                  />

                  <div className="flex-1">
                    <span className="font-medium">{item.host}</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      {recents.length > 5 && (
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              onShowMore(!showMore);
            }}
            className="bg-transparent hover:bg-aka-blue-light text-aka-blue font-semibold hover:text-white py-1 px-2 border border-aka-blue-light hover:border-transparent rounded"
          >
            {showMore ? "show less" : "show more"}
          </button>
        </div>
      )}
    </Panel>
  );
};

export default RecentSites;
