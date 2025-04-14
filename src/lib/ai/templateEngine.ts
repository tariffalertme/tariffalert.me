import Handlebars from 'handlebars';
import { ContentTemplate, TemplateVariable } from './templates';
import { Logger } from '@/lib/utils/logger';
import { Product, Category, UserProfile, UserPreferences } from '@/types/api';

export interface TemplateData {
  [key: string]: any;
}

interface TemplateContext {
  product?: Product;
  category?: Category;
  user?: UserProfile;
  preferences?: UserPreferences;
  variables: Record<string, string | number | boolean>;
}

interface TemplateFunction {
  (context: TemplateContext): string;
}

interface Template {
  name: string;
  content: string;
  variables: string[];
  render: TemplateFunction;
}

export class TemplateEngine {
  private readonly logger: Logger;
  private templates: Map<string, Template>;

  constructor() {
    this.logger = new Logger('TemplateEngine');
    this.templates = new Map();
  }

  private validateVariables(
    template: ContentTemplate,
    variables: Record<string, any>
  ): { isValid: boolean; missingVariables: string[] } {
    const missingVariables: string[] = [];

    template.variables.forEach((variable: TemplateVariable) => {
      if (variable.required && !variables[variable.name]) {
        missingVariables.push(variable.name);
      }
    });

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  private applyDefaultValues(
    template: ContentTemplate,
    variables: Record<string, any>
  ): Record<string, any> {
    const result = { ...variables };

    template.variables.forEach((variable: TemplateVariable) => {
      if (!result[variable.name] && variable.defaultValue !== undefined) {
        result[variable.name] = variable.defaultValue;
      }
    });

    return result;
  }

  private compileTemplate(template: string, variables: Record<string, any>): string {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(variables);
  }

  private processTemplate(
    template: ContentTemplate,
    variables: Record<string, any>
  ): { prompt: string; systemPrompt: string; params: any } | { error: string } {
    // Validate required variables
    const validation = this.validateVariables(template, variables);
    if (!validation.isValid) {
      return {
        error: `Missing required variables: ${validation.missingVariables.join(', ')}`
      };
    }

    // Apply default values
    const processedVariables = this.applyDefaultValues(template, variables);

    try {
      // Compile the template
      const prompt = this.compileTemplate(template.userPromptTemplate, processedVariables);
      const systemPrompt = template.systemPrompt;
      const params = template.defaultParams;

      return {
        prompt,
        systemPrompt,
        params
      };
    } catch (error) {
      return {
        error: `Error processing template: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public validateOutput(output: any, template: ContentTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const expectedStructure = JSON.parse(template.outputFormat.structure);

    function validateStructure(expected: any, actual: any, path: string = '') {
      if (typeof expected === 'string') {
        if (typeof actual !== typeof expected) {
          errors.push(`Invalid type at ${path}: expected ${typeof expected}, got ${typeof actual}`);
        }
      } else if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) {
          errors.push(`Invalid type at ${path}: expected array, got ${typeof actual}`);
        }
      } else if (typeof expected === 'object') {
        if (typeof actual !== 'object' || actual === null) {
          errors.push(`Invalid type at ${path}: expected object, got ${typeof actual}`);
          return;
        }

        Object.keys(expected).forEach(key => {
          if (!(key in actual)) {
            errors.push(`Missing property at ${path ? `${path}.${key}` : key}`);
          } else {
            validateStructure(
              expected[key],
              actual[key],
              path ? `${path}.${key}` : key
            );
          }
        });
      }
    }

    try {
      validateStructure(expectedStructure, output);
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public formatOutput(output: any, template: ContentTemplate): string {
    try {
      const validation = this.validateOutput(output, template);
      if (!validation.isValid) {
        return `Error: Invalid output format\n${validation.errors.join('\n')}`;
      }

      return JSON.stringify(output, null, 2);
    } catch (error) {
      return `Error formatting output: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  public generatePrompt(templateId: string, data: TemplateData): string {
    try {
      // Get template based on ID
      const template = this.getTemplate(templateId);
      const result = this.processTemplate(template, data);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      return result.prompt;
    } catch (error) {
      this.logger.error('Error generating prompt:', { error, templateId });
      throw error;
    }
  }

  private getTemplate(templateId: string): ContentTemplate {
    const templates: Record<string, ContentTemplate> = {
      countryImpactRecommendations: {
        userPromptTemplate: `
          Analyze the impact of tariff changes and trade relationships for {{countryCode}}:
          
          Trade Statistics:
          - Imports: {{tradeStatistics.imports}}
          - Exports: {{tradeStatistics.exports}}
          - Average Tariff Rate: {{tradeStatistics.averageTariffRate}}
          
          Recent Tariff Changes:
          {{#each tariffChanges}}
          - From {{previousRate}}% to {{newRate}}% (Effective: {{effectiveDate}})
            Affected Categories: {{affectedCategories}}
          {{/each}}
          
          Consumer Segments:
          {{#each consumerSegments}}
          - {{name}}: {{description}}
            Affected Categories: {{affectedCategories}}
          {{/each}}
          
          Trade Relationships:
          {{#each relationships}}
          - {{sourceCountry}} -> {{targetCountry}}: {{relationshipType}} (Impact: {{impactCorrelation}})
          {{/each}}
          
          Overall Impact Score: {{impactScore}}
          
          Based on this data, provide strategic recommendations for businesses and stakeholders.
        `,
        systemPrompt: 'You are an expert trade analyst providing strategic recommendations.',
        defaultParams: {},
        variables: [
          { name: 'countryCode', required: true },
          { name: 'tradeStatistics', required: true },
          { name: 'tariffChanges', required: false },
          { name: 'consumerSegments', required: false },
          { name: 'relationships', required: false },
          { name: 'impactScore', required: true }
        ],
        outputFormat: {
          structure: JSON.stringify({
            recommendations: {
              shortTerm: ['string'],
              longTerm: ['string']
            },
            impactAnalysis: {
              score: 'number',
              factors: ['string']
            }
          })
        }
      }
    };

    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return template;
  }

  private parseVariables(content: string): string[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.slice(2, -2).trim());
  }

  registerTemplate(name: string, content: string): void {
    const variables = this.parseVariables(content);
    const template: Template = {
      name,
      content,
      variables,
      render: (context: TemplateContext) => {
        return this.renderTemplate(content, context);
      }
    };
    this.templates.set(name, template);
  }

  private getVariableValue(path: string, context: TemplateContext): string | number | boolean {
    const parts = path.split('.');
    let value: unknown = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return '';
      }
    }

    return value as string | number | boolean;
  }

  private renderTemplate(content: string, context: TemplateContext): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getVariableValue(path.trim(), context);
      return String(value);
    });
  }

  render(templateName: string, context: TemplateContext): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }
    return template.render(context);
  }
} 