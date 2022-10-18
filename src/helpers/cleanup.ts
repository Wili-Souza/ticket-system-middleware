import { Server } from "net";

const EXIT_EVENTS = [
  "SIGINT",
  "SIGUSR1",
  "SIGUSR2",
  "uncaughtException",
  "SIGTERM",
];

export function cleanupServer(server: Server) {
  EXIT_EVENTS.forEach((event) => {
    process.on("exit", () => {});

    EXIT_EVENTS.forEach(() => {
      process.on(event, () => {
        terminator(event, server);
      });
    });
  });
}

function terminator(event: string, server: Server) {
  if (typeof event === "string") {
    server.close(() => {
      process.exit();
    });
  }
}
