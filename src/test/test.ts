import Client from "../client";
import { createPromise } from "../helpers/promise";
import { testAllEventRoutes } from "./event-routes";
import { testAllOrderRoutes } from "./order-routes";

const ticketServiceTest = async (requestData: any): Promise<any> => {
  const [resolve, reject, promise] = createPromise();
  const clientConstroller = await Client.create();

  clientConstroller
    .request("ticketService", requestData)
    .then((data: Object) => resolve(data))
    .catch((error: Object) => reject(`[CLIENT] ERROR: DID NOT GET - ${error}`));

  return promise;
};

const startRouteTests = () => {
  testAllEventRoutes(ticketServiceTest).catch((error) => console.error(error));
  // testAllOrderRoutes(ticketServiceTest).catch((error) => console.error(error));
};

startRouteTests();