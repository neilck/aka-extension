const kind_data = [
  [0, "User Metadata"],
  [1, "Short Text Note"],
  [3, "Follows"],
  [4, "Encrypted Direct Messages"],
  [5, "Event Deletion Request"],
  [6, "Repost"],
  [7, "Reaction"],
  [8, "Badge Award"],
  [9, "Group Chat Message"],
  [10, "Group Chat Threaded Reply"],
  [11, "Group Thread"],
  [12, "Group Thread Reply"],
  [13, "Seal"],
  [14, "Direct Message"],
  [16, "Generic Repost"],
  [17, "Reaction to a website"],
  [40, "Channel Creation"],
  [41, "Channel Metadata"],
  [42, "Channel Message"],
  [43, "Channel Hide Message"],
  [44, "Channel Mute User"],
  [64, "Chess (PGN)"],
  [818, "Merge Requests"],
  [1021, "Bid"],
  [1022, "Bid confirmation"],
  [1040, "OpenTimestamps"],
  [1059, "Gift Wrap"],
  [1063, "File Metadata"],
  [1311, "Live Chat Message"],
  [1617, "Patches"],
  [1621, "Issues"],
  [1622, "Replies"],
  [1971, "Problem Tracker"],
  [1984, "Reporting"],
  [1985, "Label"],
  [1986, "Relay reviews"],
  [1987, "AI Embeddings / Vector lists"],
  [2003, "Torrent"],
  [2004, "Torrent Comment"],
  [2022, "Coinjoin Pool"],
  [4550, "Community Post Approval"],
  [7000, "Job Feedback"],
  [7374, "Reserved Cashu Wallet Tokens"],
  [7375, "Cashu Wallet Tokens"],
  [7376, "Cashu Wallet History"],
  [9041, "Zap Goal"],
  [9321, "Nutzap"],
  [9467, "Tidal login"],
  [9734, "Zap Request"],
  [9735, "Zap"],
  [9802, "Highlights"],
  [10000, "Mute list"],
  [10001, "Pin list"],
  [10002, "Relay List Metadata"],
  [10003, "Bookmark list"],
  [10004, "Communities list"],
  [10005, "Public chats list"],
  [10006, "Blocked relays list"],
  [10007, "Search relays list"],
  [10009, "User groups"],
  [10015, "Interests list"],
  [10019, "Nutzap Mint Recommendation"],
  [10030, "User emoji list"],
  [10050, "Relay list to receive DMs"],
  [10063, "User server list"],
  [10096, "File storage server list"],
  [13194, "Wallet Info"],
  [21000, "Lightning Pub RPC"],
  [22242, "Client Authentication"],
  [23194, "Wallet Request"],
  [23195, "Wallet Response"],
  [24133, "Nostr Connect"],
  [24242, "Blobs stored on mediaservers"],
  [27235, "HTTP Auth"],
  [30000, "Follow sets"],
  [30001, "Generic lists"],
  [30002, "Relay sets"],
  [30003, "Bookmark sets"],
  [30004, "Curation sets"],
  [30005, "Video sets"],
  [30007, "Kind mute sets"],
  [30008, "Profile Badges"],
  [30009, "Badge Definition"],
  [30015, "Interest sets"],
  [30017, "Create or update a stall"],
  [30018, "Create or update a product"],
  [30019, "Marketplace UI/UX"],
  [30020, "Product sold as an auction"],
  [30023, "Long-form Content"],
  [30024, "Draft Long-form Content"],
  [30030, "Emoji sets"],
  [30040, "Modular Article Header"],
  [30041, "Modular Article Content"],
  [30063, "Release artifact sets"],
  [30078, "Application-specific Data"],
  [30311, "Live Event"],
  [30315, "User Statuses"],
  [30388, "Slide Set"],
  [30402, "Classified Listing"],
  [30403, "Draft Classified Listing"],
  [30617, "Repository announcements"],
  [30618, "Repository state announcements"],
  [30818, "Wiki article"],
  [30819, "Redirects"],
  [31388, "Link Set"],
  [31890, "Feed"],
  [31922, "Date-Based Calendar Event"],
  [31923, "Time-Based Calendar Event"],
  [31924, "Calendar"],
  [31925, "Calendar Event RSVP"],
  [31989, "Handler recommendation"],
  [31990, "Handler information"],
  [34235, "Video Event"],
  [34236, "Short-form Portrait Video Event"],
  [34550, "Community Definition"],
  [37375, "Cashu Wallet Event"],
];

export function getKindName(kind: string): string {
  for (let i = 0; i < kind_data.length; i++) {
    if (kind_data[i][0].toString() == kind) {
      return kind_data[i][1] as string;
    }
  }
  return `kind ${kind}`;
}
