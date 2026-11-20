import { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

export default function CreateCoachModal({ onClose, onCreate }) {
    const [subject, setSubject] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedSubject = subject.trim();
        if (trimmedSubject.length < 2) {
            setError('Subject name must be at least 2 characters');
            return;
        }

        onCreate(trimmedSubject);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Create new topic workspace</h2>
                    <button 
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={onClose}
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                </div>

                <p className="text-gray-600 text-center mb-6">
                    Name your workspace (e.g. Physics, History). You can add documents, flashcards, and quizzes here.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                            Workspace name
                        </label>
                        <input
                            id="subject"
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="e.g., Physics, Data Structures, History..."
                            value={subject}
                            onChange={(e) => {
                                setSubject(e.target.value);
                                setError('');
                            }}
                            autoFocus
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                        >
                            Create workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
