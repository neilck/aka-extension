import browser from "webextension-polyfill";

export async function getProfiles() {
  let results = await browser.storage.local.get("profiles");

  if (!results || !results.profiles ) {
    const defaultProfile = {
      profiles: {
      selected: "profilex",
      additional: ["profile2", "profile3"]
      }
    };
     browser.storage.local.set(defaultProfile);
    return defaultProfile;
  }

  return results.profiles;
}
