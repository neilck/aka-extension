export class Relay {
  url: string = "";
  read: boolean = false;
  write: boolean = false;

  constructor(url: string, read: boolean, write: boolean) {
    this.url = url;
    this.read = read;
    this.write = write;
  }
}
