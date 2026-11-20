import { useState, useEffect } from 'react';
import { Menu, X, Brain, Search, User, Settings, TrendingUp, LogOut, ChevronDown, Globe, Wifi, WifiOff } from 'lucide-react';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import CreateCoachModal from './components/CreateCoachModal';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import QuizMode from './components/QuizMode';
import Dashboard from './components/Dashboard';
import WorkspaceOverview from './components/WorkspaceOverview';
import FlashcardNotebook from './components/FlashcardNotebook';
import { getDocuments } from './api/ragApi';

// Local storage keys
const COACHES_KEY = 'edumorph_coaches';
const COACH_DOCS_KEY = 'edumorph_coach_documents';

export default function App() {
    const [coaches, setCoaches] = useState([]);
    const [activeCoach, setActiveCoach] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [view, setView] = useState('welcome'); // welcome, upload, modes, chat, quiz, dashboard, progress, flashcards
    const [chatMode, setChatMode] = useState('chat'); // chat, revision, notes, deep
    const [documents, setDocuments] = useState([]);
    const [coachDocuments, setCoachDocuments] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [language, setLanguage] = useState('English');
    const [isOnline, setIsOnline] = useState(true);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');

    const languages = ['English', 'हिंदी', 'मराठी', 'தமிழ்'];

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            if (activeCoach) {
                setChatMode('chat');
                setView('chat');
                setActiveSection('chat');
            } else if (coaches.length > 0) {
                // Auto-select first coach if available
                handleSelectCoach(coaches[0]);
                setTimeout(() => {
                    setChatMode('chat');
                    setView('chat');
                    setActiveSection('chat');
                }, 100);
            } else {
                // Prompt to create coach
                setShowCreateModal(true);
            }
        }
    };

    // Load coaches and coach-document mapping from localStorage on mount
    useEffect(() => {
        const savedCoaches = localStorage.getItem(COACHES_KEY);
        if (savedCoaches) {
            try {
                setCoaches(JSON.parse(savedCoaches));
            } catch (e) {
                console.error('Failed to parse saved coaches');
            }
        }

        const savedCoachDocs = localStorage.getItem(COACH_DOCS_KEY);
        if (savedCoachDocs) {
            try {
                setCoachDocuments(JSON.parse(savedCoachDocs));
            } catch (e) {
                console.error('Failed to parse coach documents');
            }
        }
    }, []);

    // Save coaches to localStorage when changed
    useEffect(() => {
        localStorage.setItem(COACHES_KEY, JSON.stringify(coaches));
    }, [coaches]);

    // Save coach-document mapping when changed
    useEffect(() => {
        localStorage.setItem(COACH_DOCS_KEY, JSON.stringify(coachDocuments));
    }, [coachDocuments]);

    // Fetch documents when view changes
    useEffect(() => {
        if (view === 'upload' || view === 'modes' || view === 'chat' || view === 'dashboard' || view === 'flashcards') {
            fetchDocuments();
        }
    }, [view]);

    const fetchDocuments = async () => {
        try {
            const docs = await getDocuments();
            const allDocs = docs.documents || [];
            setDocuments(allDocs);

            if (activeCoach) {
                const coachDocIds = coachDocuments[activeCoach.id] || [];
                const coachDocs = allDocs.filter(d => coachDocIds.includes(d.id));

                setCoaches(prev => prev.map(c =>
                    c.id === activeCoach.id
                        ? { ...c, documentCount: coachDocs.length }
                        : c
                ));
            }
        } catch (e) {
            console.error('Failed to fetch documents:', e);
        }
    };

    const getCoachDocuments = () => {
        if (!activeCoach) return documents;
        const coachDocIds = coachDocuments[activeCoach.id] || [];
        return documents.filter(d => coachDocIds.includes(d.id));
    };

    const handleCreateCoach = (subject) => {
        const newCoach = {
            id: Date.now().toString(),
            subject,
            documentCount: 0,
            createdAt: new Date().toISOString()
        };

        setCoaches(prev => [...prev, newCoach]);
        setActiveCoach(newCoach);
        setCoachDocuments(prev => ({ ...prev, [newCoach.id]: [] }));
        setView('upload');
        setShowCreateModal(false);
    };

    const handleSelectCoach = (coach) => {
        setActiveCoach(coach);
        if (coach.documentCount > 0) {
            setView('dashboard');
            setActiveSection('dashboard');
        } else {
            setView('upload');
            setActiveSection('topics');
        }
    };

    const handleDeleteCoach = (coachId) => {
        setCoaches(prev => prev.filter(c => c.id !== coachId));
        setCoachDocuments(prev => {
            const updated = { ...prev };
            delete updated[coachId];
            return updated;
        });
        if (activeCoach?.id === coachId) {
            setActiveCoach(null);
            setView('welcome');
        }
    };

    const handleDocumentUploaded = (docId) => {
        if (activeCoach && docId) {
            setCoachDocuments(prev => ({
                ...prev,
                [activeCoach.id]: [...(prev[activeCoach.id] || []), docId]
            }));
        }
        fetchDocuments();
    };

    const handleStartLearning = () => {
        if (activeCoach) {
            const coachDocIds = coachDocuments[activeCoach.id] || [];
            setCoaches(prev => prev.map(c =>
                c.id === activeCoach.id
                    ? { ...c, documentCount: coachDocIds.length }
                    : c
            ));
        }
        setView('dashboard');
        setActiveSection('dashboard');
    };

    const handleSelectMode = (mode) => {
        switch (mode) {
            case 'quiz':
                setView('quiz');
                break;
            case 'chat':
            case 'revision':
            case 'notes':
            case 'deep':
                setChatMode(mode);
                setView('chat');
                break;
            case 'dashboard':
                setView(activeCoach ? 'dashboard' : 'welcome');
                break;
            default:
                setView('chat');
        }
    };

    const handleGlobalDashboard = () => {
        setActiveCoach(null);
        setView('welcome');
        setActiveSection('dashboard');
    };

    const handleSidebarNavigation = (section) => {
        setActiveSection(section);
        setSidebarOpen(false);

        switch (section) {
            case 'dashboard':
                if (activeCoach) {
                    setView('dashboard');
                } else {
                    setView('welcome');
                }
                break;
            case 'topics':
                if (activeCoach) {
                    setView('upload');
                    setActiveSection('topics');
                } else if (coaches.length > 0) {
                    handleSelectCoach(coaches[0]);
                    setTimeout(() => {
                        setView('upload');
                        setActiveSection('topics');
                    }, 100);
                } else {
                    setView('welcome');
                    setShowCreateModal(true);
                }
                break;
            case 'flashcards':
                if (activeCoach) {
                    setView('flashcards');
                } else if (coaches.length > 0) {
                    handleSelectCoach(coaches[0]);
                    setTimeout(() => setView('flashcards'), 100);
                } else {
                    setView('welcome');
                    setShowCreateModal(true);
                }
                break;
            case 'quizzes':
                if (activeCoach) {
                    setView('quiz');
                } else if (coaches.length > 0) {
                    handleSelectCoach(coaches[0]);
                    setTimeout(() => setView('quiz'), 100);
                } else {
                    setView('welcome');
                    setShowCreateModal(true);
                }
                break;
            case 'progress':
                setView('progress');
                break;
            case 'chat':
                if (activeCoach) {
                    setChatMode('chat');
                    setView('chat');
                } else if (coaches.length > 0) {
                    handleSelectCoach(coaches[0]);
                    setTimeout(() => {
                        setChatMode('chat');
                        setView('chat');
                    }, 100);
                } else {
                    setView('welcome');
                    setShowCreateModal(true);
                }
                break;
            default:
                break;
        }
    };

    const renderMainContent = () => {
        switch (view) {
            case 'upload':
                return (
                    <DocumentUpload
                        documents={getCoachDocuments()}
                        onDocumentsChange={fetchDocuments}
                        onDocumentUploaded={handleDocumentUploaded}
                        onStartChat={handleStartLearning}
                        coachName={activeCoach?.subject}
                    />
                );
            case 'modes':
                return (
                    <div className="space-y-6">
                        <LearningModes onSelectMode={handleSelectMode} />
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-blue-300 text-gray-700 font-medium"
                                onClick={() => setView('dashboard')}
                            >
                                📊 View Dashboard
                            </button>
                            <button
                                className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-sm"
                                onClick={() => setView('upload')}
                            >
                                📁 Upload More Documents
                            </button>
                        </div>
                    </div>
                );
            case 'chat':
                return (
                    <ChatInterface
                        coachName={activeCoach?.subject || 'AI'}
                        onBack={() => activeCoach ? setView('dashboard') : setView('welcome')}
                        mode={chatMode}
                    />
                );
            case 'quiz':
                return (
                    <QuizMode
                        coachName={activeCoach?.subject || 'General'}
                        onBack={() => activeCoach ? setView('dashboard') : setView('welcome')}
                        onComplete={() => activeCoach ? setView('dashboard') : setView('welcome')}
                    />
                );
            case 'dashboard':
                if (activeCoach) {
                    return (
                        <WorkspaceOverview
                            workspace={activeCoach}
                            documentCount={(coachDocuments[activeCoach.id] || []).length}
                            onOpenTopics={() => { setView('upload'); setActiveSection('topics'); }}
                            onOpenFlashcards={() => setView('flashcards')}
                            onOpenQuizzes={() => setView('quiz')}
                            onOpenChat={() => { setChatMode('chat'); setView('chat'); }}
                            onOpenProgress={() => setView('progress')}
                        />
                    );
                }
                return <WelcomeScreen onCreateCoach={() => setShowCreateModal(true)} />;
            case 'progress':
                return (
                    <Dashboard
                        title="Progress"
                        coachName={activeCoach?.subject}
                        onBack={activeCoach ? () => setView('dashboard') : () => setView('welcome')}
                    />
                );
            case 'flashcards':
                if (!activeCoach) return <WelcomeScreen onCreateCoach={() => setShowCreateModal(true)} />;
                return (
                    <FlashcardNotebook
                        workspaceName={activeCoach.subject}
                        documentIds={coachDocuments[activeCoach.id] || []}
                        documentCount={(coachDocuments[activeCoach.id] || []).length}
                        onBack={() => setView('dashboard')}
                        onOpenTopics={() => { setView('upload'); setActiveSection('topics'); }}
                    />
                );
            default:
                return <WelcomeScreen onCreateCoach={() => setShowCreateModal(true)} />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header - Matching Reference */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3 lg:px-6">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                EduMorph
                            </h1>
                        </div>
                    </div>

                    <div className="flex-1 max-w-lg mx-4 hidden md:block">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search topics, notes, or ask a question..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </form>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button 
                            className="p-2 hover:bg-gray-100 rounded-lg flex items-center space-x-1"
                            onClick={() => setLanguage(languages[(languages.indexOf(language) + 1) % languages.length])}
                        >
                            <Globe size={16} />
                            <span className="hidden sm:inline text-sm">{language}</span>
                        </button>
                        
                        <div className="flex items-center space-x-1">
                            {isOnline ? (
                                <Wifi size={16} className="text-green-500" />
                            ) : (
                                <WifiOff size={16} className="text-red-500" />
                            )}
                            <span className="hidden sm:inline text-xs text-gray-600">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <ChevronDown size={16} className="text-gray-400" />
                            </button>

                            {showProfileDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="font-semibold text-gray-800">Student</p>
                                        <p className="text-sm text-gray-600">EduMorph User</p>
                                    </div>
                                    <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-50">
                                        <Settings className="w-4 h-4 mr-3 text-gray-400" />
                                        Settings
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => { setView('progress'); setShowProfileDropdown(false); }}
                                        className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-left"
                                    >
                                        <TrendingUp className="w-4 h-4 mr-3 text-gray-400" />
                                        Progress
                                    </button>
                                    <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600">
                                        <LogOut className="w-4 h-4 mr-3" />
                                        Logout
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar - Matching Reference */}
                <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
                    <div className="flex items-center justify-between p-4 lg:hidden">
                        <h2 className="font-semibold text-gray-800">Navigation</h2>
                        <button onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <Sidebar
                        coaches={coaches}
                        activeCoach={activeCoach}
                        onSelectCoach={(coach) => {
                            handleSelectCoach(coach);
                            setSidebarOpen(false);
                        }}
                        onCreateCoach={() => setShowCreateModal(true)}
                        onDeleteCoach={handleDeleteCoach}
                        onGlobalDashboard={() => {
                            handleGlobalDashboard();
                            setSidebarOpen(false);
                        }}
                        onNavigate={handleSidebarNavigation}
                        activeSection={activeSection}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto">
                    {renderMainContent()}
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Profile Dropdown Overlay */}
            {showProfileDropdown && (
                <div 
                    className="fixed inset-0 z-30"
                    onClick={() => setShowProfileDropdown(false)}
                ></div>
            )}

            {showCreateModal && (
                <CreateCoachModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateCoach}
                />
            )}
        </div>
    );
}
