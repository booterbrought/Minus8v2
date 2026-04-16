import type { WSContext } from "hono/ws";

const wsConnections = new Map<string, WSContext>();

function createWsHandler(playerId: string) {
  return {
    onOpen(_event: Event, ws: WSContext) {
      if (wsConnections.has(playerId)) {
        wsConnections.get(playerId)?.close();
        wsConnections.delete(playerId);
        console.log("WebSocket connection closed");
      }
      wsConnections.set(playerId, ws);
      console.log("WebSocket connection established");
    },
    onMessage(event: MessageEvent, _ws: WSContext) {
      console.log("WebSocket message received", event.data);
    },
    onClose(_event: CloseEvent, _ws: WSContext) {
      wsConnections.delete(playerId);
      console.log("WebSocket connection closed");
    },
  };
}

export { wsConnections, createWsHandler };
