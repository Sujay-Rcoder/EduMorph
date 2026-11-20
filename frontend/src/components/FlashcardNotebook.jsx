import { useState } from 'react';
import {
    ArrowLeft,
    Download,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Link2,
} from 'lucide-react';
import { generateFlashcards } from '../api/ragApi';

// Human-readable labels for all possible flashcard keys (matches backend + any extra)
const SECTION_LABELS = {
    concept: 'Concept',
    definition: 'Definition',
    deep_explanation: 'Deep explanation',
    key_terms: 'Key terms',
    formulas_or_rules: 'Formulas & rules',
    examples: 'Examples',
    real_life_examples: 'Real-life examples',
    common_mistakes: 'Common mistakes',
    exam_tips: 'Exam tips',
    prerequisites: 'Prerequisites',
    past_scope: 'Prior / background',
    future_scope: 'Future scope',
    applications: 'Applications',
    how_to_relate: 'How to relate',
    study_resources: 'Study resources',
    summary: 'Summary',
    related_concepts: 'Related concepts',
    practice_suggestions: 'Practice suggestions',
    visual_note: 'Visual note',
    mnemonics: 'Mnemonics',
    comparison: 'Comparison',
};

// Preferred order for sections (concept is always first as title)
const SECTION_ORDER = [
    'definition',
    'deep_explanation',
    'key_terms',
    'formulas_or_rules',
    'examples',
    'real_life_examples',
    'common_mistakes',
    'exam_tips',
    'prerequisites',
    'past_scope',
    'future_scope',
    'applications',
    'how_to_relate',
    'study_resources',
    'summary',
    'related_concepts',
    'practice_suggestions',
    'visual_note',
    'mnemonics',
    'comparison',
];

function getOrderedSections(card) {
    const out = [];
    const seen = new Set(['concept']);
    for (const key of SECTION_ORDER) {
        if (card[key] && typeof card[key] === 'string' && card[key].trim()) {
            out.push({ key, label: SECTION_LABELS[key] || key.replace(/_/g, ' '), value: card[key].trim() });
            seen.add(key);
        }
    }
    for (const key of Object.keys(card)) {
        if (seen.has(key) || !card[key] || typeof card[key] !== 'string') continue;
        const v = card[key].trim();
        if (v) out.push({ key, label: SECTION_LABELS[key] || key.replace(/_/g, ' '), value: v });
    }
    return out;
}

function Section({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    if (!children || (typeof children === 'string' && !children.trim())) return null;
    return (
        <div className="rounded-md overflow-hidden bg-gray-50/90">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100/80 transition-colors"
            >
                <span>{title}</span>
                {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-500" />}
            </button>
            {open && (
                <div className="px-3 pb-3 pt-0 text-gray-600 whitespace-pre-wrap text-xs leading-relaxed">
                    {children}
                </div>
            )}
        </div>
    );
}

function FlashcardTile({ index, card }) {
    const sections = getOrderedSections(card);

    return (
        <article className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full min-h-[220px] shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    {index + 1}
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2 leading-snug">{card.concept}</h3>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-1.5 min-h-0">
                {sections.map(({ key, label, value }) => (
                    <Section
                        key={key}
                        title={label}
                        defaultOpen={key === 'definition' || key === 'deep_explanation' || key === 'real_life_examples'}
                    >
                        {value}
                    </Section>
                ))}
            </div>
        </article>
    );
}

function downloadMarkdown(markdown, filename = 'flashcards.md') {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function FlashcardNotebook({
    workspaceName,
    documentIds,
    documentCount,
    onBack,
    onOpenTopics,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await generateFlashcards(documentIds && documentIds.length > 0 ? documentIds : null);
            setData(res);
        } catch (err) {
            setError(err.message || 'Failed to generate flashcards');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!data?.full_page_markdown) return;
        const name = workspaceName
            ? `flashcards-${workspaceName.replace(/\s+/g, '-')}.md`
            : 'flashcards.md';
        downloadMarkdown(data.full_page_markdown, name);
    };

    if (data?.flashcards?.length > 0) {
        return (
            <div className="space-y-6 pb-12">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <button
                                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                                onClick={onBack}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Flashcard notes
                                    {workspaceName && ` — ${workspaceName}`}
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">
                                    {data.flashcards.length} note{data.flashcards.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                        >
                            <Download size={18} />
                            Download page
                        </button>
                    </div>
                </div>

                {/* Uniform grid: same-size cards, no empty spaces */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {data.flashcards.map((card, index) => (
                        <FlashcardTile key={index} index={index} card={card} />
                    ))}
                </div>

                <div className="flex justify-center pt-4">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        <Download size={20} />
                        Download page (share or print)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                <div className="flex items-center space-x-4">
                    <button
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                        onClick={onBack}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold">Flashcards</h2>
                        <p className="text-blue-100">
                            {workspaceName ? `${workspaceName} – ` : ''}Generate study notes with definitions, examples & real-life situations
                        </p>
                    </div>
                </div>
            </div>

            {documentCount === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-amber-600" />
                    <p className="font-medium">No documents in this workspace</p>
                    <p className="text-sm mt-2">Upload materials in Topics first, then generate flashcards.</p>
                    <button
                        type="button"
                        onClick={onOpenTopics}
                        className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
                    >
                        Go to Topics & documents
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
                    <p className="text-gray-600 mb-4">
                        Create study notes with definitions, key terms, examples, real-life situations,
                        exam tips, and more—in a clean uniform grid with no gaps.
                    </p>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating…
                            </>
                        ) : (
                            <>
                                <Link2 size={20} />
                                Generate flashcard notes
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
