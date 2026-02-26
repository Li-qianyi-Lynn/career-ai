/** Paw print type */
export type PawPrintType = 'reflection' | 'question' | 'topic_for_r2g'

export interface PawPrint {
  id: string
  type: PawPrintType
  content: string
  /** Optional nickname; if empty, display "A little paw" */
  nickname?: string
  createdAt: string
}

export const PAW_PRINT_TYPES: PawPrintType[] = [
  'reflection',
  'question',
  'topic_for_r2g',
]
