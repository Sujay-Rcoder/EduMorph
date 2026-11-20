import { useState, useEffect } from 'react';
import { ArrowLeft, Loader, BookOpen } from 'lucide-react';
import { askQuestion } from '../api/ragApi';
import FlashCard from './FlashCard';

function parseFlashcards(text) {
    const cards = [];
    const lines = text.split('\n');
    let currentQ = null;

    for (const line of lines) {
        const qMatch = line.match(/Q\d*[\.\):]\s*(.+)/i) || line.match(/^\d+[\.\)]\s*(?:Question:?\s*)?(.+)/i);
        const aMatch = line.match(/A\d*[\.\):]\s*(.+)/i) || line.match(/^(?:Answer:?\s*)(.+)/i);

        if (qMatch) {
            if (currentQ) cards.push({ question: currentQ, answer: '' });
            currentQ = qMatch[1].trim();
        } else if (aMatch && currentQ) {
            cards.push({ question: currentQ, answer: aMatch[1].trim() });
            currentQ = null;
        }
    }
    if (currentQ) cards.push({ question: currentQ, answer: '' });

    return cards.length > 0 ? cards : [
        { question: 'What are the key concepts?', answer: 'Review the uploaded materials to understand the main concepts.' },
        { question: 'What should I focus on?', answer: 'Focus on understanding the fundamental principles and their applications.' }
    ];
}

export default function WorkspaceFlashcards({ workspaceName, documentCount, onBack, onOpenTopics }) {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCards, setShowCards] = useState(false);

    const loadFlashcards = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await askQuestion(
                'Generate 5–8 important Q&A pairs from the study materials. Format each as: Q1: [question] A1: [answer]'
            );
            const parsed = parseFlashcards(response.answer);
            setCards(parsed);
            setShowCards(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to generate flashcards.');
        } finally {
            setLoading(false);
        }
    };

    if (showCards && cards.length > 0) {
        return (
            <FlashCard
                cards={cards}
                onClose={() => setShowCards(false)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                <div className="flex items-center space-x-4">
                    <button
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                        onClick={onBack}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold">Flashcards</h2>
                        <p className="text-blue-100">{workspaceName} – review key concepts</p>
                    </div>
                </div>
            </div>

            {documentCount === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-amber-600" />
                    <p className="font-medium">No documents in this workspace</p>
                    <p className="text-sm mt-2">Upload materials in Topics first, then we can generate flashcards.</p>
                    <button
                        type="button"
                        onClick={onOpenTopics}
                        className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
                    >
                        Go to Topics & documents
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-gray-600 mb-4">
                        Generate flashcards from your uploaded documents for this workspace.
                    </p>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    <button
                        onClick={loadFlashcards}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            'Generate flashcards'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
