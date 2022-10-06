import net from "net";
import split from "split";
import { SPLITTER } from "./config";
import { createPromise } from "./helpers/promise";
import Controller from "./controller";

export default class Service {
  private readonly serverConnection;

  private constructor(serverConnection: net.Server) {
    this.serverConnection = serverConnection;
  }

  static create(port: number = 8080, serviceName: string): Promise<Service> {
    const [resolve, reject, promise] = createPromise();
    const serverConnection = net.createServer();

    serverConnection.listen(port, async () => {
      const registered = await Service.registerService(serviceName, port);
      if (!registered) {
        serverConnection.close();
        reject("[SERVICE] Error: Failed to register service in name server.");
      }
      // console.info(`[SERVICE] INFO: Running service on port ${port}`);
      const server = new Service(serverConnection);
      resolve(server);
    });

    serverConnection.on("error", (error) => {
      reject(error.message);
    });

    return promise;
  }

  setOnData(onDataFunction: (data: Object) => any) {
    this.serverConnection.on("connection", (client) => {
      const stream = client.pipe(split());

      stream.on("data", (clientData) => {

        if (!client.readable) {
          return
        }

        let dataObj = {}
        try {
          dataObj = JSON.parse(clientData as string);
        } catch {
          return
        }

        const result = onDataFunction(dataObj);
        const resultMessage = JSON.stringify(result);
        client.write(resultMessage + SPLITTER);
      });
    });
  }

  private static async registerService(
    serviceName: string,
    port: number
  ): Promise<boolean> {
    try {
      const nameServerConnection = await Controller.create({
        port: port,
      });
      await nameServerConnection.register(serviceName);
      return true;
    } catch {
      return false;
    }
  }
}

/*
  - To create a Service Server, use the static method:
      ServiceServer.create(port: number, serviceName: string)
      e.g.:
      const service = ServiceServer.create(5001, "testService")
    
  
  - To allow your server to receive requests, use the method
      setOnData(
        onDataFunction: (data: Object) => any       --> function called for every request
      )
      the function must return a value that will be sent as response to the client
      e.g.:
      const service = ServiceServer.create(5001, "testService")
      service.setOnData(data: Object): Object => {
        * checking and processing * 
        return {status: "sucess", forService: "testService"};
      })
*/

// ServiceServer.create(5001, "testService").then((server) => {
//   server.setOnData((data: Object): Object => {
//     return {status: "sucess", forService: "testService"};
//   });
// });
