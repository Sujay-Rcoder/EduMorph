import { useState, useEffect } from 'react';
import { BarChart3, Award, Target, TrendingUp, Clock, BookOpen, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard({ coachName, onBack, title }) {
    const [quizHistory, setQuizHistory] = useState([]);
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        averageScore: 0,
        totalQuestions: 0,
        strongAreas: [],
        weakAreas: []
    });

    useEffect(() => {
        loadQuizHistory();
    }, [coachName]);

    const loadQuizHistory = () => {
        const history = JSON.parse(localStorage.getItem('edumorph_quiz_history') || '[]');
        const filtered = coachName
            ? history.filter(q => q.coach === coachName)
            : history;

        setQuizHistory(filtered.slice(-20).reverse());

        if (filtered.length > 0) {
            const totalQuizzes = filtered.length;
            const totalQuestions = filtered.reduce((sum, q) => sum + (q.num_questions || 0), 0);
            const averageScore = Math.round(
                filtered.reduce((sum, q) => sum + q.overall_score, 0) / totalQuizzes
            );

            const strongMap = {};
            const weakMap = {};
            filtered.forEach(q => {
                (q.strong_areas || []).forEach(a => strongMap[a] = (strongMap[a] || 0) + 1);
                (q.weak_areas || []).forEach(a => weakMap[a] = (weakMap[a] || 0) + 1);
            });

            const strongAreas = Object.entries(strongMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([area]) => area);

            const weakAreas = Object.entries(weakMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([area]) => area);

            setStats({ totalQuizzes, averageScore, totalQuestions, strongAreas, weakAreas });
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Prepare chart data from quiz history
    const chartData = quizHistory.slice(-7).reverse().map((quiz, index) => ({
        name: `Quiz ${index + 1}`,
        score: quiz.overall_score
    }));

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                <div className="flex items-center space-x-4">
                    {onBack && (
                        <button 
                            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                            onClick={onBack}
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className="flex items-center space-x-2">
                        <BarChart3 size={24} />
                        <h2 className="text-2xl font-bold">
                            {title || (coachName ? `${coachName} Dashboard` : 'Platform Dashboard')}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">Quizzes Taken</h3>
                        <Award className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalQuizzes}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">Average Score</h3>
                        <Target className="w-5 h-5 text-green-500" />
                    </div>
                    <p className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                        {stats.averageScore}%
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">Questions Answered</h3>
                        <BookOpen className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalQuestions}</p>
                </div>
            </div>

            {/* Performance Areas */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span>Strong Areas</span>
                    </h3>
                    {stats.strongAreas.length > 0 ? (
                        <ul className="space-y-2">
                            {stats.strongAreas.map((area, i) => (
                                <li key={i} className="flex items-center space-x-2 text-gray-700">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>{area}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">Complete quizzes to see your strengths</p>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                        <Target className="w-5 h-5 text-orange-500" />
                        <span>Areas to Improve</span>
                    </h3>
                    {stats.weakAreas.length > 0 ? (
                        <ul className="space-y-2">
                            {stats.weakAreas.map((area, i) => (
                                <li key={i} className="flex items-center space-x-2 text-gray-700">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span>{area}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">Keep learning to identify improvement areas</p>
                    )}
                </div>
            </div>

            {/* Progress Chart */}
            {chartData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Recent Performance</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Quiz History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span>Recent Quizzes</span>
                </h3>

                {quizHistory.length > 0 ? (
                    <div className="space-y-3">
                        {quizHistory.map((quiz, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-gray-800">{quiz.coach || 'General'}</span>
                                        <span className="text-sm text-gray-500">{formatDate(quiz.timestamp)}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">{quiz.num_questions} questions</div>
                                </div>
                                <span className={`text-lg font-semibold ${getScoreColor(quiz.overall_score)}`}>
                                    {quiz.overall_score}%
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">No quizzes taken yet.</p>
                        <p className="text-sm text-gray-400">Take a quiz to track your progress!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
