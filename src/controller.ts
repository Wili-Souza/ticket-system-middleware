import net, { AddressInfo } from "net";
import split from "split";
import { v4 as uuidv4 } from "uuid";
import { ControllerI } from "./interfaces/controller";
import { DNS_ADDRESS, DNS_PORT, SPLITTER } from "./config";
import { createPromise } from "./helpers/promise";
import { ClientPromise } from "./interfaces/client-promise";
import ServiceConnection from "./helpers/service-connection";

export default class Controller implements ControllerI {
  private readonly promises: { [key: string]: ClientPromise } = {};
  private readonly address: string;
  private readonly client: net.Socket;
  private alive: boolean = true;

  private constructor(
    address: string,
    client: net.Socket,
    keepAlive: boolean,
    keepAliveInterval: number
  ) {
    this.address = address;
    this.client = client;
    keepAlive ? this.initKeepAlive(keepAliveInterval) : null;
    this.setOnDataEvent();
  }

  static async create(options?: {
    keepAlive?: boolean;
    keepAliveInterval?: number;
    port?: number;
  }): Promise<Controller> {
    const [resolve, reject, promise] = createPromise();

    const client: net.Socket = new net.Socket();

    Controller.initClientBasicEvents(client);

    client.connect(DNS_PORT, DNS_ADDRESS, () => {
      const { address, port } = client.address() as AddressInfo;
      if (!address || (!options?.port && !port)) {
        reject(
          `[MIDDLEWARE] ERROR: ${address}:${port} is not a valid address.`
        );
      }
      const fullAddress = `${address}:${options?.port || port}`;
      
      const controller: Controller = new Controller(
        fullAddress,
        client,
        options?.keepAlive || false,
        options?.keepAliveInterval || 10
      );
      // console.info("[MIDDLEWARE] INFO: connected on address: " + fullAddress);
      resolve(controller);
    });

    return promise;
  }

  request(serviceName: string, data: Object): Promise<Object | string> {
    const dnsGetData = {
      operation: "get",
      serviceName: serviceName,
    };
    return this.send(dnsGetData, data);
  }

  register(serviceName: string): Promise<Object | string> {
    const dnsRegisterData = {
      operation: "post",
      data: {
        address: this.address,
        name: serviceName,
      },
    };
    return this.send(dnsRegisterData);
  }

  remove(): Promise<Object | string> {
    const dnsRemoveData = {
      operation: "delete",
      serviceAddress: this.address,
    };
    return this.send(dnsRemoveData);
  }

  private static initClientBasicEvents(client: net.Socket) {
    client.on("error", (error: any) => {
      // TODO: testar para confirmar lógica
      if (error.code === "ECONNREFUSED") {
        console.error(
          "[MIDDLEWARE - Client handler] ERROR: DNS Server unavailable"
        );
        client.destroy();
      } else {
        console.error("[MIDDLEWARE - Client handler] ERROR: " + error.message);
        client.destroy();
      }
    });

    client.on("close", () => {
      console.info(
        "[MIDDLEWARE - Client handler] INFO: client connection closed."
      );
    });
  }

  private setOnDataEvent() {
    const stream = this.client.pipe(split());

    stream.on("data", (res: string) => {
      const { id, serviceAddress, message } = JSON.parse(res);
      const promise = this.promises[id];

      if (!promise) {
        return;
      }

      const { resolve, reject, requestData } = this.promises[id];

      if (serviceAddress && !requestData) {
        reject("No requestData provided to service request.");
        return;
      }

      if (serviceAddress) {
        const [ADDRESS, PORT] = serviceAddress.split(":");
        // console.log(
        //   "[MIDDLEWARE] got address from name server: ",
        //   ADDRESS,
        //   PORT
        // );

        ServiceConnection.create(ADDRESS, PORT)
          .then(async (connection) => {
            const serviceResponse = await connection.makeRequest(requestData);
            connection.finish();
            resolve(serviceResponse);
            delete this.promises[id];
          })
          .catch(() => {
            reject("Service connection failed.");
          });
      } else {
        resolve(serviceAddress || message);
        delete this.promises[id];
      }
    });
  }

  send(messageData: Object, requestData?: Object): Promise<Object | string> {
    const [resolve, reject, promise] = createPromise();

    if (!this.alive) {
      reject("Connection not alive.");
      return promise;
    }

    try {
      // TODO: set timeout to get response [reject(error)]
      const id = uuidv4();
      const message = this.createMessage(messageData, id);
      this.client.write(message);
      this.promises[id] = {
        resolve,
        reject,
        requestData,
      };
    } catch (error: any) {
      this.client.destroy();
      reject(error.message);
    } finally {
      return promise;
    }
  }

  private createMessage(messageData: Object, id: string): string {
    const message = JSON.stringify({
      ...messageData,
      id,
    });
    return message + SPLITTER;
  }

  private initKeepAlive(timeInterval: number): void {
    const intervalMilisec = timeInterval * 1000;
    const interval = setInterval(() => {
      this.send({ operation: "keepAlive" }).catch((error) => {
        console.log("[MIDDLEWARE - KEEPALIVE] ERROR: " + error);
        this.alive = false;
        this.client.destroy();
        clearInterval(interval);
      });
    }, intervalMilisec);
  }
}
