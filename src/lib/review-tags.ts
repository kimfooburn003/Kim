export const STATUS_TAGS = ['completed', 'ongoing'] as const;
export type StatusTag = (typeof STATUS_TAGS)[number];
export const DEFAULT_STATUS_TAG: StatusTag = 'completed';
export const BOOK_TAG = 'book' as const;
export const SERIES_TAG = 'series' as const;
export const BOOK_TAGS = [BOOK_TAG, SERIES_TAG] as const;
export type BookTag = (typeof BOOK_TAGS)[number];
export const SOURCE_TAGS = ['amazon', 'audiobook', 'royal-road', 'ao3'] as const;
export type SourceTag = (typeof SOURCE_TAGS)[number];
export const SOURCE_LABELS: Record<SourceTag, string> = {
  amazon: 'Amazon',
  audiobook: 'Audiobook',
  'royal-road': 'Royal Road',
  ao3: 'AO3',
};
export const LINK_TAG_MAP: Record<string, SourceTag> = {
  amazon: 'amazon',
  audible: 'audiobook',
  royal_road: 'royal-road',
  ao3: 'ao3',
};

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
// Keep this group order aligned with the filter-group order in ReviewsExplorer.
// The tag arrays above determine the order within each group.
const SQUARE_TAG_GROUP_ORDER = [
  BOOK_TAGS,
  STATUS_TAGS,
  SOURCE_TAGS,
  FORMAT_TAGS,  
] as const;

const squareTagRanks = new Map(
  SQUARE_TAG_GROUP_ORDER.flatMap((group, groupIndex) =>
    group.map((tag, tagIndex) => [tag, [groupIndex, tagIndex]] as const),
  ),
);
export const FORMAT_LABELS: Record<FormatTag, string> = {
  fanfic: 'fanfic',
  webnovel: 'webnovel',
  novel: 'novel',
  'cn-light-novel': 'cn light novel',
  'jp-light-novel': 'jp light novel',
  'kr-light-novel': 'kr light novel',
  'manga-jp': 'manga (jp)',
  'manhua-cn': 'manhua (cn)',
  'manhwa-kr': 'manhwa (kr)',
};
export const DEFAULT_FORMAT_TAG: FormatTag = 'novel';

export const PROTAGONIST_TAGS = [
  'ensemble-cast',
  'female-lead',
  'male-lead',
  'non-human-lead',
] as const;
export type ProtagonistTag = (typeof PROTAGONIST_TAGS)[number];
export const PROTAGONIST_LABELS: Record<ProtagonistTag, string> = {
  'ensemble-cast': 'ensemble cast',
  'female-lead': 'female lead',
  'male-lead': 'male lead',
  'non-human-lead': 'non-human lead',
};
export const DEFAULT_PROTAGONIST_TAG: ProtagonistTag = 'male-lead';

export const PROGRESSION_TAGS = [
  'poor-to-rich',
  'weak-to-strong',
  'community-building',
  'kingdom-building',
  'dungeon-core',
 'relationship-building',
] as const;
export type ProgressionTag = (typeof PROGRESSION_TAGS)[number];
export const PROGRESSION_LABELS: Record<ProgressionTag, string> = {
  'poor-to-rich': 'poor-to-rich',
  'weak-to-strong': 'weak-to-strong',
  'community-building': 'community building',
  'kingdom-building': 'kingdom building',
  'dungeon-core': 'dungeon core',
  'relationship-building': 'relationship building',
};

export function isSquareReviewTag(tag: string): boolean {
  return (
    STATUS_TAGS.includes(tag as StatusTag) ||
    BOOK_TAGS.includes(tag as BookTag) ||
    SOURCE_TAGS.includes(tag as SourceTag) ||
    FORMAT_TAGS.includes(tag as FormatTag) ||
    /^\d{4}$/.test(tag)
  );
}

export function sortReviewTags(tags: string[]): string[] {
  return [...tags].sort((a, b) => {
    const aSquare = isSquareReviewTag(a);
    const bSquare = isSquareReviewTag(b);

    // Keep rounded tags first, preserving their original order.
    if (aSquare !== bSquare) return Number(aSquare) - Number(bSquare);
    if (!aSquare) {
      const group = (tag: string) =>
        PROGRESSION_TAGS.includes(tag as ProgressionTag)
          ? 1
          : PROTAGONIST_TAGS.includes(tag as ProtagonistTag)
            ? 2
            : 0;

      const groupDifference = group(a) - group(b);
      if (groupDifference !== 0) return groupDifference;
      return a < b ? -1 : a > b ? 1 : 0;
    }

    // The explorer lists years newest first, between status and source tags.
    const aYear = /^\d{4}$/.test(a);
    const bYear = /^\d{4}$/.test(b);
    if (aYear && bYear) return Number(b) - Number(a);
    if (aYear) return squareTagRanks.get(b)?.[0] >= 2 ? -1 : 1;
    if (bYear) return squareTagRanks.get(a)?.[0] >= 2 ? 1 : -1;

    const [aGroup, aIndex] = squareTagRanks.get(a) ?? [Infinity, Infinity];
    const [bGroup, bIndex] = squareTagRanks.get(b) ?? [Infinity, Infinity];
    return aGroup - bGroup || aIndex - bIndex;
  });
}


