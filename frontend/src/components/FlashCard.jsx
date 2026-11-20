import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCw, CheckCircle } from 'lucide-react';

export default function FlashCard({ cards, onClose, title = 'Flashcards' }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [completed, setCompleted] = useState(new Set());

    const currentCard = cards[currentIndex];
    const progress = ((completed.size / cards.length) * 100).toFixed(0);

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleMarkComplete = () => {
        setCompleted(prev => new Set([...prev, currentIndex]));
        handleNext();
    };

    if (!currentCard) return null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                <button 
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={onClose}
                >
                    <X size={20} className="text-gray-600" />
                </button>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>{currentIndex + 1} / {cards.length}</span>
                <span>{progress}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div 
                className="w-full max-w-2xl mx-auto h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl shadow-lg cursor-pointer transform transition-all duration-500 flex items-center justify-center p-8"
                onClick={handleFlip}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
            >
                <div className={`text-center ${isFlipped ? 'hidden' : 'block'}`}>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Question</span>
                    <p className="text-gray-800 font-medium text-lg mt-4 mb-2">
                        {currentCard.question}
                    </p>
                    <p className="text-sm text-gray-600 mt-4">Click to reveal answer</p>
                </div>
                <div className={`text-center ${isFlipped ? 'block' : 'hidden'}`} style={{ transform: 'rotateY(180deg)' }}>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Answer</span>
                    <p className="text-gray-800 font-bold text-xl mt-4">
                        {currentCard.answer || 'Answer not provided - try answering yourself!'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between max-w-2xl mx-auto">
                <button
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft size={20} />
                    <span>Previous</span>
                </button>

                <button
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setIsFlipped(false)}
                >
                    <RotateCw size={18} className="text-gray-600" />
                </button>

                {completed.has(currentIndex) ? (
                    <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                        <CheckCircle size={18} />
                        <span>Completed</span>
                    </span>
                ) : (
                    <button
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                        onClick={handleMarkComplete}
                    >
                        <CheckCircle size={18} />
                        <span>Got it!</span>
                    </button>
                )}

                <button
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                >
                    <span>Next</span>
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
