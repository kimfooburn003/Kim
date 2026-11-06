export const STATUS_TAGS = ['completed', 'ongoing'] as const;
export const BOOK_TAGS = ['book', 'series'] as const;
export const SOURCE_TAGS = ['amazon', 'audiobook', 'royal-road', 'ao3'] as const;
export type SourceTag = (typeof SOURCE_TAGS)[number];

export const FORMAT_TAGS = [
  'fanfic',
  'webnovel',
  'novel',
  'cn-light-novel',
  'jp-light-novel',
  'kr-light-novel',
  'manga-jp',
  'manhua-cn',
  'manhwa-kr',
] as const;

export type FormatTag = (typeof FORMAT_TAGS)[number];

export function isSquareReviewTag(tag: string): boolean {
  return (
    STATUS_TAGS.includes(tag as (typeof STATUS_TAGS)[number]) ||
    BOOK_TAGS.includes(tag as (typeof BOOK_TAGS)[number]) ||
    SOURCE_TAGS.includes(tag as SourceTag) ||
    FORMAT_TAGS.includes(tag as FormatTag) ||
    /^\d{4}$/.test(tag)
  );
}
