import Handlebars from 'handlebars';
import { ContentTemplate, TemplateVariable } from './templates';

export class TemplateEngine {
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

  public processTemplate(
    template: ContentTemplate,
    variables: Record<string, any>
  ): { prompt: string; systemPrompt: string; params: any } | { error: string } {
    // Validate required variables
    const validation = this.validateVariables(template, variables);
    if (!validation.isValid) {
      return {
        error: `Missing required variables: ${validation.missingVariables.join(', ')}`,
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
        params,
      };
    } catch (error) {
      return {
        error: `Error processing template: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
} 