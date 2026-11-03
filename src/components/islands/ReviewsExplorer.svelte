 
<script lang="ts">
  import { tick } from 'svelte';
  import type { Post, ReviewTier } from '../../lib/types';
  import ReviewCard from '../ReviewCard.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { captureElement } from '../../lib/screenshot';

  type Layout = 'wide' | 'cover' | 'tier';
  type Props = {
    posts: Post[];
    totalReviews: number;
  };

  type BookFilter = 'all' | 'book' | 'series';
  type CompletionFilter = 'all' | 'completed' | 'ongoing';
  const STATUS_TAGS = ['completed', 'ongoing'] as const;

  const SOURCE_TAGS = ['amazon', 'audiobook', 'royal-road', 'ao3'] as const;
  type SourceTag = (typeof SOURCE_TAGS)[number];
  const SOURCE_LABELS: Record<SourceTag, string> = {
    amazon: 'Amazon',
    audiobook: 'Audiobook',
    'royal-road': 'Royal Road',
    ao3: 'AO3',
  };

 const PROTAGONIST_TAGS = [
    'ensemble-cast',
    'female-lead',
    'male-lead',
    'non-human-lead',
  ] as const;
  type ProtagonistTag = (typeof PROTAGONIST_TAGS)[number];
  const PROTAGONIST_LABELS: Record<ProtagonistTag, string> = {
    'ensemble-cast': 'ensemble cast',
    'female-lead': 'female lead',
    'male-lead': 'male lead',
    'non-human-lead': 'non-human lead',
  };

  const PROGRESSION_TAGS = [
    'poor-to-rich',
   'weak-to-strong',
    'community-building',
    'kingdom-building',
    'dungeon-core',
    'relationship-building',
  ] as const;
  type ProgressionTag = (typeof PROGRESSION_TAGS)[number];
  const PROGRESSION_LABELS: Record<ProgressionTag, string> = {
    'poor-to-rich': 'poor-to-rich',
    'weak-to-strong': 'weak-to-strong',
    'community-building': 'community building',
    'kingdom-building': 'kingdom building',
    'dungeon-core': 'dungeon core',
    'relationship-building': 'relationship building',
  };

  const availableSourceTags = $derived(
    Array.from(
      new Set(
        augmentedPosts
          .flatMap((p) => p.tags)
          .filter((tag): tag is SourceTag => SOURCE_TAGS.includes(tag as SourceTag))
      )
    ).sort()
  );

  const availableProgressionTags = $derived(
    Array.from(
      new Set(
        augmentedPosts
          .flatMap((p) => p.tags)
          .filter((tag): tag is ProgressionTag =>
            PROGRESSION_TAGS.includes(tag as ProgressionTag)
          )
      )
    ).sort()
  );

  const availableYearTags = $derived.by(() =>
    Array.from(
      new Set(
        augmentedPosts.flatMap((post) => {
          const stamp = new Date(post.date);
          const year = Number(stamp.getFullYear());
          return Number.isFinite(year) ? [String(year)] : [];
        })
      )
    ).sort((a, b) => Number(b) - Number(a))
  );

  const currentYear = String(new Date().getFullYear());

  type FormatTag =
    | 'fanfic'
    | 'webnovel'
    | 'novel'
    | 'cn-light-novel'
    | 'jp-light-novel'
    | 'kr-light-novel'
    | 'manga-jp'
    | 'manhua-cn'
    | 'manhwa-kr';

  const FORMAT_TAGS = [
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

  const FORMAT_LABELS: Record<FormatTag, string> = {
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

  const availableFormatTags = $derived(
    Array.from(
      new Set(
        augmentedPosts
          .flatMap((p) => p.tags)
          .filter((tag): tag is FormatTag => FORMAT_TAGS.includes(tag as FormatTag))
      )
    ).sort()
  );

  const availableProtagonistTags = $derived(
    Array.from(
      new Set(
        augmentedPosts
          .flatMap((p) => p.tags)
          .filter((tag): tag is ProtagonistTag =>
            PROTAGONIST_TAGS.includes(tag as ProtagonistTag)
          )
      )
   ).sort()
  );
  
  // single source of truth for the layout options used by the template
  const LAYOUT_OPTIONS: Layout[] = ['cover', 'tier', 'wide'];
  
  let { posts, totalReviews }: Props = $props();

  const TIER_DESCRIPTIONS: Record<ReviewTier, string> = {
    'π': 'I wrote this. Opinion is biased',
    S: 'Adore. Caused severe book hangover, scratched almost every itch!',
    A: 'Amazing! Usually have one or two things that did not land perfectly',
    B: 'Enjoyed, decent to pass the time :)',
    C: 'Kinda meh. Future works might be better with experience',
    D: 'Tried but not for me',
    E: 'Was great, but halfway through, it got questionable',
    F: 'Expectations was not met so dropped with some resentment',
    G: 'On My Radar',
  };

  // Labels reuse the card glow gradients (--grad-* in styling.css, applied
  // by .tier-label in fancy.css). The raw gradients range from near-white
  // (B's silver) to near-black (D's dark red), so each tier also tunes the
  // dark scrim laid over its gradient to keep the white text readable.
  const TIER_LABEL_STYLES: Record<ReviewTier, { grad: string; scrim: number }> = {
    'π': { grad: 'var(--grad-m)', scrim: 0.5 },
    S: { grad: 'var(--grad-s)', scrim: 0.5 },
    A: { grad: 'var(--grad-a)', scrim: 0.5 },
    B: { grad: 'var(--grad-b)', scrim: 0.5 },
    C: { grad: 'var(--grad-c)', scrim: 0.5 },
    D: { grad: 'var(--grad-d)', scrim: 0.5 },
    E: { grad: 'var(--grad-e)', scrim: 0.5 },
    F: { grad: 'var(--grad-f)', scrim: 0.5 },
    G: { grad: 'var(--grad-g)', scrim: 0.5 },
  };

  const LINK_TAG_MAP: Record<string, string> = {
    amazon: 'amazon',
    audible: 'audiobook',
    royal_road: 'royal-road',
    ao3: 'ao3',
  };

  // Augment posts with derived tags (extra link-derived tags + 'completed').
  function withDefaultBookTag(post: Post) {
    return post.tags.includes('book') ? [] : ['book'];
  }

  function withDefaultFormatTag(post: Post) {
    return post.tags.some((tag) => FORMAT_TAGS.includes(tag as FormatTag))
      ? []
      : ['novel'];
  }

  function withDefaultYearTag(post: Post) {
    const date = new Date(post.date);
    const year = Number.isNaN(date.getTime()) ? null : String(date.getFullYear());
    if (!year) return [];
    return post.tags.includes(year) ? [] : [year];
  }

  function withDefaultProtagonistTag(post: Post) {
    return post.tags.some((tag) =>
      PROTAGONIST_TAGS.includes(tag as ProtagonistTag)
    )
      ? []
      : ['male-lead'];
  }
  
  const augmentedPosts = $derived.by(() => {
    return posts.map((post) => {
      const extras: string[] = [];
      for (const link of post.links) {
        const t = LINK_TAG_MAP[link.name];
        if (t) extras.push(t);
      }
  
      const defaultBookTag = withDefaultBookTag(post);
      const defaultFormatTag = withDefaultFormatTag(post);
      const defaultProtagonistTag = withDefaultProtagonistTag(post);
      const defaultYearTag = withDefaultYearTag(post);
  
      const completed =
        !post.tags.includes('ongoing') && !post.tags.includes('completed')
          ? ['completed']
          : [];
  
      return {
        ...post,
        tags: [
          ...post.tags,
          ...extras,
          ...defaultBookTag,
          ...defaultFormatTag,
          ...defaultYearTag,
          ...defaultProtagonistTag,
          ...completed,
        ],
      };
    });
  });

  /*const allTags = $derived(
    Array.from(new Set(augmentedPosts.flatMap((p) => p.tags))).sort()
  );*/
  const SPECIAL_TAGS = [
    ...STATUS_TAGS,
    ...SOURCE_TAGS,
    ...FORMAT_TAGS,
    ...PROTAGONIST_TAGS,
    ...PROGRESSION_TAGS,
    ...availableYearTags,
    'book',
    'series',
  ] as const;
  
  const allTags = $derived(
    Array.from(
      new Set(
        augmentedPosts
          .flatMap((p) => p.tags)
          .filter((tag) => !SPECIAL_TAGS.includes(tag as (typeof SPECIAL_TAGS)[number]))
      )
    ).sort()
  );

  // Initial layout default depends on screen width — guard for SSR.
  const defaultLayout: Layout =
    typeof globalThis !== 'undefined' &&
    (globalThis as { screen?: { width: number } }).screen?.width !== undefined &&
    (globalThis as { screen: { width: number } }).screen.width > 1280
      ? 'wide'
      : 'cover';

  function slugFromAbslink(abslink: string): string {
    return abslink.replace(/\/$/, '').split('/').pop() ?? abslink;
  }

  // Read URL state synchronously so we don't flash unfiltered cards on mount.
  function readInitialState(): {
    layout: Layout;
    byRank: boolean;
    activations: Record<string, boolean>;
    formatActivations: Record<FormatTag, boolean>;
    protagonistActivations: Record<ProtagonistTag, boolean>;
    progressionActivations: Record<ProgressionTag, boolean>;
    yearActivations: Record<string, boolean>;
    searchTerm: string;
    readingList: SvelteSet<string>;
    showReadingList: boolean;
    completionFilter: CompletionFilter;
    sourceActivations: Record<SourceTag, boolean>;
    bookFilter: BookFilter;
  } {
    const out = {
      layout: defaultLayout,
      byRank: true,
      activations: {} as Record<string, boolean>,
      formatActivations: {} as Record<FormatTag, boolean>,
      protagonistActivations: {} as Record<ProtagonistTag, boolean>,
      progressionActivations: {} as Record<ProgressionTag, boolean>,
      yearActivations: {} as Record<string, boolean>,
      searchTerm: '',
      readingList: new SvelteSet<string>(),
      showReadingList: false,
      completionFilter: 'all' as CompletionFilter,
      sourceActivations: {} as Record<SourceTag, boolean>,
      bookFilter: 'series' as BookFilter,
    };
    if (typeof window === 'undefined') return out;
    const params = new URLSearchParams(window.location.search);
    if (params.has('o')) out.byRank = params.get('o') === '1';
    if (params.has('l')) out.layout = params.get('l') as Layout;
    if (params.has('status')) {
      const status = params.get('status');
      if (status === 'completed' || status === 'ongoing') {
        out.completionFilter = status;
      }
    }
    if (params.has('source')) {
      for (const t of params.get('source')!.split('_').filter(Boolean)) {
        if (SOURCE_TAGS.includes(t as SourceTag)) {
          out.sourceActivations[t as SourceTag] = true;
        }
      }
    }
    if (params.has('source-exclude')) {
      for (const t of params.get('source-exclude')!.split('_').filter(Boolean)) {
        if (SOURCE_TAGS.includes(t as SourceTag)) {
          out.sourceActivations[t as SourceTag] = false;
        }
      }
    }
    if (params.has('format')) {
      for (const t of params.get('format')!.split('_').filter(Boolean)) {        
        if (FORMAT_TAGS.includes(t as FormatTag)) {
          out.formatActivations[t as FormatTag] = true;
        }
      }
    }
    if (params.has('protagonist')) {
      for (const t of params.get('protagonist')!.split('_').filter(Boolean)) {
        if (PROTAGONIST_TAGS.includes(t as ProtagonistTag)) {
          out.protagonistActivations[t as ProtagonistTag] = true;
        }
      }
    }
    if (params.has('progression')) {
      for (const t of params.get('progression')!.split('_').filter(Boolean)) {
        if (PROGRESSION_TAGS.includes(t as ProgressionTag)) {
          out.progressionActivations[t as ProgressionTag] = true;
        }
      }
    }
    if (params.has('year')) {
      const year = params
        .get('year')!
        .split('_')
        .find((tag) => availableYearTags.includes(tag));
      if (year) out.yearActivations[year] = true;
    }
    if (
      Object.keys(out.yearActivations).length === 0 &&
      availableYearTags.includes(currentYear)
    ) {
      out.yearActivations[currentYear] = true;
    }
    if (params.has('book')) {
      const book = params.get('book');
      if (book === 'book' || book === 'series') {
        out.bookFilter = book;
      }
    }
    if (params.has('include')) {
      for (const t of params.get('include')!.split('_').filter(Boolean)) {
        out.activations[t] = true;
      }
    }
    if (params.has('exclude')) {
      for (const t of params.get('exclude')!.split('_').filter(Boolean)) {
        out.activations[t] = false;
      }
    }
    if (params.has('reading-list')) {
      const slugs = params.get('reading-list')!.split('~').filter(Boolean);
      out.readingList = new SvelteSet(slugs);
      if (slugs.length > 0) out.showReadingList = true;
    } else if (typeof localStorage !== 'undefined') {
      // Fall back to localStorage if no URL param
      try {
        const stored = localStorage.getItem('reading-list');
        if (stored) {
          out.readingList = new SvelteSet(JSON.parse(stored) as string[]);
        }
      } catch {
        // ignore parse errors
      }
    }
    return out;
  }
  const initial = readInitialState();

  let layout = $state<Layout>(initial.layout);
  let byRank = $state(initial.byRank);
  let tagActivations = $state<Record<string, boolean>>({ ...initial.activations });
  let formatActivations = $state<Record<FormatTag, boolean>>({ ...initial.formatActivations });
  let protagonistActivations = $state<Record<ProtagonistTag, boolean>>({
    ...initial.protagonistActivations,
  });
  let progressionActivations = $state<Record<ProgressionTag, boolean>>({
    ...initial.progressionActivations,
  });
  let yearActivations = $state<Record<string, boolean>>({ ...initial.yearActivations });
  let yearDropdownOpen = $state(false);
  const selectedYear = $derived(
    Object.entries(yearActivations).find(([, active]) => active)?.[0] ?? ''
  );
  let yearDropdownOpen = $state(false);
  const selectedYear = $derived(
    Object.entries(yearActivations).find(([, active]) => active)?.[0] ?? ''
  );
  let searchTerm = $state(initial.searchTerm);
  let readingList = $state<SvelteSet<string>>(initial.readingList);
  let showReadingList = $state(initial.showReadingList);
  let completionFilter = $state<CompletionFilter>(initial.completionFilter);
  let sourceActivations = $state<Record<SourceTag, boolean>>({ ...initial.sourceActivations });
  let bookFilter = $state<BookFilter>(initial.bookFilter);

  // Sync state → URL whenever any of these change.
  $effect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (!byRank) params.set('o', '0');
    if (layout !== defaultLayout) params.set('l', layout);
    if (completionFilter !== 'all') params.set('status', completionFilter);
    if (bookFilter !== 'all') params.set('book', bookFilter);
  
    const sourceInclude: string[] = [];
    const sourceExclude: string[] = [];
    for (const [k, v] of Object.entries(sourceActivations)) {
      if (v === true) sourceInclude.push(k);
      else if (v === false) sourceExclude.push(k);
    }
    if (sourceInclude.length) params.set('source', sourceInclude.join('_'));
    if (sourceExclude.length) params.set('source-exclude', sourceExclude.join('_'));

    const activeFormats = Object.entries(formatActivations)
      .filter(([, active]) => active)
      .map(([tag]) => tag);

    if (activeFormats.length) params.set('format', activeFormats.join('_'));

    const include: string[] = [];
    const exclude: string[] = [];
    for (const [k, v] of Object.entries(tagActivations)) {
      if (v === true) include.push(k);
      else if (v === false) exclude.push(k);
    }
    if (include.length) params.set('include', include.join('_'));
    if (exclude.length) params.set('exclude', exclude.join('_'));

   const activeProtagonists = Object.entries(protagonistActivations)
      .filter(([, active]) => active)
      .map(([tag]) => tag);
    if (activeProtagonists.length) {
      params.set('protagonist', activeProtagonists.join('_'));
    }

    const activeProgressions = Object.entries(progressionActivations)
      .filter(([, active]) => active)
      .map(([tag]) => tag);
    if (activeProgressions.length) params.set('progression', activeProgressions.join('_'));

    const activeYears = Object.entries(yearActivations)
      .filter(([, active]) => active)
      .map(([tag]) => tag);
    if (activeYears.length) params.set('year', activeYears.join('_'));

    const rlSlugs = Array.from(readingList);
    if (rlSlugs.length) params.set('reading-list', rlSlugs.join('~'));
    const args = params.toString();
    const newUrl = `${location.origin}${location.pathname}${args ? '?' + args : ''}`;
    history.pushState({ path: newUrl }, '', newUrl);
  
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('reading-list', JSON.stringify(rlSlugs));
      } catch {
        // ignore storage errors
      }
    }
  });

  function toggleBookmark(slug: string) {
    if (readingList.has(slug)) {
      readingList.delete(slug);
      // Un-bookmarking the last book hides the reading-list toggle, so drop
      // the filter too or the user is stranded on an empty, unescapable view.
      if (readingList.size === 0) showReadingList = false;
    } else {
      readingList.add(slug);
    }
  }

  function clearReadingList() {
    readingList.clear();
    showReadingList = false;
  }

  function clickTag(tag: string) {
    if (tag in tagActivations) {
      if (tagActivations[tag] === true) {
        tagActivations = { ...tagActivations, [tag]: false };
      } else {
        const next = { ...tagActivations };
        delete next[tag];
        tagActivations = next;
      }
    } else {
      tagActivations = { ...tagActivations, [tag]: true };
    }
  }

  function clickProtagonistTag(tag: ProtagonistTag) {
    if (tag in protagonistActivations) {
      if (protagonistActivations[tag] === true) {
        protagonistActivations = { ...protagonistActivations, [tag]: false };
      } else {
        const next = { ...protagonistActivations };
        delete next[tag];
        protagonistActivations = next;
      }
    } else {
      protagonistActivations = { ...protagonistActivations, [tag]: true };
    }
  }

  function clickProgressionTag(tag: ProgressionTag) {
    if (tag in progressionActivations) {
      if (progressionActivations[tag] === true) {
        progressionActivations = { ...progressionActivations, [tag]: false };
      } else {
        const next = { ...progressionActivations };
        delete next[tag];
        progressionActivations = next;
      }
    } else {
      progressionActivations = { ...progressionActivations, [tag]: true };
    }
  }

  function clickFormatTag(tag: FormatTag) {
    if (tag in formatActivations) {
      if (formatActivations[tag] === true) {
        formatActivations = { ...formatActivations, [tag]: false };
      } else {
        const next = { ...formatActivations };
        delete next[tag];
        formatActivations = next;
      }
    } else {
      formatActivations = { ...formatActivations, [tag]: true };
    }
  }

  function clickSourceTag(tag: SourceTag) {
    if (tag in sourceActivations) {
      if (sourceActivations[tag] === true) {
        sourceActivations = { ...sourceActivations, [tag]: false };
      } else {
        const next = { ...sourceActivations };
        delete next[tag];
        sourceActivations = next;
      }
    } else {
      sourceActivations = { ...sourceActivations, [tag]: true };
    }
  }

  function reset() {
    tagActivations = {};
    protagonistActivations = {};
    progressionActivations = {};
    yearActivations = availableYearTags.includes(currentYear)
      ? { [currentYear]: true }
      : {};
    searchTerm = '';
    layout = defaultLayout;
    byRank = true;
    showReadingList = false;
    completionFilter = 'all';
    formatActivations = {};
    sourceActivations = {}; 
    bookFilter = 'series';
  }

  // Screenshot export: capture the whole card list (not just the viewport)
  // and download it as webp. Heavy lifting lives in lib/screenshot.ts, which
  // dynamic-imports snapdom on first use (ADR-011).
  let capturing = $state(false);
  let captureFailed = $state(false);

  async function screenshot() {
    if (capturing || visiblePosts.length === 0) return;
    capturing = true;
    captureFailed = false;
    // Flush the DOM (spinner + .screenshotting neutralization class) and let
    // it paint before capture blocks the main thread.
    await tick();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      // Tier needs the wrapper (all tier rows); wide/cover capture the inner
      // grid to skip the side gutters and the grid's collapsed-out mt-20,
      // which would otherwise misalign the clone.
      const root = document.querySelector<HTMLElement>(
        layout === 'tier' ? '#all-card-wrapper' : '[data-capture-root]'
      );
      if (root) await captureElement(root, layout);
    } catch (err) {
      console.error('Screenshot failed:', err);
      captureFailed = true;
      setTimeout(() => (captureFailed = false), 4000);
    } finally {
      capturing = false;
    }
  }

  const visiblePosts = $derived.by(() => {
    const term = searchTerm.toLowerCase();
    const words = term ? term.split(/\s+/).filter(Boolean) : [];
    return augmentedPosts
      .filter((post) => {
        // Reading list filter
        if (showReadingList && !readingList.has(slugFromAbslink(post.abslink))) {
          return false;
        }
        if (completionFilter === 'completed' && !post.tags.includes('completed')) {
          return false;
        }
        if (completionFilter === 'ongoing' && !post.tags.includes('ongoing')) {
          return false;
        }
        if (bookFilter === 'book' && !post.tags.includes('book')) {
          return false;
        }
        if (bookFilter === 'series' && !post.tags.includes('series')) {
          return false;
        }
        for (const [tag, active] of Object.entries(sourceActivations)) {
          if (active === true && !post.tags.includes(tag)) return false;
          if (active === false && post.tags.includes(tag)) return false;
        }

        for (const [tag, active] of Object.entries(formatActivations)) {
          if (active === true && !post.tags.includes(tag)) return false;
          if (active === false && post.tags.includes(tag)) return false;
        }
        for (const [tag, active] of Object.entries(tagActivations)) {
          if (active === true && !post.tags.includes(tag)) return false;
          if (active === false && post.tags.includes(tag)) return false;
        }
        for (const [tag, active] of Object.entries(protagonistActivations)) {
          if (active === true && !post.tags.includes(tag)) return false;
          if (active === false && post.tags.includes(tag)) return false;
        }
        for (const [tag, active] of Object.entries(progressionActivations)) {
          if (active === true && !post.tags.includes(tag)) return false;
          if (active === false && post.tags.includes(tag)) return false;
        }
        for (const [tag, active] of Object.entries(yearActivations)) {
          const year = String(new Date(post.date).getFullYear());
          if (active === true && year !== tag) return false;
          if (active === false && year === tag) return false;
        }
        if (words.length) {
          for (const w of words) {
            if (!post.search_term.includes(w)) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (layout === 'tier' || byRank) return a.weight - b.weight;
        return a.date < b.date ? 1 : -1;
      });
  });

  const groupedPosts = $derived.by(() => {
    if (layout !== 'tier') return [{ tier: null as ReviewTier | null, posts: visiblePosts }];
    const groups: { tier: ReviewTier; posts: Post[] }[] = [];
    let current: { tier: ReviewTier; posts: Post[] } | null = null;
    for (const post of visiblePosts) {
      if (!current || current.tier !== post.review) {
        current = { tier: post.review, posts: [] };
        groups.push(current);
      }
      current.posts.push(post);
    }
    return groups;
  });

  function activeClass(tag: string): string {
    if (Object.keys(tagActivations).length === 0) return 'active-nan';
    if (tagActivations[tag] === true) return 'active-true';
    if (tagActivations[tag] === false) return 'active-false';
    return 'active-undefined';
  }

  function protagonistChipState(tag: ProtagonistTag): ChipState {
    if (Object.keys(protagonistActivations).length === 0) return 'active-nan';
    if (protagonistActivations[tag] === true) return 'active-true';
    if (protagonistActivations[tag] === false) return 'active-false';
    return 'active-undefined';
  }

  function progressionChipState(tag: ProgressionTag): ChipState {
    if (Object.keys(progressionActivations).length === 0) return 'active-nan';
    if (progressionActivations[tag] === true) return 'active-true';
    if (progressionActivations[tag] === false) return 'active-false';
    return 'active-undefined';
  }

  function yearChipState(tag: string): ChipState {
    if (Object.keys(yearActivations).length === 0) return 'active-nan';
    if (yearActivations[tag] === true) return 'active-true';
    if (yearActivations[tag] === false) return 'active-false';
    return 'active-undefined';
  }

  // Clipboard shortcuts: c, C, x, X — different summary verbosities.
  function shortSummary(post: Post): string {
    let sb = `* **${post.name}**: ([review](${post.abslink}), `;
    for (const link of post.links) sb += `[${link.name}](${link.link}), `;
    return sb.slice(0, -2) + `): ${post.description}\n`;
  }
  function longSummary(post: Post): string {
    let sb = `### **${post.name}** ｜  by *${post.author}*\n\n**Links:** [review](${post.abslink}), `;
    for (const link of post.links) sb += `[${link.name}](${link.link}), `;
    sb = sb.slice(0, -2) + '\n\n';
    sb += `**Summary:** ${post.description}\n\n`;
    sb += `**Hook:** ${post.sentence}\n\n*********\n`;
    return sb;
  }
  function superShortSummary(post: Post): string {
    let sb = `* **${post.name}**: [review](${post.abslink}), `;
    for (const link of post.links) sb += `[${link.name}](${link.link}), `;
    return sb.slice(0, -2) + '\n';
  }
  function superDuperShortSummary(post: Post): string {
    return `* [**${post.name}**](${post.abslink}) by ${post.author}\n`;
  }

  $effect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      // Don't hijack modifier combos (Cmd+S = save page) or typing in the
      // search box / other fields.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        void screenshot();
        return;
      }
      const fns: Record<string, (post: Post) => string> = {
        c: shortSummary,
        C: longSummary,
        x: superShortSummary,
        X: superDuperShortSummary,
      };
      const fn = fns[e.key];
      if (!fn) return;
      const content = visiblePosts.map(fn).join('');
      navigator.clipboard?.writeText(content).catch(() => {});
    };
    window.addEventListener('keypress', handler);
    return () => window.removeEventListener('keypress', handler);
  });

  type ChipState = 'active-true' | 'active-false' | 'active-undefined' | 'active-nan';

  function chipState(active: boolean, anySelected: boolean): ChipState {
    if (active) return 'active-true';
    return anySelected ? 'active-undefined' : 'active-false';
  }
  
  function sourceChipState(tag: SourceTag): ChipState {
    if (Object.keys(sourceActivations).length === 0) return 'active-nan';
    if (sourceActivations[tag] === true) return 'active-true';
    if (sourceActivations[tag] === false) return 'active-false';
    return 'active-undefined';
  }

  function formatChipState(tag: FormatTag): ChipState {
    if (Object.keys(formatActivations).length === 0) return 'active-nan';
    if (formatActivations[tag] === true) return 'active-true';
    if (formatActivations[tag] === false) return 'active-false';
    return 'active-undefined';
  }
  
  function completionChipState(value: CompletionFilter): ChipState {
    return chipState(completionFilter === value, completionFilter !== 'all');
  }
  
  function bookChipState(value: BookFilter): ChipState {
    return chipState(bookFilter === value, bookFilter !== 'all');
  }
</script>

<div id="preamble">
  <p>
    {totalReviews} reviews with <em>my</em> rankings based on what I personally enjoy
    reading. You may have opposite tastes. The below inputs should make finding
    something easier. If you have questions, recommendations, or want to know when
    new reviews or releases are out, join the
    <a
      href="https://discord.gg/tfn4HVEaDz"
      class="font-bold"
      style="color: #7289da"
    >discord</a>.
  </p>
</div>

<div id="toggle-input" class="max-w-7xl mx-auto">
  <div class="justify-center flex flex-wrap items-center">
    {#each LAYOUT_OPTIONS as opt, i (opt)}
      {@const isActive = layout === opt}
      {@const last = LAYOUT_OPTIONS.length - 1}
      {@const rounded = i === 0 ? 'rounded-l-md' : i === last ? 'rounded-r-md' : ''}
      <label
        for={`layout_${opt}`}
        class="inline-flex items-center py-2 rounded-md cursor-pointer"
      >
        <input
          id={`layout_${opt}`}
          checked={isActive}
          name="layout"
          type="radio"
          value={opt}
          class="hidden peer"
          onclick={() => (layout = opt as Layout)}
        />
        <span class="px-4 py-2 text-lg sm:text-base {rounded} {isActive ? 'bg-green-500 text-green-50' : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'}"
          >{opt === 'tier' ? 'Tier List' : opt[0].toUpperCase() + opt.slice(1)}</span
        >
      </label>
    {/each}
   
    <label
      for="sort-order"
      class="pl-4 inline-flex items-center p-2 rounded-md cursor-pointer"
    >
      <input
        id="sort-order"
        type="checkbox"
        checked={byRank}
        class="hidden peer"
        onclick={(e) => (byRank = (e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="px-4 py-2 rounded-l-md text-lg sm:text-base {byRank ? 'bg-green-500 text-green-50' : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'}"
        >Rank</span
      >
      <span class="px-4 py-2 rounded-r-md text-lg sm:text-base {byRank ? 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50' : 'bg-green-500 text-green-50'}"
        >Recent</span
      >
    </label>

    <div class="inline-flex items-center m-2 overflow-hidden rounded-md">
      <button
        type="button"
        class={`px-4 py-2 rounded-l-md text-lg sm:text-base cursor-pointer ${
          bookFilter === 'series'
            ? 'bg-green-500 text-green-50'
            : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'
        }`}
        onclick={() => (bookFilter = bookFilter === 'series' ? 'all' : 'series')}
      >
        Series
      </button>
      <button
        type="button"
        class={`px-4 py-2 rounded-r-md text-lg sm:text-base cursor-pointer ${
          bookFilter === 'book'
            ? 'bg-green-500 text-green-50'
            : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'
        }`}
        onclick={() => (bookFilter = bookFilter === 'book' ? 'all' : 'book')}
      >
        Book
      </button>
    </div>

    <div class="inline-flex items-center m-2 overflow-hidden rounded-md">
      <button
        type="button"
        class={`px-4 py-2 rounded-l-md text-lg sm:text-base cursor-pointer ${
          completionFilter === 'all'
            ? 'bg-green-500 text-green-50'
            : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'
        }`}
        onclick={() => (completionFilter = 'all')}
      >
        All
      </button>
      <button
        type="button"
        class={`px-4 py-2 text-lg sm:text-base cursor-pointer ${
          completionFilter === 'completed'
            ? 'bg-green-500 text-green-50'
            : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'
        }`}
        onclick={() =>
          (completionFilter = completionFilter === 'completed' ? 'all' : 'completed')}
      >
        Completed
      </button>
      <button
        type="button"
        class={`px-4 py-2 rounded-r-md text-lg sm:text-base cursor-pointer ${
          completionFilter === 'ongoing'
            ? 'bg-green-500 text-green-50'
            : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'
        }`}
        onclick={() =>
          (completionFilter = completionFilter === 'ongoing' ? 'all' : 'ongoing')}
      >
        Ongoing
      </button>
    </div>

   <div class="year-dropdown">
      <button
        id="year-filter"
        type="button"
        class="year-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={yearDropdownOpen}
        onclick={() => (yearDropdownOpen = !yearDropdownOpen)}
      >
        {selectedYear || 'All years'}
      </button>
      {#if yearDropdownOpen}
        <div class="year-dropdown-options" role="listbox" aria-labelledby="year-filter">
          <button
            type="button"
            role="option"
            aria-selected={!selectedYear}
            onclick={() => {
              yearActivations = {};
              yearDropdownOpen = false;
            }}
          >
            All years
          </button>
          {#each availableYearTags as year}
            <button
              type="button"
              role="option"
              aria-selected={selectedYear === year}
              onclick={() => {
                yearActivations = { [year]: true };
                yearDropdownOpen = false;
              }}
            >
              {year}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <input
      oninput={(e) => (searchTerm = (e.currentTarget as HTMLInputElement).value)}
      type="text"
      id="search-input"
      name="search"
      bind:value={searchTerm}
      class="bg-green-700 rounded-md text-green-400 m-2 focus:text-green-100 outline-none focus:ring-2 focus:ring-green-400"
      placeholder="Search..."
    />
    {#if readingList.size > 0}
      <div class="inline-flex items-center m-2 overflow-hidden rounded-md">
        <button
          type="button"
          class={`inline-flex items-center gap-1 px-4 py-2 cursor-pointer text-lg sm:text-base ${          
            showReadingList
              ? 'bg-green-500 text-green-50'
              : 'bg-green-700 text-green-300 hover:bg-green-500 hover:text-green-50'
          } rounded-l-md`}
          onclick={() => (showReadingList = !showReadingList)}
          title={showReadingList ? 'Show all reviews' : 'Show reading list only'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 26"
            width="16"
            height="16"
            fill={showReadingList ? 'currentColor' : 'none'}
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="inline-block"
          >
            <path d="M5 2a2 2 0 0 0-2 2v20l9-4 9 4V4a2 2 0 0 0-2-2H5z" />
          </svg>
          Show TBR List ({readingList.size})
        </button>
    
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 bg-accent-700 text-cream-200 hover:bg-accent-600 cursor-pointer rounded-r-md text-lg sm:text-base"
          onclick={clearReadingList}
          title="Remove all books from your reading list"
        >
          Clear TBR List
        </button>
      </div>
    {/if}
    <button
      type="button"
      class="inline-flex items-center gap-2 m-2 px-4 py-2 h-[38px] sm:h-[38px] bg-green-700 hover:bg-green-500 disabled:hover:bg-green-700 rounded-md cursor-pointer disabled:cursor-default text-green-50 disabled:opacity-50"
      onclick={screenshot}
      disabled={capturing || visiblePosts.length === 0}
      title="Screenshot"
      aria-label="Download a screenshot of the current view"
    >
      {#if capturing}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
          class="animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Capturing…
      {:else if captureFailed}
        Failed — retry
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
          />
          <circle cx="12" cy="13" r="4" />
        </svg>
      {/if}
    </button>    
    <button
      type="button"
      class="inline-flex items-center m-2 px-4 py-2 bg-accent-500/70 hover:bg-accent-500 rounded-md cursor-pointer text-cream-200 text-lg sm:text-base"
      onclick={reset}
    >
      Reset
    </button>
  </div>
</div>

<div id="tags" class="tag-list max-w-7xl mx-auto mb-5">  
  {#each availableSourceTags as tag}
    <button
      type="button"
      class={`filter-chip source-chip ${sourceChipState(tag)} hover:cursor-pointer text-base sm:text-sm`}
      onclick={() => clickSourceTag(tag)}
    >
      <span>{SOURCE_LABELS[tag]}</span>
    </button>
  {/each}  

  {#each availableFormatTags as tag}
    <button
      type="button"
      class={`filter-chip format-chip ${formatChipState(tag)} hover:cursor-pointer text-base sm:text-sm`}
      onclick={() => clickFormatTag(tag)}
    >
      <span>{FORMAT_LABELS[tag]}</span>
    </button>
  {/each}
</div>

<div id="tags" class="tag-list max-w-7xl mx-auto mt-5 ">
  {#each allTags as tag (tag)}
    <button
      type="button"
      class="tag tag-{tag} {activeClass(tag)} hover:cursor-pointer text-base sm:text-sm"
      onclick={() => clickTag(tag)}
    >
      <span>{tag}</span>
    </button>
  {/each}

  {#each availableProgressionTags as tag}
    <button
      type="button"
      class={`filter-chip progression-chip ${progressionChipState(tag)} hover:cursor-pointer text-base sm:text-sm`}
      onclick={() => clickProgressionTag(tag)}
    >
       <span>{PROGRESSION_LABELS[tag]}</span>
    </button>
  {/each}

  {#each availableProtagonistTags as tag}
    <button
       type="button"
       class={`filter-chip protagonist-chip ${protagonistChipState(tag)} hover:cursor-pointer text-base sm:text-sm`}
       onclick={() => clickProtagonistTag(tag)}
     >
       <span>{PROTAGONIST_LABELS[tag]}</span>
     </button>
  {/each}
</div>

{#snippet cards(posts: Post[])}
  {#each posts as post (post.link)}
    <!-- No bookmark button in tier mode: the 150px tiles are too small
         for the overlay and the board should read as covers only. -->
    <ReviewCard
      {post}
      {layout}
      isBookmarked={readingList.has(slugFromAbslink(post.abslink))}
      onToggleBookmark={layout === 'tier' ? undefined : toggleBookmark}
    />
  {/each}
{/snippet}

<div
  id="all-card-wrapper"
  class="{layout === 'tier' ? 'mt-8 flex flex-col gap-1' : ''}
         {capturing ? 'screenshotting' : ''}"
>
  {#each groupedPosts as group, gi (group.tier ?? gi)}
    {#if layout === 'tier' && group.tier}
      <!-- overflow-clip (not -hidden) so the sticky label still works:
           overflow:hidden makes this row the sticky element's scroll
           container, which never scrolls, so the label would never stick. -->
      <section
        class="tier-row flex rounded-md overflow-clip bg-green-800/50"
        aria-label="Tier {group.tier}"
      >
        <div
          class="tier-label flex-none w-16 sm:w-28 flex flex-col justify-center"
          style:--tier-grad={TIER_LABEL_STYLES[group.tier].grad}
          style:--tier-scrim={TIER_LABEL_STYLES[group.tier].scrim}
        >
          <!-- Sticky keeps the tier letter visible while scrolling tall
               tiers (C spans several screens). Both insets matter: bottom-4
               pins the (flex-centered, so initially below the fold) label
               near the viewport bottom while entering a tall row, top-4
               takes over when scrolling past. Small offsets only — a large
               one (e.g. 40vh) shoves the label of short rows that sit above
               the line to the cell bottom instead of centering. -->
          <div class="sticky top-4 bottom-4 flex flex-col items-center gap-1 p-2 text-center">
            <span class="text-3xl sm:text-5xl font-bold text-green-50">{group.tier}</span>
            <span class="sr-only sm:not-sr-only text-sm leading-tight text-green-50/80">
              {TIER_DESCRIPTIONS[group.tier]}
            </span>
          </div>
        </div>
        <div
          class="tier-grid grow grid content-start gap-1 px-1
                 grid-cols-3 sm:grid-cols-cover-cards-tier"
        >
          {@render cards(group.posts)}
        </div>
      </section>
    {:else}
      {@const cols =
        layout === 'wide'
          ? 'sm:grid-cols-wide-cards grid-cols-wide-cards-mobile'
          : 'grid-cols-cover-cards-mobile sm:grid-cols-cover-cards'}
      <div
        data-capture-root
        class="container mx-auto justify-center grid mt-20 gap-4 sm:gap-12 {cols}"
      >
        {@render cards(group.posts)}
      </div>
    {/if}
  {/each}
</div>
