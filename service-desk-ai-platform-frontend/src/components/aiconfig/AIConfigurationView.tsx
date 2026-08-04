import React, { useState } from 'react';
import { AIModelConfig } from '../../types';
import {
  Cpu,
  Database,
  Sliders,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Layers,
  Zap,
} from 'lucide-react';

interface AIConfigurationViewProps {
  config: AIModelConfig;
  onUpdateConfig: (cfg: AIModelConfig) => void;
}

export const AIConfigurationView: React.FC<AIConfigurationViewProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [provider, setProvider] = useState(config.llmProvider);
  const [modelName, setModelName] = useState(config.llmModelName);
  const [embeddingModel, setEmbeddingModel] = useState(config.embeddingModel);
  const [indexName, setIndexName] = useState(config.pineconeIndexName);
  const [chunkSize, setChunkSize] = useState(config.chunkSize);
  const [chunkOverlap, setChunkOverlap] = useState(config.chunkOverlap);
  const [temperature, setTemperature] = useState(config.temperature);
  const [similarityThreshold, setSimilarityThreshold] = useState(config.similarityThreshold);
  const [topK, setTopK] = useState(config.topK);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      llmProvider: provider,
      llmModelName: modelName,
      embeddingModel,
      pineconeIndexName: indexName,
      chunkSize,
      chunkOverlap,
      temperature,
      similarityThreshold,
      topK,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-pink-500" />
            <span>AI Model & Pinecone Vector Database Configuration</span>
          </h1>
          <p className="text-xs text-slate-500">
            Tune LLM reasoning models, vector embeddings, chunk size, cosine similarity threshold, and RAG prompt templates.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settings Saved!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM & Embeddings Settings */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>LLM Provider & Model Selection</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">AI Provider</label>
              <select
                value={provider}
                onChange={(e: any) => setProvider(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none"
              >
                <option value="Gemini">Google Gemini (Recommended)</option>
                <option value="Claude">Anthropic Claude</option>
                <option value="OpenAI">OpenAI GPT-4o</option>
                <option value="Azure OpenAI">Azure OpenAI Enterprise</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Primary LLM Model</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Embedding Model</label>
              <input
                type="text"
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Temperature ({temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Pinecone Vector Index Settings */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Pinecone Vector Database Tuning</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pinecone Index Name</label>
              <input
                type="text"
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cosine Similarity Threshold ({similarityThreshold})</label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.01"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chunk Size (Tokens)</label>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Top-K Vectors ({topK})</label>
                <input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-lg text-xs shadow-md transition-colors"
        >
          Save Configuration Changes
        </button>
      </div>
    </div>
  );
};
