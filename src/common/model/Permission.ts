export class Permission {
  host: string = "";
  condition: string = "";
  level: number;
  created_at: number;

  constructor(
    host: string,
    condition: string,
    level: number,
    created_at: number
  ) {
    this.host = host;
    this.condition = condition;
    this.level = level;
    this.created_at = created_at;
  }
}
