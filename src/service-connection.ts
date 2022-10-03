import { Socket } from "net";
import { SPLITTER } from "./config";
import { createPromise } from "./helpers/promise";

export default class ServiceConnection {
  private readonly client: Socket;

  private constructor(client: Socket) {
    this.client = client;
  }

  // Returns a promise for service connection
  static async create(
    ADDRESS: string,
    PORT: number
  ): Promise<ServiceConnection> {
    const [resolve, reject, promise] = createPromise();

    const client: Socket = new Socket();

    try {
      client.connect(PORT, ADDRESS, () => {
        const connection: ServiceConnection = new ServiceConnection(client);
        resolve(connection);
      });
    } catch (error) {
      reject(error);
    } finally {
      return promise;
    }
  }

    //   TODO: make on data for receiving response (use split)

  makeRequest(requestData?: Object): Promise<string> {
    if (requestData) {
        const requestMessage = JSON.stringify(requestData + SPLITTER)
        this.client.write(requestMessage);
    }
  }
}
