import db from './sqllite.ts';

type SessionData = {
	id: string;
	tutorType: string;
	title?: string;
};

export function createSession(
	data: SessionData,
) {
	const stmt = db.prepare(`
    INSERT INTO sessions (
      id,
      tutor_type,
      title
    )
    VALUES (?, ?, ?)
  `);

	stmt.run(
		data.id,
		data.tutorType,
		data.title || 'New Session',
	);

	return {
		id: data.id,
		tutorType: data.tutorType,
		title: data.title,
	};
}

export function getAllSessions() {
	const stmt = db.prepare(`
    SELECT *
    FROM sessions
    ORDER BY updated_at DESC
  `);

	return stmt.all();
}

export function touchSession(
	sessionId: string,
) {
	const stmt = db.prepare(`
    UPDATE sessions
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

	stmt.run(sessionId);
}