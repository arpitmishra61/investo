import { WebSocket, WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 5001 });

wss.on("connection", (ws: WebSocket) => {
  console.log("User is connected");
  UserManager.getInstance().addUser(ws);
});
