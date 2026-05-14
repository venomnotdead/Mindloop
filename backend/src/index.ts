import express from "express";
import type { Request, Response } from "express";
import { chat, createNewSession, getAllSessionsList, getSessionChat } from "./ollama/conversation.ts";
import { initializeDatabase } from "./db/schema.ts";

const app = express();
app.use(express.json());
initializeDatabase();
const port = 3034;

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello from Express + TypeScript!");
});

app.post("/chat", chat);

app.post(
	'/sessions',
	createNewSession,
);

app.get(
	'/sessions',
	getAllSessionsList,
);

app.get(
	'/sessions/:id/messages',
	getSessionChat,
);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
