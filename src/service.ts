import net, { AddressInfo } from "net";
import split from "split";
import { SPLITTER } from "./config";
import { createPromise } from "./helpers/promise";
import { cleanupServer } from "./helpers/cleanup";
import NameServerConnection from "./connections/name-server-connection";
import ServiceConnection from "./connections/service-connection";
import ip from "ip";

const STANDBY_KEY = "Standby";

export default class Service {
  private nameServerConnection: NameServerConnection;
  readonly name: string;
  readonly address: string;
  private readonly server: net.Server;
  private readonly dataControl: {
    sync: boolean;
    dataLists: { [key: string]: any[] };
    oldDataLists: { [key: string]: any[] };
  } = {
    sync: false,
    dataLists: {},
    oldDataLists: {},
  };

  private constructor(
    name: string,
    address: string,
    serverConnection: net.Server,
    nameServerConnection: NameServerConnection
  ) {
    this.name = name;
    this.address = address;
    this.server = serverConnection;
    this.nameServerConnection = nameServerConnection;
  }

  static create(
    name: string,
    options: {
      customPort: number;
      isStandby?: boolean;
    }
  ): Promise<Service> {
    const [resolve, reject, promise] = createPromise();
    const server = net.createServer();
    cleanupServer(server);

    server.listen(options.customPort, async () => {
      const { port } = server.address() as AddressInfo;
      const serverPort = options.customPort || port;
      const serverAddress = `${ip.address()}:${port}`;

      const serviceName = options.isStandby ? name + STANDBY_KEY : name;
      NameServerConnection.create(serverPort)
        .then((nameServerConnection) => {
          try {
            nameServerConnection.register(serviceName);
          } catch {
            reject(
              "[SERVICE] Error: Failed to register service in name server."
            );
            return;
          }

          server.on("close", async () => {
            console.log("removing...");
            await nameServerConnection.remove();
            console.info("[SERVICE] - Service closed.");
          });

          const service = new Service(
            name,
            serverAddress,
            server,
            nameServerConnection
          );

          console.log(`[SERVICE] - Server listening on port ${serverPort}`);
          resolve(service);
        })
        .catch((error) => reject(error));
    });

    server.on("error", (error) => {
      reject(error.message);
    });

    return promise;
  }

  activateDataSync(dataLists: { [key: string]: any[] }): void {
    if (Object.keys(dataLists).length <= 0) {
      return;
    }
    this.dataControl.oldDataLists = { ...dataLists };
    this.dataControl.dataLists = dataLists;
    this.dataControl.sync = true;
  }

  setOnData(onDataFunction: (data: Object) => any) {
    this.server.on("connection", (client) => {
      const stream = client.pipe(split());

      stream.on("data", (clientData) => {
        if (!client.readable) {
          return;
        }

        let dataObj: {
          method?: string;
          path?: string;
        } = {};
        try {
          dataObj = JSON.parse(clientData as string);
        } catch {
          return;
        }

        const result = onDataFunction(dataObj);
        this.checkAndSendSyncData(dataObj);
        const resultMessage = JSON.stringify(result);
        client.write(resultMessage + SPLITTER);
      });
    });
  }

  private checkAndSendSyncData({
    path,
    method,
  }: {
    path?: string;
    method?: string;
  }): void {
    if (
      !this.dataControl.sync ||
      !path ||
      method === "syncData" ||
      this.dataControl.dataLists === this.dataControl.oldDataLists
    ) {
      console.log(
        "Not sending sync.",
        path,
        this.dataControl.sync,
        this.dataControl.dataLists === this.dataControl.oldDataLists
      );
      return;
    }
    console.log(
      "Sending sync.",
      path,
      this.dataControl.sync,
      this.dataControl.dataLists === this.dataControl.oldDataLists
    );
    this.dataControl.oldDataLists = this.dataControl.dataLists;

    const serviceName = this.name.endsWith("Standby")
      ? this.name.replace("Standby", "")
      : this.name;
    const serviceNames = [serviceName, serviceName + STANDBY_KEY];

    this.nameServerConnection
      .requestAll(serviceNames)
      .then((servicesAddresses) => {
        const addresses = servicesAddresses.filter((add) => {
          return add !== this.address;
        });
        addresses.forEach((serviceAddress) => {
          this.sendSyncDataToService(serviceAddress, path);
        });
      })
      .catch((error) => {
        console.log("[SERVICE] Sync error: ", error);
      });
  }

  private sendSyncDataToService(serviceAddress: string, path: string): void {
    const [address, port] = serviceAddress.split(":");
    ServiceConnection.create(address, Number(port))
      .then((serviceConnection) => {
        serviceConnection.makeRequest({
          method: "syncData",
          path,
          data: {
            dataList: this.dataControl.dataLists[path],
          },
        });
      })
      .catch((error) => {
        console.log("[SERVICE] Sync communication error: ", error);
      });
  }
}
