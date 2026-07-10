export interface CompanyOutputColumn {
  header: string;
  sourceFields: string[];
}

export interface CompanyOutputSchema {
  id: string;
  name: string;
  aliases: readonly string[];
  columns: CompanyOutputColumn[];
}

export interface CompanyOutputRow {
  key: string;
  cells: string[];
}
