import Controller from "../controller";
import { createPromise } from "../helpers/promise";
import Service from "../service";
import { testAllEventRoutes } from "./event-routes";
import { testAllOrderRoutes } from "./order-routes";

const TEST_SERVICE_PORT = 5080;

const ticketServiceTest = async (requestData: any): Promise<any> => {
  const [resolve, reject, promise] = createPromise();

  // start a connection with service
  console.info("[TEST] Creating client...");
  const clientConstroller = await Controller.create();

  console.info("[TEST] Making request to service...");
  clientConstroller
    .request("ticketService", requestData)
    .then((data: Object) => resolve(data))
    .catch((error: Object) => reject(`[CLIENT] ERROR: DID NOT GET - ${error}`));

  return promise;
};

const startRouteTests = () => {
  testAllEventRoutes(ticketServiceTest).catch((error) => console.error(error));
  testAllOrderRoutes(ticketServiceTest).catch((error) => console.error(error));
};

startRouteTests();

const clientServiceTest = async () => {
  try {
    console.info("[TEST] Creating service...");
    const service = await Service.create(TEST_SERVICE_PORT, "testService");
    service.setOnData((data) => {
      console.info("service got request with data: ", data);
      return { status: "success", forService: "testService" };
    });

    // start a connection with service
    console.info("[TEST] Creating client...");
    const clientConstroller = await Controller.create();

    console.info("[TEST] Making request to service...");
    const requestData = { method: "get" };
    clientConstroller
      .request("testService", requestData)
      .then((data: Object) => {
        console.info(`[CLIENT] INFO: GOT`, data);
      })
      .catch((error: Object) => {
        console.error(`[CLIENT] ERROR: DID NOT GET - ${error}`);
      });

    // clientConstroller
    //   .register("testService")
    //   .then((data: Object) => {
    //     console.info(`[CLIENT] INFO: REGISTERED - ${data}`);
    //   })
    //   .catch((error: Object) => {
    //     console.error(`[CLIENT] ERROR: NOT REGISTERED - ${error}`);
    //   });

    // clientConstroller
    //   .remove()
    //   .then((data: Object) => {
    //     console.info(`[CLIENT] INFO: REMOVED - ${data}`);
    //   })
    //   .catch((error: Object) => {
    //     console.error(`[CLIENT] ERROR: DID NOT REMOVE - ${error}`);
    //   });
  } catch (error) {
    console.error(error);
  }
};
