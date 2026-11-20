import { Sparkles, BookOpen, FileText, MessageSquare } from 'lucide-react';

export default function WelcomeScreen({ onCreateCoach }) {
    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                        Welcome to <span className="text-gradient">EduMorph</span>
                    </h1>

                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Create topic workspaces, upload materials, and use flashcards, quizzes, and the AI Tutor for each subject.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-blue-300 group">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Upload Materials</h3>
                        <p className="text-sm text-gray-600">
                            Add PDFs, text files, and markdown documents for any subject
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-purple-300 group">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                            <MessageSquare className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Ask Questions</h3>
                        <p className="text-sm text-gray-600">
                            Get instant, source-backed answers from your study materials
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-green-300 group">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                            <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Generate Quizzes</h3>
                        <p className="text-sm text-gray-600">
                            Create interactive flashcards and quizzes to test your knowledge
                        </p>
                    </div>
                </div>

                <div className="flex justify-center pt-4">
                    <button 
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
                        onClick={onCreateCoach}
                    >
                        <Sparkles className="w-5 h-5" />
                        <span>Create your first topic workspace</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
