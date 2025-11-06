import React from 'react';
import { Spinner } from './Spinner';
import { CopyIcon, DownloadIcon, ResetIcon } from './icons';
import type { GeneratedImage } from '../types';
import type { AppState } from '../App';

interface OutputSectionProps {
  masterImage: GeneratedImage | null;
  variations: GeneratedImage[];
  caption: string;
  appState: AppState;
  onStartOver: () => void;
}

const ImageCard: React.FC<{ image: GeneratedImage }> = ({ image }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${image.base64}`;
    link.download = `sparkles-nail-loft-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl shadow-md">
      <img
        src={`data:image/jpeg;base64,${image.base64}`}
        alt="Generated nail art"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <button
          onClick={handleDownload}
          className="bg-white/80 text-purple-600 p-3 rounded-full hover:bg-white backdrop-blur-sm"
          aria-label="Download image"
        >
          <DownloadIcon />
        </button>
      </div>
    </div>
  );
};


export const OutputSection: React.FC<OutputSectionProps> = ({
  masterImage,
  variations,
  caption,
  appState,
  onStartOver,
}) => {
    
  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption.replace(/<br\s*\/?>/gi, '\n'));
  };

  const isLoadingInitial = appState === 'GENERATING_INITIAL';
  const isLoadingVariations = appState === 'GENERATING_VARIATIONS';

  return (
    <div className="lg:w-2/3 w-full bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-pink-100 space-y-6 relative">
      {(masterImage || isLoadingInitial) && (
        <button 
            onClick={onStartOver}
            className="absolute top-4 right-4 flex items-center gap-2 bg-red-100 text-red-600 font-semibold py-2 px-4 rounded-full hover:bg-red-200 transition-colors"
            aria-label="Start Over"
        >
            <ResetIcon />
            Start Over
        </button>
      )}
      
      {/* MASTER IMAGE SECTION */}
      <div>
        <h2 className="text-2xl font-bold text-purple-600 mb-4">2. Master Image</h2>
        <div className="flex items-center justify-center min-h-[300px] bg-pink-50 rounded-xl p-4">
        {isLoadingInitial ? (
          <div className="text-center">
            <Spinner />
            <span className="mt-4 text-gray-600 block">Generating your masterpiece...</span>
          </div>
        ) : masterImage ? (
            <div className="max-w-[300px] w-full">
                <ImageCard image={masterImage} />
            </div>
        ) : (
          <p className="text-gray-500">Your initial image will appear here.</p>
        )}
        </div>
      </div>

      {/* VARIATIONS AND CAPTION SECTION */}
      {(variations.length > 0 || isLoadingVariations || (masterImage && !isLoadingInitial)) && (
        <div className="space-y-6 pt-6 border-t border-pink-200">
            <div>
                <h2 className="text-2xl font-bold text-purple-600 mb-4">3. Generated Variations</h2>
                {isLoadingVariations ? (
                <div className="flex items-center justify-center h-64 bg-pink-50 rounded-xl">
                    <Spinner />
                    <span className="ml-4 text-gray-600">Generating cool variations...</span>
                </div>
                ) : variations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {variations.map(image => (
                    <ImageCard key={image.id} image={image} />
                    ))}
                </div>
                ) : (
                <div className="flex items-center justify-center h-64 bg-pink-50 rounded-xl">
                    <p className="text-gray-500 text-center">Update the prompt and click "Generate All Images" to create variations.</p>
                </div>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold text-purple-600 mb-4">4. Social Media Caption</h2>
                <div className="relative bg-pink-50 p-4 rounded-xl min-h-[150px]">
                {isLoadingVariations ? (
                    <div className="flex items-center justify-center h-full">
                    <Spinner />
                    <span className="ml-4 text-gray-600">Writing a catchy caption...</span>
                    </div>
                ) : caption ? (
                    <>
                    <button
                        onClick={handleCopyCaption}
                        className="absolute top-3 right-3 bg-white text-purple-500 p-2 rounded-full hover:bg-purple-100"
                        aria-label="Copy caption"
                    >
                        <CopyIcon />
                    </button>
                    <p className="text-gray-700 whitespace-pre-line">{caption}</p>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">Your caption will appear here with your image variations.</p>
                    </div>
                )}
                </div>
            </div>
        </div>
      )}

      {!masterImage && !isLoadingInitial && (
         <div className="flex items-center justify-center h-full min-h-[300px]">
            <p className="text-gray-500 text-lg text-center">Your generated content will appear here. <br/> Start by creating your vision!</p>
          </div>
      )}
    </div>
  );
};