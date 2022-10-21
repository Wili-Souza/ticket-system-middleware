import net from "net";
import { CronJob } from "cron";


export class ServiceMonitor {
  cronjob: CronJob;

  constructor(serviceAddress: string, servicePort: number) {
    this.cronjob = new CronJob("0 2 0 * * *", async () => {
      await this.monitor(serviceAddress, servicePort);
    });

    if(!this.cronjob.running){
        this.cronjob.start()
    }
  }

  private async monitor(serviceAddress: string, servicePort: number): Promise<void> {
    console.log("Running...");

    // const service = ["ticktetService", servicePort];
    const serv = {
        host: serviceAddress, // checar como ele recebe (as vezes vem com :: na frente)
        port: servicePort
    }

    const check = new net.Socket();

    check.setTimeout(4000);

    check
      .on("connect", () => {
        console.log(serv.host + ": " + serv.port + " --- UP");
      })
      .on("error", (err) => {
        console.log(
            serv.host + ": " + serv.port + " --- dowm because" + err.message
        );
      })
      .on("timeout", () => {
        console.log(serv.host+ ": " + serv.port + " --- dowm due timeout");
      })
      .connect(serv.port, serv.host);
  }
}
