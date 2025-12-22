declare module "assert" {
  function internal(value: unknown, message?: string | Error): asserts value;
  export = internal;
}
