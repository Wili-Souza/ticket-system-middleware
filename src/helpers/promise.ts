import { PromiseMethod } from "../types/promise-handler";

export const createPromise = (): [
  PromiseMethod,
  PromiseMethod,
  Promise<any>
] => {
  let resolver = (value: any) => {};
  let rejecter = (value: any) => {};
  const promise = new Promise<any>((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;
  });
  return [resolver, rejecter, promise];
};
