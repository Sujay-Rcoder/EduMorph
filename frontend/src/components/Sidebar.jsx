import { Plus, MessageSquare, Trash2, BarChart3, Home, Zap, FileText, BookOpen } from 'lucide-react';

export default function Sidebar({
    coaches,
    activeCoach,
    onSelectCoach,
    onCreateCoach,
    onDeleteCoach,
    onGlobalDashboard,
    onNavigate,
    activeSection
}) {
    const menuItems = [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'topics', icon: BookOpen, label: 'Topics' },
        { id: 'flashcards', icon: Zap, label: 'Flashcards' },
        { id: 'quizzes', icon: FileText, label: 'Quizzes' },
        { id: 'progress', icon: BarChart3, label: 'Progress' },
        { id: 'chat', icon: MessageSquare, label: 'AI Tutor' }
    ];

    const handleItemClick = (itemId) => {
        if (onNavigate) {
            onNavigate(itemId);
        }
    };

    return (
        <aside className="h-[calc(100vh-64px)] overflow-y-auto flex flex-col bg-white">
            {/* Navigation Menu - Matching Reference */}
            <nav className="mt-4 lg:mt-0 flex-1">
                <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
                </div>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors cursor-pointer ${
                                isActive 
                                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-600 font-medium' 
                                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Topic Workspaces */}
            <div className="p-4 lg:p-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                    <BookOpen size={16} className="text-gray-400" />
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Topic Workspaces
                    </h3>
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {coaches.length === 0 ? (
                        <p className="text-sm text-gray-500 px-4 py-2">
                            No workspaces yet. Create one to get started!
                        </p>
                    ) : (
                        coaches.map((coach) => (
                            <div
                                key={coach.id}
                                className={`group flex items-center justify-between px-4 py-3 rounded-lg transition-all cursor-pointer ${
                                    activeCoach?.id === coach.id
                                        ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                                onClick={() => onSelectCoach && onSelectCoach(coach)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{coach.subject}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {coach.documentCount || 0} docs
                                    </div>
                                </div>
                                <button
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-500 transition-all ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteCoach && onDeleteCoach(coach.id);
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <button 
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all cursor-pointer"
                    onClick={() => onCreateCoach && onCreateCoach()}
                >
                    <Plus size={18} />
                    <span>Create new topic workspace</span>
                </button>
            </div>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-gray-200 bg-white">
                <p className="text-xs text-center text-gray-500">
                    Powered by RAG + Groq
                </p>
            </div>
        </aside>
    );
}
