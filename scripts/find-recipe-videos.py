"""Choose a YouTube video of a real cook making each Cooking Companion dish (data/chef/*.json):
one narrated in English and, when the recipe gives an Arabic search, one in Arabic. Writes each
pick into the recipe's `video` field and a review list to docs/chef-videos.md.

Needs yt-dlp (pip install yt-dlp) next to this script's Python, e.g.
  python3 -m venv .venv && .venv/bin/pip install yt-dlp
  .venv/bin/python scripts/find-recipe-videos.py <cache.json> [threads]
The cache keeps every search result, so a re-run only searches for what is still missing;
delete a recipe's entry (or its `video` field) to choose again.
"""
import datetime, json, math, os, re, subprocess, sys, unicodedata
import urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

YT = os.environ.get('YT_DLP') or os.path.join(os.path.dirname(sys.executable), 'yt-dlp')
FILES = ['egyptian', 'italian', 'mexican', 'moroccan', 'saudi']
# Long enough to show the dish being cooked (not a Short), short enough to follow along.
MIN_S, MAX_S = 90, 40 * 60
BAD_TITLE = re.compile(
    r'animat|\bai\b|cgi|cartoon|reaction|mukbang|asmr eating|eating show|review|restaurant tour'
    r'|street food tour|vlog|prank|challenge|compilation|موكبانج|تحدي|ردة فعل|تقييم مطعم',
    re.I,
)
# The written recipes are halal: skip videos whose title names pork or lard.
PORK = re.compile(
    r'\bpork\b|\bcerdo\b|\bpuerco\b|pancetta|guanciale|prosciutto|chorizo|carnitas|\blard\b'
    r'|manteca|(?<!beef )\bbacon\b|خنزير',
    re.I,
)
COOKING = re.compile(r'recipe|how to make|homemade|cook|طريقة|عمل|وصفة|تحضير|طبخ|اكلة|أكلة', re.I)
STOP_EN = {'the', 'a', 'and', 'with', 'of', 'in', 'recipe', 'style', 'easy', 'best', 'how', 'to', 'make'}
STOP_AR = {'طريقة', 'عمل', 'وصفة', 'تحضير', 'مع', 'في', 'على', 'من', 'او', 'أو', 'و'}


def fold_ar(text):
    text = unicodedata.normalize('NFD', text)
    text = re.sub(r'[ً-ٰٟـ̀-ͯ]', '', text)
    return text.replace('ة', 'ه').replace('ى', 'ي').lower()


def words(text, lang):
    if lang == 'ar':
        tokens = re.findall(r'[ء-ي]+|[a-z0-9]+', fold_ar(text))
        return {t[2:] if t.startswith('ال') and len(t) > 4 else t for t in tokens} - STOP_AR
    tokens = re.findall(r'[a-z0-9]+', unicodedata.normalize('NFD', text.lower()))
    return set(tokens) - STOP_EN


def run(args, timeout=90):
    out = subprocess.run([YT, '--no-warnings', '--quiet', *args], capture_output=True, text=True,
                         timeout=timeout)
    return out.stdout


def search(query, n=12):
    rows = []
    for line in run([f'ytsearch{n}:{query}', '--flat-playlist', '--dump-json']).splitlines():
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return rows


def score(dish_words, lang, row):
    title = row.get('title') or ''
    duration = row.get('duration') or 0
    if not (MIN_S <= duration <= MAX_S) or BAD_TITLE.search(title) or PORK.search(title):
        return None
    arabic = re.search(r'[\u0621-\u064a]', title)
    # An Arabic pick is shown to Arabic readers: it must be an Arabic video.
    if lang == 'ar' and not arabic:
        return None
    if row.get('live_status') in ('is_live', 'is_upcoming'):
        return None
    have = words(title, lang)
    overlap = len(dish_words & have) / max(1, len(dish_words))
    if overlap < 0.5:
        return None
    s = 5 * overlap + math.log10((row.get('view_count') or 0) + 10)
    if COOKING.search(title):
        s += 1.5
    if 4 * 60 <= duration <= 20 * 60:
        s += 1
    if lang == 'ar' and not re.search(r'[ء-ي]', title):
        s -= 3  # an Arabic pick should be an Arabic video
    if lang == 'en' and re.search(r'[ء-ي]', title):
        s -= 3
    return s


def verify(video_id):
    """oEmbed answers 200 (with the channel) only for a public video that allows embedding."""
    url = 'https://www.youtube.com/oembed?' + urllib.parse.urlencode(
        {'url': f'https://www.youtube.com/watch?v={video_id}', 'format': 'json'})
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            return json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
        return None


def choose(job):
    recipe_id, lang, query, title = job
    # The dish's own name, without the English description in brackets.
    dish_words = words(re.sub(r'\(.*?\)', ' ', title), lang) or words(title, lang)
    ranked, seen = [], set()
    name = re.sub(r'\s*\(.*?\)', '', title).strip()
    extra = [f'{name} recipe', f'how to make {name}'] if lang == 'en' else [f'طريقة عمل {name}']
    for q in [query] + extra:
        for row in search(q):
            vid = row.get('id')
            if not vid or vid in seen:
                continue
            seen.add(vid)
            s = score(dish_words, lang, row)
            if s is not None:
                ranked.append((s, row))
        if len(ranked) >= 3:
            break
    ranked.sort(key=lambda pair: -pair[0])
    runners = [{'id': r['id'], 'title': r.get('title'), 'channel': r.get('channel') or r.get('uploader'),
                'seconds': r.get('duration')} for _, r in ranked[:4]]
    for _, row in ranked[:6]:
        embed = verify(row['id'])
        # Search listings show machine-translated titles; the video's own title decides.
        real = (embed or {}).get('title') or ''
        if embed and (PORK.search(real) or (lang == 'ar') != bool(re.search(r'[\u0621-\u064a]', real))):
            continue
        if embed:
            return recipe_id, lang, {
                'id': row['id'], 'channel': embed.get('author_name') or row.get('channel'),
                'title': embed.get('title') or row.get('title'), 'seconds': int(row['duration']),
                'query': query, 'runnersUp': [r for r in runners if r['id'] != row['id']][:3],
            }
    return recipe_id, lang, None


def main():
    cache_path = sys.argv[1]
    threads = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    try:
        cache = json.load(open(cache_path))
    except FileNotFoundError:
        cache = {}
    collections = {name: json.load(open(f'data/chef/{name}.json')) for name in FILES}
    jobs = []
    for recipes in collections.values():
        for recipe in recipes:
            for lang in ('en', 'ar'):
                query = recipe['videoSearch'].get(lang)
                key = f"{recipe['id']}:{lang}"
                if query and cache.get(key) is None:
                    jobs.append((recipe['id'], lang, query, recipe['title'][lang]))
    print(f'{len(jobs)} searches to run', file=sys.stderr)
    with ThreadPoolExecutor(threads) as pool:
        for recipe_id, lang, pick in pool.map(choose, jobs):
            cache[f'{recipe_id}:{lang}'] = pick
            print(f"{'ok  ' if pick else 'MISS'} {recipe_id}:{lang} "
                  f"{(pick or {}).get('channel', '')[:24]:24} {(pick or {}).get('title', '')[:60]}",
                  file=sys.stderr)
            json.dump(cache, open(cache_path, 'w'), indent=1, ensure_ascii=False)

    rows, with_video = [], 0
    for name, recipes in collections.items():
        for recipe in recipes:
            video = {}
            for lang in ('en', 'ar'):
                pick = cache.get(f"{recipe['id']}:{lang}")
                if pick:
                    video[lang] = {'id': pick['id'], 'channel': pick['channel']}
                    runners = ', '.join(f"[{r['channel']}](https://youtu.be/{r['id']})"
                                        for r in pick.get('runnersUp', []))
                    rows.append(f"| {recipe['id']} | {lang} | [{pick['title']}](https://youtu.be/{pick['id']}) "
                                f"| {pick['channel']} | {round(pick['seconds'] / 60)} min | {runners} |")
                elif recipe['videoSearch'].get(lang):
                    rows.append(f"| {recipe['id']} | {lang} | **none found** | | | |")
            if video:
                recipe['video'] = video
                with_video += 1
            else:
                recipe.pop('video', None)
        with open(f'data/chef/{name}.json', 'w') as out:
            json.dump(recipes, out, indent=2, ensure_ascii=False)
            out.write('\n')
    total = sum(len(r) for r in collections.values())
    doc = ['# Cooking Companion videos: review list', '',
           'Each recipe in `data/chef/` links to a public YouTube video that allows embedding: one narrated',
           'in English and, for most dishes, one in Arabic (shown to Arabic readers). The picks were made',
           'by `scripts/find-recipe-videos.py` from the title, the channel, the length and the views, so',
           'someone should watch each one and swap any that shows another dish: change the `video` field',
           'of the recipe (id and channel) to a runner-up here or any other video, then run `pnpm test`.', '',
           f'Checked on {datetime.date.today().isoformat()}: {with_video} of {total} recipes have a video.', '',
           '| Recipe | Language | Video | Channel | Length | Runners-up |', '|---|---|---|---|---|---|',
           *rows, '']
    open('docs/chef-videos.md', 'w').write('\n'.join(doc))
    print(f'{with_video}/{total} recipes have a video; wrote docs/chef-videos.md', file=sys.stderr)


main()
