import React, {useEffect, useState} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import axios from 'axios';

type Role = 'user' | 'assistant';

type Message = {
	role: Role;
	content: string;
};

type Session = {
	id: string;
	title: string;
	tutor_type: string;
};

type HomeStep = 'main' | 'create' | 'resume';

type Screen = 'home' | 'chat';

const modeMap: Record<string, string> = {
	'1': 'human_language',
	'2': 'finance',
	'3': 'law',
	'4': 'coding',
};

export default function App() {
	const [screen, setScreen] = useState<Screen>('home');
	const [sessions, setSessions] = useState<Session[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedMode, setSelectedMode] = useState('human_language');
	const [selectedSessionId, setSelectedSessionId] = useState('');
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [homeStep, setHomeStep] = useState<HomeStep>('main');

	// LOAD SESSIONS
	const getAllSessions = async () => {
		try {
			const res = await axios.get('http://localhost:3034/sessions');
			setSessions(res.data);
		} catch (error) {
			console.error(error);
		}
	};

	// LOAD CHAT MESSAGES
	const loadSessionMessages = async (sessionId: string) => {
		try {
			const res = await axios.get(
				`http://localhost:3034/sessions/${sessionId}/messages`,
			);
			setMessages(res.data);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		getAllSessions();
	}, []);

	// CREATE NEW SESSION
	const createNewSession = async (mode: string) => {
		try {
			const res = await axios.post('http://localhost:3034/sessions', {
				type: mode,
				title: `${mode} session`,
			});
			const session = res.data;
			setSelectedSessionId(session.id);
			setSelectedMode(mode);
			setMessages([
				{
					role: 'assistant',
					content: `Started ${mode} tutor session.`,
				},
			]);
			setScreen('chat');
			getAllSessions();
		} catch (error) {
			console.error(error);
		}
	};

	// RESUME SESSION
	const resumeSession = async (session: Session) => {
		setSelectedSessionId(session.id);
		setSelectedMode(session.tutor_type);
		await loadSessionMessages(session.id);
		setScreen('chat');
	};

	// SEND MESSAGE
	const sendMessage = async (value?: string) => {
		const currentInput = value || input;

		if (!currentInput.trim() || loading) {
			return;
		}

		setInput('');
		setLoading(true);

		// ADD USER MESSAGE
		setMessages(prev => [
			...prev,
			{role: 'user', content: currentInput},
			{role: 'assistant', content: ''},
		]);

		try {
			const response = await fetch('http://localhost:3034/chat', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					sessionId: selectedSessionId,
					type: selectedMode,
					message: currentInput,
				}),
			});

			if (!response.body) {
				throw new Error('No response body');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let assistantContent = '';

			while (true) {
				const {done, value} = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;

					const json = line.replace('data: ', '');
					if (!json.trim()) continue;

					try {
						const parsed = JSON.parse(json);
						if (parsed.done) break;

						assistantContent += parsed.content || '';

						setMessages(prev => {
							const cloned = [...prev];
							cloned[cloned.length - 1] = {
								role: 'assistant',
								content: assistantContent,
							};
							return cloned;
						});
					} catch (err) {
						console.error(err);
					}
				}
			}
		} catch (error) {
			console.error(error);
		}

		setLoading(false);
	};

	// HOME SCREEN
	if (screen === 'home') {
		return (
			<Box
				flexDirection="column"
				borderStyle="double"
				borderColor="cyan"
				padding={1}
			>
				<Text bold color="cyanBright">
					AI Learning Terminal
				</Text>

				<Box marginTop={1} flexDirection="column">
					<Text>1. Create New Session</Text>
					<Text>2. Resume Session</Text>
				</Box>

				{homeStep === 'main' && (
					<Box marginTop={1}>
						<Text>{'> '}</Text>
						<TextInput
							value={input}
							onChange={setInput}
							onSubmit={value => {
								if (value === '1') {
									setHomeStep('create');
									setInput('');
								}
								if (value === '2') {
									setHomeStep('resume');
									setInput('');
								}
							}}
						/>
					</Box>
				)}

				{homeStep === 'create' && (
					<Box marginTop={2} flexDirection="column">
						<Text bold>Create New Session</Text>
						<Text color="green">1. Human Language</Text>
						<Text color="yellow">2. Finance</Text>
						<Text color="magenta">3. Law</Text>
						<Text color="blue">4. Coding</Text>
						<Box marginTop={1}>
							<Text>Mode: </Text>
							<TextInput
								value={input}
								onChange={setInput}
								onSubmit={value => {
									const selected = modeMap[value];
									if (!selected) return;
									setInput('');
									createNewSession(selected);
								}}
							/>
						</Box>
					</Box>
				)}

				{homeStep === 'resume' && (
					<Box marginTop={2} flexDirection="column">
						<Text bold>Previous Sessions</Text>
						{sessions.map((session, index) => (
							<Box key={session.id}>
								<Text color="cyan">[{index + 1}]</Text>
								<Text> {session.title}</Text>
							</Box>
						))}
						<Box marginTop={1}>
							<Text>Session: </Text>
							<TextInput
								value={input}
								onChange={setInput}
								onSubmit={value => {
									const index = Number(value) - 1;
									const session = sessions[index];
									if (!session) return;
									setInput('');
									resumeSession(session);
								}}
							/>
						</Box>
					</Box>
				)}
			</Box>
		);
	}

	// CHAT SCREEN
	return (
		<Box flexDirection="column">
			<Box borderStyle="double" borderColor="blue" paddingX={1}>
				<Text bold color="cyanBright">
					AI Learning Terminal
				</Text>
				<Text color="gray"> Mode: {selectedMode}</Text>
			</Box>

			<Box
				flexDirection="column"
				marginTop={1}
				borderStyle="round"
				borderColor="gray"
				paddingX={1}
			>
				{messages.map((msg, index) => {
					const isUser = msg.role === 'user';
					return (
						<Box key={index} flexDirection="column" marginBottom={1}>
							<Text bold color={isUser ? 'greenBright' : 'cyanBright'}>
								{isUser ? 'You' : 'Tutor'}
							</Text>
							<Box
								borderStyle="round"
								borderColor={isUser ? 'green' : 'cyan'}
								paddingX={1}
							>
								<Text wrap="wrap">{msg.content}</Text>
							</Box>
						</Box>
					);
				})}
			</Box>

			<Box marginTop={1}>
				<Text color="cyan">{'>'} </Text>
				<TextInput value={input} onChange={setInput} onSubmit={sendMessage} />
			</Box>

			{loading && (
				<Box marginTop={1}>
					<Text color="yellow">Thinking...</Text>
				</Box>
			)}
		</Box>
	);
}
