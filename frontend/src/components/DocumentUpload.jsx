import { useState, useRef } from 'react';
import { Upload, File, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadDocument, deleteDocument } from '../api/ragApi';

export default function DocumentUpload({ documents, onDocumentsChange, onDocumentUploaded, onStartChat, coachName }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        for (const file of files) {
            await handleUpload(file);
        }
    };

    const handleUpload = async (file) => {
        setUploading(true);
        setUploadStatus(null);

        try {
            const result = await uploadDocument(file);
            setUploadStatus({ type: 'success', message: `Uploaded ${file.name}` });
            if (onDocumentUploaded && result.document) {
                onDocumentUploaded(result.document.id);
            } else {
                onDocumentsChange();
            }
        } catch (error) {
            setUploadStatus({ type: 'error', message: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        try {
            await deleteDocument(docId);
            onDocumentsChange();
        } catch (error) {
            setUploadStatus({ type: 'error', message: 'Failed to delete document' });
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
                <h2 className="text-2xl font-bold mb-2">
                    {coachName ? `${coachName} – Topics & documents` : 'Upload Study Materials'}
                </h2>
                <p className="text-blue-100">
                    Add PDFs, text files, or markdown. Materials are used for flashcards, quizzes, and AI Tutor in this workspace.
                </p>
            </div>

            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50 scale-105'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md,.markdown"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center space-y-4">
                        <Loader className="animate-spin text-blue-500" size={32} />
                        <p className="text-gray-600 font-medium">Uploading...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-lg font-semibold text-gray-800 mb-2">Drag & drop files here</p>
                        <p className="text-sm text-gray-600 mb-2">or click to browse</p>
                        <span className="text-xs text-gray-500">PDF, TXT, MD supported</span>
                    </>
                )}
            </div>

            {/* Upload Status */}
            {uploadStatus && (
                <div className={`flex items-center space-x-2 p-4 rounded-lg ${
                    uploadStatus.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {uploadStatus.type === 'success' ? (
                        <CheckCircle size={18} />
                    ) : (
                        <AlertCircle size={18} />
                    )}
                    <span className="font-medium">{uploadStatus.message}</span>
                </div>
            )}

            {/* Documents List */}
            {documents.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">
                        Uploaded Documents ({documents.length})
                    </h3>

                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <File className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800 truncate">{doc.filename}</div>
                                        <div className="text-sm text-gray-500">
                                            {formatFileSize(doc.file_size_bytes)} • {doc.chunk_count} chunks
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors ml-4"
                                    onClick={() => handleDelete(doc.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Start Chat Button */}
            {documents.length > 0 && (
                <div className="flex justify-center">
                    <button 
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                        onClick={onStartChat}
                    >
                        Start Learning Session
                    </button>
                </div>
            )}
        </div>
    );
}
