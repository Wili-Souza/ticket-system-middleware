import { RequestData } from "./request-data";

export interface ConnectionI {
  request: (serviceName: string, data: RequestData) => Promise<Object | string>;
  register: (serviceName: string) => Promise<Object | string>;
  remove: () => Promise<Object | string>;
}
