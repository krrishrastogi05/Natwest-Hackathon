import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseFile, formatFileSize } from '../utils/csvParser';

export default function FileUpload({ onFileLoaded, disabled }) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [loadedFile, setLoadedFile] = useState(null);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Invalid file type. Please upload a CSV, TSV, or JSON file.');
      return;
    }
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    onFileLoaded(file);
  }, [onFileLoaded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'application/json': ['.json'],
      'text/plain': ['.txt'],
    },
    multiple: false,
    disabled: disabled || parsing,
  });

  const clearFile = (e) => {
    e.stopPropagation();
    setLoadedFile(null);
    setError(null);
  };

  if (loadedFile) {
    return (
      <div className="anim-scale-in">
        <div className="dropzone has-file relative flex items-center gap-4 !p-5 cursor-default">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 flex items-center justify-center">
            <CheckCircle size={22} className="text-[#2dd4bf]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={15} className="text-[#2dd4bf] flex-shrink-0" />
              <span className="font-semibold text-sm text-white truncate">{loadedFile.name}</span>
            </div>
            <p className="text-xs text-[#a0a0c0] mt-1">
              {formatFileSize(loadedFile.size)} · {loadedFile.rowCount.toLocaleString()} rows · {loadedFile.colCount} columns
            </p>
          </div>
          <button
            onClick={clearFile}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#2a2a4a]/60 transition-colors text-[#6a6a8a] hover:text-white"
            title="Remove file"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-up">
      <div
        {...getRootProps()}
        className={`dropzone group ${isDragActive ? 'active' : ''} ${isDragReject ? '!border-red-500 !bg-red-500/5' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          {parsing ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#5b21b6]/12 border border-[#5b21b6]/20 flex items-center justify-center mb-4">
                <Loader2 size={26} className="text-[#a78bfa] animate-spin" />
              </div>
              <p className="text-sm font-semibold text-white">Parsing your data...</p>
              <p className="text-xs text-[#6a6a8a] mt-1">Analyzing schema and generating summaries</p>
            </>
          ) : isDragActive ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#5b21b6]/15 border border-[#5b21b6]/30 flex items-center justify-center mb-4 anim-scale-in">
                <FileSpreadsheet size={26} className="text-[#a78bfa]" />
              </div>
              <p className="text-sm font-semibold text-[#a78bfa]">Drop your file here!</p>
              <p className="text-xs text-[#7c3aed]/60 mt-1">We'll analyze it instantly</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#2a2a4a]/40 border border-[#3a3a5a]/30 flex items-center justify-center mb-4 group-hover:bg-[#5b21b6]/10 group-hover:border-[#5b21b6]/20 transition-all duration-300">
                <Upload size={24} className="text-[#6a6a8a] group-hover:text-[#a78bfa] transition-colors duration-300 group-hover:-translate-y-1 transform" />
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                Drag & drop your dataset
              </p>
              <p className="text-xs text-[#6a6a8a] mt-1">
                or <span className="text-[#a78bfa] font-medium underline decoration-[#5b21b6]/30 underline-offset-2 cursor-pointer">browse files</span>
              </p>
              <div className="flex items-center gap-2 mt-4">
                {['.CSV', '.TSV', '.JSON'].map(ext => (
                  <span key={ext} className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#2a2a4a]/50 text-[#6a6a8a] border border-[#3a3a5a]/30">
                    {ext}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 anim-fade-in">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}
    </div>
  );
}
