import { Target, BookOpen, Zap, FileText, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react';

/**
 * Overview for a single topic workspace.
 * Shows summary and quick actions to Dashboard, Topics, Flashcards, Quizzes, AI Tutor, Progress.
 * Distinct from Topics (documents) and Progress (analytics).
 */
export default function WorkspaceOverview({
    workspace,
    documentCount,
    onOpenTopics,
    onOpenFlashcards,
    onOpenQuizzes,
    onOpenChat,
    onOpenProgress,
}) {
    const actions = [
        { id: 'topics', label: 'Topics & documents', desc: 'Upload and manage materials', icon: BookOpen, onClick: onOpenTopics },
        { id: 'flashcards', label: 'Flashcards', desc: 'Review key concepts', icon: Zap, onClick: onOpenFlashcards },
        { id: 'quizzes', label: 'Quizzes', desc: 'Test your knowledge', icon: FileText, onClick: onOpenQuizzes },
        { id: 'chat', label: 'AI Tutor', desc: 'Ask questions', icon: MessageSquare, onClick: onOpenChat },
        { id: 'progress', label: 'Progress', desc: 'Scores and analytics', icon: TrendingUp, onClick: onOpenProgress },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                <h2 className="text-2xl font-bold mb-2">Workspace: {workspace?.subject}</h2>
                <p className="text-blue-100 mb-4">
                    Overview of this topic. Use the options below to study.
                </p>
                <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">{documentCount} document{documentCount !== 1 ? 's' : ''} in this workspace</span>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {actions.map(({ id, label, desc, icon: Icon, onClick }) => (
                    <button
                        key={id}
                        onClick={onClick}
                        className="flex items-center justify-between p-5 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{label}</p>
                                <p className="text-sm text-gray-500">{desc}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                ))}
            </div>

            {documentCount === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
                    <p className="font-medium">No documents yet</p>
                    <p className="text-sm mt-1">Go to <button type="button" onClick={onOpenTopics} className="underline font-semibold">Topics & documents</button> to upload study materials for this workspace.</p>
                </div>
            )}
        </div>
    );
}
