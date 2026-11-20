import { ClipboardList, Zap, FileText, Search, MessageSquare } from 'lucide-react';

export default function LearningModes({ onSelectMode }) {
    const modes = [
        {
            id: 'quiz',
            icon: ClipboardList,
            title: 'Take Quiz',
            description: 'Test your knowledge with AI-generated questions and get detailed feedback',
            color: 'purple',
            gradient: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
        {
            id: 'revision',
            icon: Zap,
            title: 'Quick Revision',
            description: 'Get a 5-point summary of key concepts from your materials',
            color: 'yellow',
            gradient: 'from-yellow-400 to-orange-500',
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-600'
        },
        {
            id: 'notes',
            icon: FileText,
            title: 'Last-Minute Notes',
            description: 'Generate exam-ready cheat sheets and quick review notes',
            color: 'green',
            gradient: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600'
        },
        {
            id: 'deep',
            icon: Search,
            title: 'Deep Dive',
            description: 'Get detailed explanations on any topic from your materials',
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            id: 'chat',
            icon: MessageSquare,
            title: 'Ask Anything',
            description: 'Free-form conversation with your AI coach',
            color: 'cyan',
            gradient: 'from-cyan-500 to-blue-500',
            bgColor: 'bg-cyan-50',
            iconColor: 'text-cyan-600'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">Choose Learning Mode</h2>
                <p className="text-gray-600">Select how you'd like to learn today</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                        <button
                            key={mode.id}
                            className={`${mode.bgColor} rounded-xl p-6 border-2 border-transparent hover:border-gray-300 hover:shadow-lg transition-all transform hover:-translate-y-1 text-left group`}
                            onClick={() => onSelectMode(mode.id)}
                        >
                            <div className={`w-12 h-12 bg-gradient-to-r ${mode.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-6 h-6 text-white`} />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2 text-lg">{mode.title}</h3>
                            <p className="text-sm text-gray-600">{mode.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
