import { createServer } from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { WebSocketServer, WebSocket } from "ws";
import { getTableState, subscribeTable } from "./game/table";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
const webSocketServer = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
  if (pathname !== "/api/ws") {
    socket.destroy();
    return;
  }
  webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
    webSocketServer.emit("connection", webSocket);
  });
});

webSocketServer.on("connection", (webSocket: WebSocket) => {
  const sendState = () => {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({ type: "table:state", data: getTableState() }));
    }
  };
  const unsubscribe = subscribeTable(sendState);
  sendState();
  webSocket.on("close", unsubscribe);
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});
