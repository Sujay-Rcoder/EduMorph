import { useState } from 'react';
import { ChevronRight, Send, Loader, Award, ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function QuizMode({ coachName, onBack, onComplete }) {
    const [phase, setPhase] = useState('config');
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState('mixed');
    const [topic, setTopic] = useState('');

    const [quizData, setQuizData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [currentAnswer, setCurrentAnswer] = useState('');

    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateQuiz = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic || null,
                    num_questions: numQuestions,
                    difficulty
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to generate quiz');
            }

            const data = await response.json();
            setQuizData(data);
            setPhase('quiz');
            setCurrentQuestion(0);
            setAnswers({});
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const saveAnswer = () => {
        if (!currentAnswer.trim()) return;

        const qId = quizData.questions[currentQuestion].id;
        setAnswers(prev => ({ ...prev, [qId]: currentAnswer }));

        if (currentQuestion < quizData.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            const nextQId = quizData.questions[currentQuestion + 1].id;
            setCurrentAnswer(answers[nextQId] || '');
        }
    };

    const goToPrevious = () => {
        if (currentQuestion > 0) {
            const qId = quizData.questions[currentQuestion].id;
            if (currentAnswer.trim()) {
                setAnswers(prev => ({ ...prev, [qId]: currentAnswer }));
            }

            setCurrentQuestion(prev => prev - 1);
            const prevQId = quizData.questions[currentQuestion - 1].id;
            setCurrentAnswer(answers[prevQId] || '');
        }
    };

    const submitQuiz = async () => {
        const qId = quizData.questions[currentQuestion].id;
        const finalAnswers = { ...answers, [qId]: currentAnswer };
        setAnswers(finalAnswers);

        setPhase('submitting');
        setIsLoading(true);
        setError(null);

        try {
            const answersArray = Object.entries(finalAnswers).map(([id, answer]) => ({
                question_id: parseInt(id),
                answer
            }));

            const response = await fetch('/api/quiz/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quiz_id: quizData.quiz_id,
                    questions: quizData.questions,
                    answers: answersArray
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to evaluate quiz');
            }

            const data = await response.json();
            setResults(data);
            setPhase('results');
            saveQuizToHistory(quizData, finalAnswers, data);

        } catch (e) {
            setError(e.message);
            setPhase('quiz');
        } finally {
            setIsLoading(false);
        }
    };

    const saveQuizToHistory = (quiz, answers, results) => {
        const history = JSON.parse(localStorage.getItem('edumorph_quiz_history') || '[]');
        history.push({
            quiz_id: quiz.quiz_id,
            coach: coachName,
            timestamp: new Date().toISOString(),
            num_questions: quiz.questions.length,
            overall_score: results.overall_score,
            strong_areas: results.strong_areas,
            weak_areas: results.weak_areas
        });
        localStorage.setItem('edumorph_quiz_history', JSON.stringify(history));
    };

    const getFeedbackIcon = (type) => {
        switch (type) {
            case 'correct': return <CheckCircle className="text-green-500" size={20} />;
            case 'partial': return <AlertCircle className="text-yellow-500" size={20} />;
            case 'off_topic': return <XCircle className="text-red-500" size={20} />;
            default: return <AlertCircle className="text-orange-500" size={20} />;
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    // Config Phase
    if (phase === 'config') {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                    <div className="flex items-center space-x-4 mb-2">
                        <button 
                            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                            onClick={onBack}
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h2 className="text-2xl font-bold">Take a Quiz - {coachName}</h2>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Configure Your Quiz</h3>
                    <p className="text-gray-600 mb-6">
                        Test your knowledge with AI-generated questions. You'll type your answers and receive detailed feedback.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Topic Focus (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g., Newton's Laws, sorting algorithms..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                >
                                    <option value={3}>3 Questions</option>
                                    <option value={5}>5 Questions</option>
                                    <option value={7}>7 Questions</option>
                                    <option value={10}>10 Questions</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            onClick={generateQuiz}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Start Quiz</span>
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz Phase
    if (phase === 'quiz' && quizData) {
        const question = quizData.questions[currentQuestion];
        const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
        const isLastQuestion = currentQuestion === quizData.questions.length - 1;

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button 
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={onBack}
                        >
                            <ArrowLeft size={18} className="text-gray-600" />
                        </button>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock size={16} />
                            <span>Question {currentQuestion + 1} of {quizData.questions.length}</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {question.difficulty}
                        </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-800 mb-6">{question.question}</h3>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Your Answer:</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            placeholder="Type your answer here... Be detailed and explain your reasoning."
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            rows={6}
                        />
                    </div>

                    <div className="flex justify-between mt-6">
                        <button
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={goToPrevious}
                            disabled={currentQuestion === 0}
                        >
                            Previous
                        </button>

                        {isLastQuestion ? (
                            <button
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                onClick={submitQuiz}
                                disabled={!currentAnswer.trim()}
                            >
                                <Send size={18} />
                                <span>Submit Quiz</span>
                            </button>
                        ) : (
                            <button
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                onClick={saveAnswer}
                                disabled={!currentAnswer.trim()}
                            >
                                <span>Next</span>
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Submitting Phase
    if (phase === 'submitting') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader className="animate-spin text-blue-500" size={48} />
                <h3 className="text-xl font-semibold text-gray-800">Evaluating Your Answers...</h3>
                <p className="text-gray-600">Our AI is analyzing your responses and preparing detailed feedback.</p>
            </div>
        );
    }

    // Results Phase
    if (phase === 'results' && results) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                    <div className="flex items-center space-x-4 mb-2">
                        <button 
                            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                            onClick={onBack}
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h2 className="text-2xl font-bold">Quiz Results</h2>
                    </div>
                </div>

                {/* Overall Score */}
                <div className={`bg-white rounded-xl shadow-sm border-2 p-8 text-center ${getScoreColor(results.overall_score)}`}>
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Award className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <div className="text-5xl font-bold mb-2">{results.overall_score}%</div>
                    <p className="text-lg">{results.overall_feedback}</p>

                    <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                        {results.strong_areas?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-green-700 mb-2">✅ Strong Areas</h4>
                                <ul className="space-y-1 text-sm">
                                    {results.strong_areas.map((area, i) => (
                                        <li key={i} className="text-gray-700">• {area}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {results.weak_areas?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-orange-700 mb-2">📈 Areas to Improve</h4>
                                <ul className="space-y-1 text-sm">
                                    {results.weak_areas.map((area, i) => (
                                        <li key={i} className="text-gray-700">• {area}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Individual Evaluations */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Detailed Feedback</h3>

                    {results.evaluations.map((evaluation, index) => {
                        const question = quizData.questions.find(q => q.id === evaluation.question_id);
                        const userAnswer = answers[evaluation.question_id];

                        return (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        {getFeedbackIcon(evaluation.feedback_type)}
                                        <span className="font-medium text-gray-800">Q{index + 1}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">Score: {evaluation.score}/10</span>
                                </div>

                                <h4 className="font-semibold text-gray-800 mb-4">{question?.question}</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Your Answer:</label>
                                        <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">{userAnswer}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Feedback:</label>
                                        <p className="mt-1 p-3 bg-blue-50 rounded-lg text-gray-700">{evaluation.feedback}</p>
                                    </div>

                                    {evaluation.improvement_tips && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">💡 Improvement Tips:</label>
                                            <p className="mt-1 p-3 bg-yellow-50 rounded-lg text-gray-700">{evaluation.improvement_tips}</p>
                                        </div>
                                    )}

                                    {evaluation.correct_answer_summary && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">✓ Correct Answer:</label>
                                            <p className="mt-1 p-3 bg-green-50 rounded-lg text-gray-700">{evaluation.correct_answer_summary}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4">
                    <button 
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        onClick={onBack}
                    >
                        Back to Coach
                    </button>
                    <button 
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                        onClick={() => {
                            setPhase('config');
                            setQuizData(null);
                            setResults(null);
                            setAnswers({});
                            setCurrentAnswer('');
                        }}
                    >
                        Take Another Quiz
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
