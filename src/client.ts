import { ClientI } from "./interfaces/client";
import { createPromise } from "./helpers/promise";
import ServiceConnection from "./connections/service-connection";
import NameServerConnection from "./connections/name-server-connection";

export default class Client implements ClientI {
  private readonly nameServerConnection: NameServerConnection;

  private constructor(
    nameServerConnection: NameServerConnection
  ) {
    this.nameServerConnection = nameServerConnection;
  }

  static async create(customPort?: number): Promise<Client> {
    const [resolve, reject, promise] = createPromise();

    NameServerConnection.create(customPort)
      .then((nameServerConnection) => {
        const client = new Client(nameServerConnection);
        resolve(client);
      })
      .catch((error) => {
        reject(error);
      });

    return promise;
  }

  request(serviceName: string, data: Object): Promise<Object> {
    const [resolve, reject, promise] = createPromise();

    this.nameServerConnection
      .request(serviceName)
      .then((serviceAddress) => {
        if (serviceAddress && !data) {
          reject("No requestData provided to service request.");
          return;
        }

        if (serviceAddress) {
          const [ADDRESS, PORT] = serviceAddress.split(":");
          ServiceConnection.create(ADDRESS, Number(PORT))
            .then(async (connection) => {
              const serviceResponse = await connection.makeRequest(data);
              connection.finish();
              resolve(serviceResponse);
            })
            .catch(() => {
              reject("Service connection failed.");
            });
          return;
        }
      })
      .catch(() =>
        reject(`Service address not found by the name server.`)
      );

    return promise;
  }
}
