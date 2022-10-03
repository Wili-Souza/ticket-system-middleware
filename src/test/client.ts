import Connection from "..";


const start = async () => {
  try {
    const connection = await Connection.create();
    connection
      .register("testService")
      .then((data: string | Object) => {
        console.info(`[CLIENT] INFO: REGISTERED - ${data}`);
      })
      .catch((error: Object) => {
        console.error(`[CLIENT] ERROR: NOT REGISTERED - ${error}`);
      });

    connection
      .request("testService")
      .then((data: Object) => {
        console.info(`[CLIENT] INFO: GOT - ${data}`);
      })
      .catch((error: Object) => {
        console.error(`[CLIENT] ERROR: DID NOT GET - ${error}`);
      });

    connection
      .remove()
      .then((data: Object) => {
        console.info(`[CLIENT] INFO: REMOVED - ${data}`);
      })
      .catch((error: Object) => {
        console.error(`[CLIENT] ERROR: DID NOT REMOVE - ${error}`);
      });
  } catch (error) {
    console.error(error);
  }
};

start();