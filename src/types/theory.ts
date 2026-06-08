export type BlockType = 'TEXT' | 'INTERACTIVE_FORMULA';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: 'TEXT';
  content: string;
}

export interface InteractiveFormulaBlock extends BaseBlock {
  type: 'INTERACTIVE_FORMULA';
  formula_latex: string;
  tokens_metadata: Record<string, string>;
}

export type ContentBlock = TextBlock | InteractiveFormulaBlock;

export interface Article {
  id: string;
  title: string;
  blocks: ContentBlock[];
}
