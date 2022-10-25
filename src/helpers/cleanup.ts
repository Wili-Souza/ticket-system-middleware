import { Server } from "net";

const EXIT_EVENTS = [
  "SIGHUP",
  "SIGINT",
  "SIGQUIT",
  "SIGILL",
  "SIGTRAP",
  "SIGABRT",
  "SIGBUS",
  "SIGFPE",
  "SIGUSR1",
  "SIGSEGV",
  "SIGUSR2",
  "SIGTERM",
];

export function cleanupServer(server: Server) {
  process.on("exit", () => {});
  
  EXIT_EVENTS.forEach((event) => {
    process.once(event, () => {
      terminator(event, server);
    });
  });
}

function terminator(event: string, server: Server) {
  if (typeof event === "string") {
    server.close((error) => {
      process.openStdin().removeAllListeners();
      process.exit();
    });
  }
}