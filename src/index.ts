import net, { AddressInfo } from "net";
import split from "split";
import { v4 as uuidv4 } from "uuid";
import { ConnectionI } from "./interfaces/connection";
import { DNS_ADDRESS, DNS_PORT, SPLITTER } from "./config";
import { createPromise } from "./helpers/promise";
import { ClientPromise } from "./interfaces/client-promise";

export default class Connection implements ConnectionI {
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
    this.initClientEvents();
  }

  // Returns a promise for connection
  static async create(
    keepAlive: boolean = true,
    keepAliveInterval: number = 10
  ): Promise<Connection> {
    const [resolve, reject, promise] = createPromise();

    const client: net.Socket = new net.Socket();

    client.connect(DNS_PORT, DNS_ADDRESS, () => {
      const { address, port } = client.address() as AddressInfo;
      if (!address || !port) {
        reject(`[MIDDLEWARE] ERROR: ${address}:${port} is not a valid address.`);
      }
      const fullAddress = `${address}:${port}`;
      const connection: Connection = new Connection(
        fullAddress,
        client,
        keepAlive,
        keepAliveInterval
      );
      console.info("[MIDDLEWARE] INFO: connected on address: " + fullAddress);
      resolve(connection);
    });

    return promise;
  }

  request(serviceName: string): Promise<Object | string> {
    const dnsGetData = {
      operation: "get",
      serviceName: serviceName,
    };
    return this.send(dnsGetData);
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

  private initClientEvents() {
    const stream = this.client.pipe(split());

    stream.on("data", (res: string) => {
      const response = JSON.parse(res);
      Object.keys(this.promises).forEach((requestId) => {
        if (requestId === response.id) {
          console.info(
            "[MIDDLEWARE - Client handler] INFO: of request: - " + requestId
          );

          // TODO: pegar address (data) e realizar requisição ao serviço
          // retornar a response do serviço ao client

          this.promises[requestId].resolve(response.data || response.message);
          delete this.promises[requestId];
        }
      });
    });

    this.client.on("error", (error: any) => {
      // TODO: testar para confirmar lógica
      if (error.code === "ECONNRESET") {
        console.error("[MIDDLEWARE - Client handler] ERROR: DNS Server unavailable");
        this.client.destroy();
      } else {
        console.error("[MIDDLEWARE - Client handler] ERROR: " + error.message);
        this.client.destroy();
      }
    });

    this.client.on("close", () => {
      console.info(
        "[MIDDLEWARE - Client handler] INFO: client connection closed."
      );
    });
  }

  send(messageData: Object): Promise<Object | string> {
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
      this.promises[id] = { resolve, reject };
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
