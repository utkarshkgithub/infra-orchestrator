export class BuildError extends Error {
  constructor(
    message: string,
    public logs: string[],
  ) {
    super(message);
    this.name = "BuildError";
  }
}
