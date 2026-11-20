import { useState, useEffect } from 'react';
import { Target, Clock, Award, Zap, Brain, RotateCcw } from 'lucide-react';
import { askQuestion } from '../api/ragApi';

export default function CoachDashboard({ 
    coach, 
    documents, 
    activeSection, 
    onSectionChange,
    onSelectMode,
    onUploadMore,
    onViewDashboard
}) {
    const [selectedTopic, setSelectedTopic] = useState(coach?.subject || 'General');
    const [selectedMode, setSelectedMode] = useState('quick');
    const [currentFlashcard, setCurrentFlashcard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [summary, setSummary] = useState('');
    const [detailedNotes, setDetailedNotes] = useState('');
    const [flashcards, setFlashcards] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const topics = [coach?.subject || 'General', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'English', 'Computer Science'];

    useEffect(() => {
        if (documents.length > 0 && selectedMode === 'quick') {
            loadQuickSummary();
        } else if (documents.length > 0 && selectedMode === 'deep') {
            loadDetailedNotes();
        }
    }, [selectedMode, documents.length]);

    const loadQuickSummary = async () => {
        setIsLoading(true);
        try {
            const response = await askQuestion(
                "Provide a concise 5-point summary of the key concepts from the uploaded documents. Keep it focused on high-yield topics."
            );
            setSummary(response.answer);
            
            // Generate flashcards
            const flashcardResponse = await askQuestion(
                "Generate 3 important Q&A pairs from the study materials. Format as: Q1: [question] A1: [answer]"
            );
            const cards = parseFlashcards(flashcardResponse.answer);
            setFlashcards(cards);
        } catch (error) {
            console.error('Failed to load summary:', error);
            setSummary('Unable to load summary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadDetailedNotes = async () => {
        setIsLoading(true);
        try {
            const response = await askQuestion(
                "Provide detailed notes on the uploaded materials. Include key concepts, formulas, definitions, and important points. Structure it with clear sections."
            );
            setDetailedNotes(response.answer);
        } catch (error) {
            console.error('Failed to load notes:', error);
            setDetailedNotes('Unable to load detailed notes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const parseFlashcards = (text) => {
        const cards = [];
        const lines = text.split('\n');
        let currentQ = null;

        for (const line of lines) {
            const qMatch = line.match(/Q\d*[\.\):]\s*(.+)/i) || line.match(/^\d+[\.\)]\s*(?:Question:?\s*)?(.+)/i);
            const aMatch = line.match(/A\d*[\.\):]\s*(.+)/i) || line.match(/^(?:Answer:?\s*)(.+)/i);

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

        return cards.length > 0 ? cards : [
            { question: 'What are the key concepts?', answer: 'Review the uploaded materials to understand the main concepts.' },
            { question: 'What should I focus on?', answer: 'Focus on understanding the fundamental principles and their applications.' }
        ];
    };

    const nextFlashcard = () => {
        setIsFlipped(false);
        setCurrentFlashcard((prev) => (prev + 1) % (flashcards.length || 1));
    };

    const flipCard = () => {
        setIsFlipped(!isFlipped);
    };

    // Show dashboard content for both 'dashboard' and 'topics' sections
    // Topics section can show the same content or be customized later

    return (
        <div className="space-y-6">
            {/* Welcome Section - Matching Reference */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
                <p className="text-blue-100 mb-4">Ready to continue your learning journey? You're doing great!</p>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span className="text-sm">Daily Goal: {documents.length > 0 ? '1' : '0'}/{documents.length || 1} topics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Learning with {coach?.subject || 'AI Coach'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4" />
                        <span className="text-sm">{documents.length} document{documents.length !== 1 ? 's' : ''} loaded</span>
                    </div>
                </div>
            </div>

            {/* Topic and Mode Selection - Matching Reference */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Select Topic</h3>
                    <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {topics.map(topic => (
                            <option key={topic} value={topic}>{topic}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Learning Mode</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedMode('quick')}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedMode === 'quick' 
                                    ? 'bg-green-50 border-2 border-green-500 text-green-700' 
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <Zap className="w-5 h-5" />
                                <div>
                                    <p className="font-medium">Quick Revision</p>
                                    <p className="text-sm text-gray-600">Summaries & flashcards</p>
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={() => setSelectedMode('deep')}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedMode === 'deep' 
                                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700' 
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <Brain className="w-5 h-5" />
                                <div>
                                    <p className="font-medium">Deep Dive</p>
                                    <p className="text-sm text-gray-600">Detailed notes & quizzes</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Display - Matching Reference */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                        {selectedTopic} - {selectedMode === 'quick' ? 'Quick Revision' : 'Deep Dive'}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedMode === 'quick' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {selectedMode === 'quick' ? 'Quick Mode' : 'Deep Mode'}
                    </div>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">No documents uploaded yet.</p>
                        <button
                            onClick={onUploadMore}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                        >
                            Upload Documents to Get Started
                        </button>
                    </div>
                ) : selectedMode === 'quick' ? (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Quick Summary</h4>
                            {isLoading ? (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                    <p className="text-gray-700">Loading summary...</p>
                                </div>
                            ) : (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {summary || 'Click on Quick Revision mode to generate a summary from your documents.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Flashcard */}
                        {flashcards.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Flashcard Review</h4>
                                <div className="flex flex-col items-center">
                                    <div 
                                        className="w-full max-w-md h-48 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg shadow-lg cursor-pointer transform transition-all duration-500 flex items-center justify-center p-6"
                                        onClick={flipCard}
                                        style={{
                                            transformStyle: 'preserve-3d',
                                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                        }}
                                    >
                                        <div className={`text-center ${isFlipped ? 'hidden' : 'block'}`}>
                                            <p className="text-gray-800 font-medium text-lg">
                                                {flashcards[currentFlashcard]?.question}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-4">Click to reveal answer</p>
                                        </div>
                                        <div className={`text-center ${isFlipped ? 'block' : 'hidden'}`} style={{ transform: 'rotateY(180deg)' }}>
                                            <p className="text-gray-800 font-bold text-xl">
                                                {flashcards[currentFlashcard]?.answer}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 mt-4">
                                        <button
                                            onClick={nextFlashcard}
                                            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Next Card</span>
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            {currentFlashcard + 1} / {flashcards.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Detailed Notes */}
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Detailed Notes</h4>
                            {isLoading ? (
                                <div className="prose max-w-none">
                                    <p className="text-gray-700">Loading detailed notes...</p>
                                </div>
                            ) : (
                                <div className="prose max-w-none">
                                    <div className="text-gray-700 whitespace-pre-wrap">
                                        {detailedNotes || 'Click on Deep Dive mode to generate detailed notes from your documents.'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
                <button
                    onClick={() => onSelectMode('quiz')}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-blue-300 text-gray-700 font-medium"
                >
                    Take Quiz
                </button>
                <button
                    onClick={() => onSelectMode('chat')}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-purple-300 text-gray-700 font-medium"
                >
                    Ask AI Tutor
                </button>
                <button
                    onClick={onViewDashboard}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-green-300 text-gray-700 font-medium"
                >
                    View Progress
                </button>
            </div>
        </div>
    );
}

