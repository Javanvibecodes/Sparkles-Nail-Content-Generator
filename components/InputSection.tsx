import React, { useState, useRef } from 'react';
import { Spinner } from './Spinner';
import { EnhanceIcon, GenerateIcon, UploadIcon, XIcon, GenerateVariationsIcon } from './icons';
import type { AppState } from '../App';

interface InputSectionProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  referenceImage: File | null;
  setReferenceImage: (file: File | null) => void;
  numImages: number;
  setNumImages: (num: number) => void;
  onEnhance: () => void;
  onPrimaryAction: () => void;
  onGenerateVariations: () => void;
  appState: AppState;
}

export const InputSection: React.FC<InputSectionProps> = ({
  prompt,
  setPrompt,
  referenceImage,
  setReferenceImage,
  numImages,
  setNumImages,
  onEnhance,
  onPrimaryAction,
  onGenerateVariations,
  appState,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEnhanceLoading, setIsEnhanceLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    setImagePreview(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEnhanceClick = async () => {
    setIsEnhanceLoading(true);
    await onEnhance();
    setIsEnhanceLoading(false);
  }

  const isLoading = appState === 'GENERATING_INITIAL' || appState === 'GENERATING_VARIATIONS';
  const isEditing = appState === 'EDITING';
  const primaryActionText = isEditing ? 'Update Image' : 'Generate Initial Image';
  
  return (
    <div className="lg:w-1/3 w-full bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100 space-y-6">
      <h2 className="text-2xl font-bold text-purple-600">1. Create Your Vision</h2>
      
      <div>
        <label className="font-semibold text-gray-700 mb-2 block">Reference Image (Optional)</label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        {!imagePreview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full flex flex-col items-center justify-center border-2 border-dashed border-pink-300 rounded-xl p-8 hover:bg-pink-50 transition-colors disabled:opacity-50"
          >
            <UploadIcon />
            <span className="mt-2 text-sm font-medium text-gray-600">Click to upload an image</span>
          </button>
        ) : (
          <div className="relative">
            <img src={imagePreview} alt="Reference" className="w-full h-auto rounded-xl object-cover" />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-500 hover:bg-red-100 shadow-md"
              aria-label="Remove image"
            >
              <XIcon />
            </button>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="prompt" className="font-semibold text-gray-700 mb-2 block">Prompt (or describe your image)</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'chrome french tips on long almond nails'"
          className="w-full p-3 bg-white border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
          rows={4}
          disabled={isLoading}
        ></textarea>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleEnhanceClick}
          disabled={isLoading || isEnhanceLoading}
          className="flex-grow flex items-center justify-center gap-2 bg-white border-2 border-purple-400 text-purple-600 font-semibold py-2 px-4 rounded-full hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnhanceLoading ? <Spinner /> : <EnhanceIcon />}
          Enhance
        </button>
      </div>

      <button
        onClick={onPrimaryAction}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-cyan-400 text-white font-bold py-3 px-4 rounded-full hover:bg-cyan-500 transition-transform transform hover:scale-105 shadow-lg disabled:bg-gray-400 disabled:cursor-wait"
      >
        {appState === 'GENERATING_INITIAL' ? <Spinner /> : <GenerateIcon />}
        {appState === 'GENERATING_INITIAL' ? 'Generating...' : primaryActionText}
      </button>

      {isEditing && (
        <div className="pt-4 border-t border-pink-200 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="numImages" className="font-semibold text-gray-700">Images to Generate:</label>
            <select
              id="numImages"
              value={numImages}
              onChange={(e) => setNumImages(Number(e.target.value))}
              className="p-2 bg-white border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
              disabled={isLoading}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
           <button
            onClick={onGenerateVariations}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-pink-500 text-white font-bold py-3 px-4 rounded-full hover:bg-pink-600 transition-transform transform hover:scale-105 shadow-lg disabled:bg-gray-400 disabled:cursor-wait"
          >
            {appState === 'GENERATING_VARIATIONS' ? <Spinner /> : <GenerateVariationsIcon />}
            {appState === 'GENERATING_VARIATIONS' ? 'Generating...' : 'Generate All Images'}
          </button>
        </div>
      )}
    </div>
  );
};