import net from "net";
import split from "split";
import { SPLITTER } from "./config";
import { createPromise } from "./helpers/promise";
import Controller from "./controller";
import { cleanupServer } from "./helpers/cleanup";

export default class Service {
  private readonly server;

  private constructor(serverConnection: net.Server) {
    this.server = serverConnection;
  }

  static create(port: number = 8080, serviceName: string): Promise<Service> {
    const [resolve, reject, promise] = createPromise();
    const server = net.createServer();
    cleanupServer(server);

    server.listen(port, async () => {
      const dnsConnection = await Service.registerService(serviceName, port);
      if (!dnsConnection) {
        server.close();
        reject("[SERVICE] Error: Failed to register service in name server.");
        return;
      }

      server.on("close", () => {
        dnsConnection.remove();
        console.info("[SERVICE] - Service closed.");
      });

      console.log(`[SERVICE] - Server listening on port ${port}`)

      const service = new Service(server);
      resolve(service);
    });

    server.on("error", (error) => {
      reject(error.message);
    });

    return promise;
  }

  private static async registerService(
    serviceName: string,
    port: number
  ): Promise<Controller | undefined> {
    try {
      const nameServerConnection = await Controller.create({
        port: port,
      });
      await nameServerConnection.register(serviceName);
      return nameServerConnection;
    } catch {
      return;
    }
  }

  setOnData(onDataFunction: (data: Object) => any) {
    this.server.on("connection", (client) => {
      const stream = client.pipe(split());

      stream.on("data", (clientData) => {
        console.log(client.readable);
        
        if (!client.readable) {
          return;
        }

        let dataObj = {};
        try {
          dataObj = JSON.parse(clientData as string);
        } catch {
          return;
        }

        const result = onDataFunction(dataObj);
        const resultMessage = JSON.stringify(result);
        client.write(resultMessage + SPLITTER);
      });
    });
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
