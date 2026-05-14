import db from "./sqllite.ts";

type ChatMessage = {
  sessionId: string;
  role: string;
  content: string;
  tutorType: string;
};

export function saveMessage(data: ChatMessage) {
  const stmt = db.prepare(`
    INSERT INTO chats (
      session_id,
      role,
      content
    )
    VALUES (?, ?, ?)
  `);

  stmt.run(data.sessionId, data.role, data.content);
}

export function getSessionMessages(sessionId: string) {
  const stmt = db.prepare(`
    SELECT role, content
    FROM chats
    WHERE session_id = ?
    ORDER BY id ASC
  `);

  return stmt.all(sessionId);
}
