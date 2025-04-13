import React, { useState } from 'react';
import { OpenAIService, ContentGenerationParams, GeneratedContent } from '@/lib/services/OpenAIService';
import { templates } from '@/lib/ai/templates';

interface ProductContentGeneratorProps {
  productData: ContentGenerationParams['productData'];
  newsContext?: ContentGenerationParams['newsContext'];
}

export const ProductContentGenerator: React.FC<ProductContentGeneratorProps> = ({
  productData,
  newsContext,
}) => {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('product-analysis');
  const [style, setStyle] = useState<ContentGenerationParams['style']>('formal');
  const [focusAreas, setFocusAreas] = useState<ContentGenerationParams['focusAreas']>(['price_analysis', 'market_impact']);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const openAIService = new OpenAIService();
      const content = await openAIService.generateProductContent({
        productData,
        newsContext,
        style,
        focusAreas,
        templateId: selectedTemplate,
      });
      setGeneratedContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-gray-700">
            Template
          </label>
          <select
            id="template"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {Object.entries(templates).map(([id, template]) => (
              <option key={id} value={id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700">
            Style
          </label>
          <select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value as ContentGenerationParams['style'])}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="analytical">Analytical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Focus Areas</label>
          <div className="mt-2 space-y-2">
            {['price_analysis', 'market_impact', 'recommendations'].map((area) => (
              <label key={area} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={focusAreas?.includes(area as any)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFocusAreas([...(focusAreas || []), area as any]);
                    } else {
                      setFocusAreas(focusAreas?.filter((a) => a !== area) || []);
                    }
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {area.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {generatedContent && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Generated Content</h3>
            <div className="mt-2 p-4 bg-gray-50 rounded whitespace-pre-wrap">
              {generatedContent.content}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Summary</h3>
            <div className="mt-2 p-4 bg-gray-50 rounded">
              {generatedContent.summary}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {generatedContent.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Confidence Score</h3>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${generatedContent.confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 mt-1">
                {Math.round(generatedContent.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 