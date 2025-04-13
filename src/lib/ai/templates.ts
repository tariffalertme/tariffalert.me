export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'array' | 'object';
  defaultValue?: any;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: TemplateVariable[];
  outputFormat: {
    structure: string;
    example: string;
  };
  defaultParams: {
    temperature: number;
    maxTokens: number;
    style?: string;
  };
}

export const templates: Record<string, ContentTemplate> = {
  'product-analysis': {
    id: 'product-analysis',
    name: 'Product Analysis',
    description: 'Detailed analysis of a product including price trends and market impact',
    systemPrompt: `You are a professional product analyst specializing in consumer goods and market trends. 
Your task is to provide detailed, data-driven analysis of products with a focus on:
1. Price history and trends
2. Market positioning
3. Value proposition
4. Consumer impact
Use concrete data points and maintain a professional, analytical tone.`,
    userPromptTemplate: `Analyze the following product:

Product Information:
- Name: {{productName}}
- Current Price: {{currentPrice}}
- Category: {{category}}
- Description: {{description}}

{{#if priceHistory}}
Price History:
{{#each priceHistory}}
- {{date}}: {{price}}
{{/each}}
{{/if}}

{{#if marketContext}}
Market Context:
{{#each marketContext}}
- {{title}}
  {{summary}}
{{/each}}
{{/if}}

Focus on:
{{#each focusAreas}}
- {{this}}
{{/each}}

Style: {{style}}
Required Length: {{targetLength}} words`,
    variables: [
      {
        name: 'productName',
        description: 'Name of the product',
        required: true,
        type: 'string'
      },
      {
        name: 'currentPrice',
        description: 'Current price of the product',
        required: true,
        type: 'number'
      },
      {
        name: 'category',
        description: 'Product category',
        required: true,
        type: 'string'
      },
      {
        name: 'description',
        description: 'Product description',
        required: true,
        type: 'string'
      },
      {
        name: 'priceHistory',
        description: 'Historical price data',
        required: false,
        type: 'array',
        defaultValue: []
      },
      {
        name: 'marketContext',
        description: 'Relevant market information',
        required: false,
        type: 'array',
        defaultValue: []
      },
      {
        name: 'focusAreas',
        description: 'Areas to focus analysis on',
        required: true,
        type: 'array',
        defaultValue: ['price_analysis', 'market_impact']
      }
    ],
    outputFormat: {
      structure: `{
  "analysis": {
    "overview": "string",
    "priceAnalysis": "string",
    "marketImpact": "string",
    "recommendations": "string"
  },
  "keyPoints": ["string"],
  "confidence": "number"
}`,
      example: `{
  "analysis": {
    "overview": "The Product X shows strong market positioning...",
    "priceAnalysis": "Historical price data indicates a steady upward trend...",
    "marketImpact": "Recent market changes have significantly affected...",
    "recommendations": "Based on the analysis, we recommend..."
  },
  "keyPoints": [
    "Price increased 15% over 3 months",
    "Strong market demand in Q2",
    "Competitive advantage in features"
  ],
  "confidence": 0.85
}`
    },
    defaultParams: {
      temperature: 0.7,
      maxTokens: 1000,
      style: 'analytical'
    }
  },
  'impact-assessment': {
    id: 'impact-assessment',
    name: 'Impact Assessment',
    description: 'Assessment of how price changes and market events impact consumers',
    systemPrompt: `You are an economic impact analyst specializing in consumer welfare and market dynamics. 
Your task is to assess the impact of price changes and market events on consumers, considering:
1. Direct cost implications
2. Behavioral changes
3. Long-term effects
4. Mitigation strategies
Maintain an objective, fact-based approach while considering social implications.`,
    userPromptTemplate: `Assess the impact of the following situation:

Market Event:
{{eventDescription}}

Affected Products:
{{#each products}}
- {{name}}: {{priceChange}} change
{{/each}}

Consumer Segments:
{{#each consumerSegments}}
- {{segment}}: {{characteristics}}
{{/each}}

Timeframe: {{timeframe}}
Geographic Scope: {{geography}}

Consider:
{{#each considerationPoints}}
- {{this}}
{{/each}}`,
    variables: [
      {
        name: 'eventDescription',
        description: 'Description of the market event',
        required: true,
        type: 'string'
      },
      {
        name: 'products',
        description: 'Affected products and their price changes',
        required: true,
        type: 'array'
      },
      {
        name: 'consumerSegments',
        description: 'Affected consumer segments',
        required: true,
        type: 'array'
      },
      {
        name: 'timeframe',
        description: 'Time period for analysis',
        required: true,
        type: 'string'
      },
      {
        name: 'geography',
        description: 'Geographic scope of impact',
        required: true,
        type: 'string'
      },
      {
        name: 'considerationPoints',
        description: 'Specific points to consider',
        required: false,
        type: 'array',
        defaultValue: ['economic_impact', 'social_impact', 'behavioral_changes']
      }
    ],
    outputFormat: {
      structure: `{
  "impact": {
    "summary": "string",
    "economicImpact": "string",
    "socialImpact": "string",
    "behavioralChanges": "string",
    "mitigationStrategies": "string"
  },
  "severityScore": "number",
  "timelineProjection": ["string"],
  "recommendations": ["string"]
}`,
      example: `{
  "impact": {
    "summary": "The price increase will significantly affect lower-income households...",
    "economicImpact": "Direct cost increase of 12% for essential goods...",
    "socialImpact": "Potential shift in consumer behavior and social patterns...",
    "behavioralChanges": "Consumers likely to seek alternatives and reduce consumption...",
    "mitigationStrategies": "Recommended strategies include..."
  },
  "severityScore": 7.5,
  "timelineProjection": [
    "Immediate: Sharp reduction in consumption",
    "3 months: Adaptation to new prices",
    "6 months: Market stabilization"
  ],
  "recommendations": [
    "Implement gradual price adjustments",
    "Provide alternatives for affected segments",
    "Monitor long-term impact"
  ]
}`
    },
    defaultParams: {
      temperature: 0.6,
      maxTokens: 1200,
      style: 'formal'
    }
  },
  'content-validation': {
    id: 'content-validation',
    name: 'Content Validation',
    description: 'Validates content quality, readability, and coherence',
    systemPrompt: `You are a content quality analyst. Evaluate the following content for:
1. Coherence and flow
2. Readability and clarity
3. Factual accuracy (based on internal consistency)
4. Writing style and tone
Provide a detailed analysis with specific issues and suggestions.`,
    userPromptTemplate: `Analyze the following content:

Title: {{name}}
Content: {{description}}
Content Type: {{category}}

Provide analysis in the following format:
- Coherence: [analysis]
- Readability: [analysis]
- Factual: [analysis]
- Style: [analysis]

Suggestions:
- [suggestion 1]
- [suggestion 2]
...`,
    variables: [
      {
        name: 'name',
        description: 'Content title',
        required: true,
        type: 'string'
      },
      {
        name: 'description',
        description: 'Content body',
        required: true,
        type: 'string'
      },
      {
        name: 'category',
        description: 'Content type',
        required: true,
        type: 'string'
      }
    ],
    defaultParams: {
      maxTokens: 1000,
      temperature: 0.5
    },
    outputFormat: {
      structure: `{
        "content": "string",
        "summary": "string",
        "tags": ["string"],
        "confidence": "number"
      }`,
      example: `{
        "content": "Coherence: The content flows well with clear transitions between ideas.\nReadability: Text is clear and easy to understand.\nFactual: All statements are internally consistent.\nStyle: Professional and engaging tone.\n\nSuggestions:\n- Consider adding more specific examples\n- Break up longer paragraphs for better readability",
        "summary": "Well-structured content with good readability and coherence. Minor improvements suggested for examples and formatting.",
        "tags": ["coherent", "readable", "professional", "needs-examples"],
        "confidence": 0.85
      }`
    }
  }
}; 