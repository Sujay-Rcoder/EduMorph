import { Bot, User, FileText } from 'lucide-react';

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';

    const formatContent = (text) => {
        let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/\n/g, '<br>');
        formatted = formatted.replace(/^- (.+)$/gm, '• $1');
        return formatted;
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUser 
                        ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                        : 'bg-gradient-to-r from-purple-400 to-pink-500'
                }`}>
                    {isUser ? (
                        <User className="w-4 h-4 text-white" />
                    ) : (
                        <Bot className="w-4 h-4 text-white" />
                    )}
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                    isUser 
                        ? 'bg-blue-500 text-white' 
                        : message.isError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}>
                    <div
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                    />

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500 flex items-center space-x-1">
                                <FileText size={10} />
                                <span>Sources:</span>
                            </span>
                            {message.sources.map((source, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {source.document_name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
