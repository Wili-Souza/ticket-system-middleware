import net, { AddressInfo } from "net";
import split from "split";
import { v4 as uuidv4 } from "uuid";
import { DNS_ADDRESS, DNS_PORT, SPLITTER } from "../config";
import { createPromise } from "../helpers/promise";
import { ClientPromise } from "../interfaces/client-promise";

export default class NameServerConnection {
  private readonly promises: { [key: string]: ClientPromise } = {};
  private readonly address: string;
  private readonly socket: net.Socket;

  private constructor(address: string, client: net.Socket) {
    this.address = address;
    this.socket = client;
    this.setOnDataEvent();
  }

  static async create(customPort?: number): Promise<NameServerConnection> {
    const [resolve, reject, promise] = createPromise();

    const socket: net.Socket = new net.Socket();

    NameServerConnection.initClientBasicEvents(socket);

    socket.connect(DNS_PORT, DNS_ADDRESS, () => {
      const { address, port } = socket.address() as AddressInfo;
      if (!address || (!customPort && !port)) {
        reject(
          `[DNS Connection] ERROR: ${address}:${port} is not a valid address.`
        );
      }
      const fullAddress = `${address}:${customPort || port}`;
      const connection: NameServerConnection = new NameServerConnection(
        fullAddress,
        socket
      );

      resolve(connection);
    });

    return promise;
  }

  request(serviceName: string): Promise<string> {
    const dnsGetData = {
      operation: "get",
      serviceName: serviceName,
    };
    return this.send(dnsGetData);
  }

  remove(): Promise<string> {
    const dnsRemoveData = {
      operation: "delete",
      serviceAddress: this.address,
    };
    return this.send(dnsRemoveData);
  }

  register(serviceName: string): Promise<string> {
    const dnsRegisterData = {
      operation: "post",
      data: {
        address: this.address,
        name: serviceName,
      },
    };
    return this.send(dnsRegisterData);
  }

  private static initClientBasicEvents(socket: net.Socket) {
    socket.on("error", (error: any) => {
      // TODO: testar para confirmar lógica
      if (error.code === "ECONNREFUSED") {
        console.error("[DNS Connection] ERROR: DNS Server unavailable");
        socket.destroy();
      } else {
        console.error("[DNS Connection] ERROR: " + error.message);
        socket.destroy();
      }
    });

    socket.on("close", () => {
      console.info("[DNS Connection] INFO: client connection closed.");
    });
  }

  private setOnDataEvent() {
    const stream = this.socket.pipe(split());

    stream.on("data", (res: string) => {
      const { id, serviceAddress, message, status } = JSON.parse(res);
      const promise = this.promises[id];

      if (!promise) {
        return;
      }

      const { resolve, reject } = this.promises[id];

      if ( status === "error" ) {
        reject(message);
        return;
      }

      if (!serviceAddress && !message) {
        reject("Communication failed.")
        return
      }

      resolve(serviceAddress || message);
      delete this.promises[id];
    });
  }

  send(messageData: Object): Promise<string> {
    const [resolve, reject, promise] = createPromise();
    try {
      // TODO: set timeout to get response [reject(error)]
      const id = uuidv4();
      const message = this.createMessage(messageData, id);
      this.socket.write(message);
      this.promises[id] = {
        resolve,
        reject
      };
    } catch (error: any) {
      this.socket.destroy();
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
}
