import { ClientI } from "./interfaces/client";
import { createPromise } from "./helpers/promise";
import ServiceConnection from "./connections/service-connection";
import NameServerConnection from "./connections/name-server-connection";
import { sleep } from "./helpers/sleep";

const REQUEST_MAX_ATTEMPTS = 3;

export default class Client implements ClientI {
  private readonly nameServerConnection: NameServerConnection;

  private constructor(nameServerConnection: NameServerConnection) {
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
    const request = {
      serviceName,
      data,
      attempts: 0,
    };

    this.tryRequest(request, REQUEST_MAX_ATTEMPTS)
      .then((serviceResponse) => resolve(serviceResponse))
      .catch((error) => reject(error));

    return promise;
  }

  async tryRequest(
    request: { serviceName: string; data: Object; attempts: number },
    maxAttempts: number
  ) {
    const [resolve, reject, promise] = createPromise();
    request.attempts++;

    // await sleep(7000);

    this.nameServerConnection
      .request(request.serviceName)
      .then((serviceAddress) => {
        if (!request.data) {
          reject("No requestData provided to service request.");
          return;
        }
        const [ADDRESS, PORT] = serviceAddress.split(":");
        ServiceConnection.create(ADDRESS, Number(PORT))
          .then(async (connection) => {
            const serviceResponse = await connection.makeRequest(request.data);
            connection.finish();
            resolve(serviceResponse);
          })
          .catch((error) => {
            reject(error);
          });
        return;
      })
      .catch(() => {
        if (maxAttempts <= request.attempts) {
          reject(`Service address not found by the name server.`);
        } else {
          resolve(this.tryRequest(request, maxAttempts));
        }
      });

    return promise;
  }
}
