import browser from "webextension-polyfill";

export interface Profile {
  id: string,
  name: string,
  npub?: string,
  hexpubkey?: string,
  isCurrent?: boolean
}

/*** Local Storage ***/

export async function getProfiles(): Promise<Profile[]> {
  
  let results = await browser.storage.local.get("root");

  if (!results.root || !results.root.profiles ) {
    const setProfiles = [
      { id: "1", name: "Profile 1", isCurrent: true}, 
      { id: "2", name: "Profile 2", isCurrent: false}
    ];

     browser.storage.local.set(
      { root: { profiles: setProfiles } });
     }

   results = await browser.storage.local.get("root");
   return results.root.profiles;

}

export async function changeCurrentProfile(id: string) {
  let results = await browser.storage.local.get("root");
  if (!results.root.profiles) return;

  const profiles: Profile[] = results.root.profiles;
  profiles.map( (profile) => {
    profile.isCurrent = profile.id == id;
  });

  browser.storage.local.set(
    { root: { profiles: profiles } });
}

