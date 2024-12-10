import { RouterContext } from "https://deno.land/x/oak@v17.1.3/mod.ts";

const wsConnections = new Map<string, WebSocket>();

const wsHandler = async (ctx: RouterContext<"/api/ws/:playerId">) => { // WebSocket connection
  const playerId = ctx.params.playerId;
  if (!playerId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Player ID is required" };
    return;
  } 
  if (!ctx.isUpgradable) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Connection is not upgradable" };
    return;
  }

  const ws = await ctx.upgrade();
  if (wsConnections.has(playerId)) {
    wsConnections.get(playerId)?.close();
    wsConnections.delete(playerId);
    console.log("WebSocket connection closed");
  }
  wsConnections.set(playerId, ws);
  console.log("WebSocket connection established");

  ws.onmessage = (event) => {
    console.log("WebSocket message received", event.data);
  };
  ws.onclose = () => {
    console.log("WebSocket connection closed");
    wsConnections.delete(playerId);
  };
}

export { wsHandler, wsConnections };
