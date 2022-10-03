export interface ConnectionI {
  request: (serviceName: string) => Promise<Object | string>;
  register: (serviceName: string) => Promise<Object | string>;
  remove: () => Promise<Object | string>;
}
