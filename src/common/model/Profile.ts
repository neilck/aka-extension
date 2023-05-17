import { Relay } from "./Relay";
import { Permission } from "./Permission";

export class Profile {
  relays: Relay[] = [];
  permissions: Permission[] = [];
  protocol_handler: string = "";

  constructor(
    relays: Relay[],
    permissions: Permission[],
    protocol_handler: string
  ) {
    this.relays = relays;
    this.permissions = permissions;
    this.protocol_handler = protocol_handler;
  }
}
