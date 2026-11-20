import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, Loader, ArrowLeft, Zap, Search, Bookmark, Brain, User } from 'lucide-react';
import { askQuestion } from '../api/ragApi';
import MessageBubble from './MessageBubble';
import FlashCard from './FlashCard';

export default function ChatInterface({ coachName, onBack, mode = 'chat' }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [flashcards, setFlashcards] = useState([]);
    const messagesEndRef = useRef(null);
    const hasInitialized = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial setup based on mode
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        let initialMessage = '';
        let autoPrompt = '';

        switch (mode) {
            case 'revision':
                initialMessage = `⚡ **Quick Revision Mode**\nI'm generating a concise summary of key concepts for you...`;
                autoPrompt = "Provide a 5-point summary of the key concepts from the uploaded documents. Keep it concise and focused on high-yield topics.";
                break;
            case 'notes':
                initialMessage = `📋 **Last-Minute Notes Mode**\nI'm creating a structured cheat sheet for your exam prep...`;
                autoPrompt = "Create a structured 'cheat sheet' or revision note for the uploaded materials. Focus on key formulas, dates, definitions, and critical points. Use markdown tables where appropriate.";
                break;
            case 'deep':
                initialMessage = `🔍 **Deep Dive Mode**\nI'm analyzing the most complex topics for a detailed explanation...`;
                autoPrompt = "Identify the 3 most complex or important topics in these documents and provide a deep-dive explanation for each. Explain like I'm a student who needs to understand the underlying principles.";
                break;
            default:
                initialMessage = `👋 Hi! I'm your **${coachName}** AI coach. I've learned from your uploaded materials and I'm ready to help!\n\nYou can:\n- Ask me questions about the subject\n- Request a quiz\n- Ask for explanations\n\nWhat would you like to learn today?`;
        }

        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: initialMessage
        }]);

        if (autoPrompt) {
            handleAutoPrompt(autoPrompt);
        }
    }, [coachName, mode]);

    const handleAutoPrompt = async (prompt) => {
        setIsLoading(true);
        try {
            const response = await askQuestion(prompt);
            const assistantMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.answer,
                sources: response.sources
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `❌ Sorry, I encountered an error: ${error.message}. Please try again.`,
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: userMessage
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await askQuestion(userMessage);

            const isQuizRequest = userMessage.toLowerCase().includes('question') ||
                userMessage.toLowerCase().includes('quiz') ||
                userMessage.toLowerCase().includes('test') ||
                userMessage.toLowerCase().includes('flashcard');

            if (isQuizRequest && response.answer) {
                const cards = parseFlashcards(response.answer);
                if (cards.length > 0) {
                    setFlashcards(cards);
                }
            }

            const assistantMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.answer,
                sources: response.sources
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `❌ Sorry, I encountered an error: ${error.message}. Please try again.`,
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const parseFlashcards = (text) => {
        const cards = [];
        const lines = text.split('\n');
        let currentQ = null;

        for (const line of lines) {
            const qMatch = line.match(/^\d+[\.\)]\s*(?:Question:?\s*)?(.+)/i) ||
                line.match(/^Q\d*[\.\):]\s*(.+)/i);
            const aMatch = line.match(/^(?:Answer:?\s*|A[\.\):]\s*)(.+)/i);

            if (qMatch) {
                if (currentQ) {
                    cards.push({ question: currentQ, answer: '' });
                }
                currentQ = qMatch[1].trim();
            } else if (aMatch && currentQ) {
                cards.push({ question: currentQ, answer: aMatch[1].trim() });
                currentQ = null;
            }
        }

        if (currentQ) {
            cards.push({ question: currentQ, answer: '' });
        }

        return cards;
    };

    const handleQuickAction = (action) => {
        if (action === 'quiz') {
            setInput('Generate 5 quiz questions with answers from the study materials');
        } else if (action === 'summary') {
            setInput('Summarize the key concepts from the study materials');
        }
    };

    const getModeIcon = () => {
        switch (mode) {
            case 'revision': return <Zap size={18} className="text-yellow-500" />;
            case 'notes': return <Bookmark size={18} className="text-green-500" />;
            case 'deep': return <Search size={18} className="text-blue-500" />;
            default: return null;
        }
    };

    const getModeLabel = () => {
        switch (mode) {
            case 'revision': return 'Quick Revision';
            case 'notes': return 'Last-Minute Notes';
            case 'deep': return 'Deep Dive';
            default: return 'AI-powered learning assistant';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button 
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                        onClick={onBack}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="font-semibold text-lg">{coachName} Coach</h2>
                        <div className="flex items-center space-x-2 text-sm text-blue-100">
                            {getModeIcon()}
                            <span>{getModeLabel()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flashcard Mode */}
            {flashcards.length > 0 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <FlashCard
                            cards={flashcards}
                            onClose={() => setFlashcards([])}
                        />
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="flex items-center space-x-2 text-gray-500 p-4">
                        <Loader className="animate-spin" size={20} />
                        <span>Thinking...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (only show in normal chat) */}
            {mode === 'chat' && (
                <div className="px-4 py-2 bg-white border-t border-gray-200 flex gap-2">
                    <button
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                        onClick={() => handleQuickAction('quiz')}
                    >
                        <Sparkles size={16} />
                        <span>Generate Quiz</span>
                    </button>
                    <button
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                        onClick={() => handleQuickAction('summary')}
                    >
                        <FileText size={16} />
                        <span>Summarize</span>
                    </button>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder={mode === 'chat' ? "Ask anything about your study materials..." : "Ask follow-up questions..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={!input.trim() || isLoading}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
