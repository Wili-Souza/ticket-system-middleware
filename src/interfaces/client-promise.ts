import { PromiseMethod } from "../types/promise-handler";

export interface ClientPromise {
    resolve: PromiseMethod;
    reject: PromiseMethod;
}