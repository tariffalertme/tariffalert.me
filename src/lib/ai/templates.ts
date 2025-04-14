export interface TemplateVariable {
  name: string;
  required: boolean;
  defaultValue?: any;
}

export interface ContentTemplate {
  userPromptTemplate: string;
  systemPrompt: string;
  defaultParams: any;
  variables: TemplateVariable[];
  outputFormat: {
    structure: string; // JSON string representing expected output structure
  };
} 