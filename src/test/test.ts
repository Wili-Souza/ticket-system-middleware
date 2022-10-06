import Controller from "../controller";
import Service from "../service";

const TEST_SERVICE_PORT = 5080;

const startTest = async () => {
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
    clientConstroller
      .request("testService", { method: "get" })
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

startTest();
