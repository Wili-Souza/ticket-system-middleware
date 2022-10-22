import net, { AddressInfo } from "net";
import split from "split";
import { SPLITTER } from "./config";
import { createPromise } from "./helpers/promise";
import { cleanupServer } from "./helpers/cleanup";
import NameServerConnection from "./connections/name-server-connection";

export default class Service {
  private readonly server;

  private constructor(
    serverConnection: net.Server
  ) {
    this.server = serverConnection;
  }

  static create(customPort: number, serviceName: string): Promise<Service> {
    const [resolve, reject, promise] = createPromise();
    const server = net.createServer();
    cleanupServer(server);

    server.listen(customPort, async () => {
      const { port } = server.address() as AddressInfo;
      const serverPort = customPort || port;

      console.log(`[SERVICE] - Server listening on port ${serverPort}`);

      NameServerConnection.create(customPort)
        .then((nameServerConnection) => {
          try {
            nameServerConnection.register(serviceName);
          } catch {
            reject(
              "[SERVICE] Error: Failed to register service in name server."
            );
            return;
          }

          server.on("close", () => {
            nameServerConnection.remove();
            console.info("[SERVICE] - Service closed.");
          });

          const service = new Service(server);
          resolve(service);
        })
        .catch((error) => reject(error));
    });

    server.on("error", (error) => {
      reject(error.message);
    });

    return promise;
  }

  setOnData(onDataFunction: (data: Object) => any) {
    this.server.on("connection", (client) => {
      const stream = client.pipe(split());

      stream.on("data", (clientData) => {
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
