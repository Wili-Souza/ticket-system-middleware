export interface ClientI {
  request: (serviceName: string, data: Object) => Promise<Object | string>;
  // register: (serviceName: string) => Promise<Object | string>;
  // remove: () => Promise<Object | string>;
}
