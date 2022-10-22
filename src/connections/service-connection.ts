import { Socket } from "net";
import split from "split";
import { SPLITTER } from "../config";
import { PromiseMethod } from "../types/promise-handler";
import { createPromise } from "../helpers/promise";

export default class ServiceConnection {
  private readonly client: Socket;
  private pendingRequest?: { resolve: PromiseMethod; reject: PromiseMethod };

  private constructor(client: Socket) {
    this.client = client;
  }

  static async create(
    ADDRESS: string,
    PORT: number
  ): Promise<ServiceConnection> {
    const [resolve, reject, promise] = createPromise();

    const client: Socket = new Socket();

    try {
      client.on("error", (error: any) => {
        console.error("[MIDDLEWARE -> SERVICE] ERROR: " + error.message);
        client.destroy();
      });

      client.on("close", () => {
        console.info("[MIDDLEWARE -> SERVICE] INFO: connection closed.");
      });

      client.connect(PORT, ADDRESS, () => {
        const connection: ServiceConnection = new ServiceConnection(client);
        resolve(connection);
      });
    } catch (error) {
      reject(error);
    }

    return promise;
  }

  makeRequest(requestData?: Object): Promise<any> | undefined {
    const stream = this.client.pipe(split());

    stream.on("data", (data) => {
      const responseData = JSON.parse(data);
      this.pendingRequest?.resolve(responseData);
    });

    if (requestData) {
      const [resolve, reject, promise] = createPromise();
      const requestMessage = JSON.stringify(requestData) + SPLITTER;
      this.client.write(requestMessage);
      this.pendingRequest = {
        resolve,
        reject,
      };
      return promise;
    }
  }

  finish(): void {
    this.client.destroy();
  }
}
