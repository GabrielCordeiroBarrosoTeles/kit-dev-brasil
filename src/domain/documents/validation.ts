import type { DocumentIssue, DocumentValidation } from './types';

export const VALID: DocumentValidation = { valid: true };

export const invalid = (issue: DocumentIssue): DocumentValidation => ({ valid: false, issue });

export const isRepeated = (text: string): boolean => text.length > 1 && [...text].every((character) => character === text.charAt(0));
