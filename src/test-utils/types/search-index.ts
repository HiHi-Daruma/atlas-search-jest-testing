export interface SearchIndexDefinition {
  name: string;
  definition: {
    mappings: {
      dynamic: boolean;
      fields: Record<string, unknown>;
    };
  };
}

export interface SearchIndexStatus {
  name: string;
  status?: string;
}
