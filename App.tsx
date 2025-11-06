import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import * as geminiService from './services/geminiService';
import type { GeneratedImage } from './types';
import { ApiKeyModal } from './components/ApiKeyModal';

export type AppState = 'IDLE' | 'GENERATING_INITIAL' | 'EDITING' | 'GENERATING_VARIATIONS';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [numImages, setNumImages] = useState<number>(5);
  
  const [masterImage, setMasterImage] = useState<GeneratedImage | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedImage[]>([]);
  const [caption, setCaption] = useState<string>('');

  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const handleApiKeySubmit = (key: string) => {
    if (key.trim()) {
      setApiKey(key.trim());
    }
  };

  const handleStartOver = useCallback(() => {
    setPrompt('');
    setReferenceImageFile(null);
    setMasterImage(null);
    setGeneratedVariations([]);
    setCaption('');
    setError(null);
    setAppState('IDLE');
  }, []);

  const handleEnhancePrompt = useCallback(async () => {
    if (!apiKey) {
      setError('API Key is missing.');
      return;
    }
    if (!prompt && !referenceImageFile) {
      setError('Please provide a prompt or an image to enhance.');
      return;
    }
    setError(null);
    // A temporary loading state for enhance is better handled in the component
    try {
      const enhancedPrompt = await geminiService.enhancePrompt(apiKey, referenceImageFile, prompt);
      setPrompt(enhancedPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance prompt.');
    }
  }, [apiKey, prompt, referenceImageFile]);

  const handlePrimaryAction = useCallback(async () => {
    if (!apiKey) {
      setError('API Key is missing.');
      return;
    }
    if (!prompt && !referenceImageFile) {
      setError('A prompt or reference image is required to generate an image.');
      return;
    }
    setError(null);
    setGeneratedVariations([]);
    setCaption('');

    // GENERATE INITIAL IMAGE
    if (appState === 'IDLE') {
      setAppState('GENERATING_INITIAL');
      try {
        const finalPrompt = prompt || await geminiService.enhancePrompt(apiKey, referenceImageFile, '');
        if (prompt === '') setPrompt(finalPrompt);

        const imageB64 = await geminiService.generateInitialImage(apiKey, finalPrompt, referenceImageFile);
        setMasterImage({ id: `master-${Date.now()}`, base64: imageB64 });
        setAppState('EDITING');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate initial image.');
        setAppState('IDLE');
      }
    } 
    // EDIT/UPDATE MASTER IMAGE
    else if (appState === 'EDITING' && masterImage) {
        setAppState('GENERATING_INITIAL'); // Re-use the initial loading state for editing
        try {
            const masterImagePart = { inlineData: { mimeType: 'image/jpeg', data: masterImage.base64 } };
            const imageB64 = await geminiService.editImage(apiKey, prompt, masterImagePart, referenceImageFile);
            setMasterImage({ id: `master-${Date.now()}`, base64: imageB64 });
            setAppState('EDITING');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to edit image.');
            setAppState('EDITING');
        }
    }
  }, [apiKey, prompt, referenceImageFile, appState, masterImage]);

  const handleGenerateVariations = useCallback(async () => {
    if (!apiKey) {
      setError('API Key is missing.');
      return;
    }
    if (!masterImage) {
        setError('A master image is required to generate variations.');
        return;
    }
    setError(null);
    setGeneratedVariations([]);
    setCaption('');
    setAppState('GENERATING_VARIATIONS');
    try {
        const masterImagePart = { inlineData: { mimeType: 'image/jpeg', data: masterImage.base64 } };
        const variations = await geminiService.generateImageVariations(apiKey, masterImagePart, numImages);
        setGeneratedVariations(variations.map((base64, index) => ({ id: `var-${index}-${Date.now()}`, base64 })));
        
        const newCaption = await geminiService.generateCaption(apiKey, prompt);
        setCaption(newCaption);

    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate image variations.');
    } finally {
        setAppState('EDITING');
    }
  }, [apiKey, masterImage, numImages, prompt]);
  
  const handleImageFileChange = async (file: File | null) => {
    // Starting over with a new reference image
    handleStartOver();
    setReferenceImageFile(file);
  };

  if (!apiKey) {
    return <ApiKeyModal onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-purple-50 to-rose-100 text-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <InputSection
            prompt={prompt}
            setPrompt={setPrompt}
            referenceImage={referenceImageFile}
            setReferenceImage={handleImageFileChange}
            numImages={numImages}
            setNumImages={setNumImages}
            onEnhance={handleEnhancePrompt}
            onPrimaryAction={handlePrimaryAction}
            onGenerateVariations={handleGenerateVariations}
            appState={appState}
          />
          <OutputSection
            masterImage={masterImage}
            variations={generatedVariations}
            caption={caption}
            appState={appState}
            onStartOver={handleStartOver}
          />
        </div>
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-xl animate-pulse" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="absolute top-1 right-2 text-lg">&times;</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;