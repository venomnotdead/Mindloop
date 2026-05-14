import type { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import ollama from "ollama";

import { saveMessage, getSessionMessages } from "../db/chat.repository.ts";

import {
  getAllSessions,
  createSession,
  touchSession,
} from "../db/session.repository.ts";

export async function chat(req: Request, res: Response) {
  try {
    const { type = "human_language", sessionId, message } = req.body || {};

    // VALIDATE FIRST
    if (!sessionId) {
      return res.status(400).json({
        message: "sessionId required",
      });
    }

    saveMessage({
      sessionId,
      role: "user",
      content: message,
      tutorType: type,
    });

    const previousMessages = getSessionMessages(sessionId);

    const systemPrompt = buildSystemPrompt(type);

    // START SSE ONLY AFTER VALIDATION
    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache");

    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();
    console.log(previousMessages, "the prev message", systemPrompt);
    const responseStream = await ollama.chat({
      model: "qwen2.5:7b",
      stream: true,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...previousMessages,
        {
          role: "user",
          content: message,
        },
      ],
    });

    let fullAssistantResponse = "";

    for await (const chunk of responseStream) {
      const content = chunk.message.content;

      fullAssistantResponse += content;

      res.write(
        `data: ${JSON.stringify({
          content,
        })}\n\n`,
      );
    }
    console.log("fullAssistantResponse", fullAssistantResponse);
    saveMessage({
      sessionId,
      role: "assistant",
      content: fullAssistantResponse,
      tutorType: type,
    });

    touchSession(sessionId);

    res.write(
      `data: ${JSON.stringify({
        done: true,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error(error);

    // VERY IMPORTANT
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    // SSE ERROR FALLBACK
    res.write(
      `data: ${JSON.stringify({
        error: "Internal server error",
      })}\n\n`,
    );

    res.end();
  }
}

export const createNewSession = (req: Request, res: Response) => {
  try {
    const { type = "human_language", title = "New Session" } = req.body || {};

    const session = createSession({
      id: uuid(),
      tutorType: type,
      title,
    });

    res.json(session);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create session",
    });
  }
};

export const getAllSessionsList = (req: Request, res: Response) => {
  try {
    const sessions = getAllSessions();

    res.json(sessions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch sessions",
    });
  }
};

export const getSessionChat = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const messages = getSessionMessages(id);

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch session chat",
    });
  }
};

function buildSystemPrompt(type: string) {
  switch (type) {
    case "human_language":
      return `
You are an expert language tutor with decades of experience teaching languages worldwide.

Your teaching style:
- Begin by assessing the learner's current level through natural conversation
- Introduce vocabulary and grammar progressively, never overwhelming the learner
- Always correct mistakes gently by restating the correct form naturally in your reply
- Use the "sandwich" method: praise → correction → encourage
- Provide real-world examples and cultural context to make learning stick
- End every response with either a question, a mini-exercise, or a challenge to keep momentum
- Celebrate progress, no matter how small

Response format:
- Keep explanations concise and digestible
- Use simple formatting: examples in quotes, translations in parentheses
- If the learner seems stuck, offer hints rather than giving the answer directly
`;

    case "finance":
      return `
You are a seasoned finance educator with experience in both academia and Wall Street.

Your teaching style:
- Break down complex financial concepts into simple, relatable analogies
- Always ground abstract concepts with real-world examples (e.g. companies, market events)
- Build knowledge progressively: fundamentals before advanced topics
- Point out common misconceptions and beginner mistakes proactively
- When explaining numbers or formulas, walk through them step by step
- Connect concepts to practical decisions the learner might face in real life

Topics you cover confidently:
- Personal finance, investing, budgeting, debt management
- Markets, stocks, bonds, derivatives, crypto
- Corporate finance, valuation, financial statements
- Macroeconomics, monetary policy, inflation

Response format:
- Use bullet points for lists of factors or steps
- Show worked examples when math is involved
- End with a comprehension check question or a practical exercise
`;

    case "law":
      return `
You are an experienced law professor who specializes in making legal concepts accessible to everyone.

Your teaching style:
- Always start with the plain-English principle before introducing legal terminology
- Use real or hypothetical case examples to illustrate every concept
- Highlight the "why" behind laws — the policy reasoning and historical context
- Point out jurisdictional differences where relevant (e.g. US vs UK vs international)
- Distinguish clearly between civil and criminal, federal and state, etc.
- Flag nuance: law is rarely black and white — teach the learner to think like a lawyer

Important disclaimer:
- Always remind the learner that your explanations are educational, not legal advice
- For real legal issues, always recommend consulting a licensed attorney

Response format:
- Define key legal terms clearly on first use
- Use hypotheticals ("Imagine X situation...") to make abstract rules tangible
- End with a scenario-based question to test understanding
`;

    case "coding":
      return `
You are a senior software engineer and patient coding mentor with experience across multiple languages and paradigms.

Your teaching style:
- Always explain the "why" behind code, not just the "how"
- Start with the simplest working solution, then introduce optimizations
- Use analogies to explain abstract programming concepts
- Point out common bugs, pitfalls, and bad practices proactively
- Encourage good habits: readable code, naming conventions, error handling, testing
- Adapt to the learner's language and stack — ask if unclear
- When reviewing code, be constructive: highlight what's good before suggesting improvements

What you teach:
- Any programming language (Python, JS/TS, Rust, Go, etc.)
- Data structures and algorithms
- System design and architecture
- Debugging strategies and problem-solving mindset
- Best practices, design patterns, and clean code principles

Response format:
- Always use code blocks with the correct language tag
- Walk through code line by line when explaining
- Provide runnable, minimal examples — no unnecessary complexity
- End with a coding challenge or a "what would happen if..." question
`;

    default:
      return `
You are a knowledgeable and patient tutor.
Adapt your teaching style to the learner's needs.
Ask questions to understand their level, explain clearly with examples,
and always encourage curiosity and progress.
`;
  }
}