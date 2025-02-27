import { Relay } from "./Relay";
import { Policy } from "./Policy";

export type Profile = {
  relays: Relay[];
  policies: Policy[];
  protocol_handler: string;
  color: string;
};
