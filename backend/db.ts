import { MongoClient, ObjectId } from "https://deno.land/x/mongo@v0.33.0/mod.ts";

const client = new MongoClient();

// Connect to MongoDB (update the connection string as needed)
await client.connect("mongodb://localhost:27017");
const db = client.database("minus8_db");
export default db;