import Client from "../client";
import Service from "../service";

const TEST_SERVICE_PORT = 5080;

export const clientServiceTest = async () => {
    try {
      console.info("[TEST] Creating service...");
      const service = await Service.create(TEST_SERVICE_PORT, "testService");
      service.setOnData((data) => {
        console.info("service got request with data: ", data);
        return { status: "success", forService: "testService" };
      });
      
      console.info("[TEST] Creating client...");
      const clientConstroller = await Client.create();
  
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
    } catch (error) {
      console.error(error);
    }
  };
  