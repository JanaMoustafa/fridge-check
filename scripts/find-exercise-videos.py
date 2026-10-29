"""Find a real-person demonstration video (2 min or under, public, embeddable) on YouTube for
every BurnToReturn exercise, then write the app's data file and a review list for a coach.

Needs yt-dlp (pip install yt-dlp) next to this script's Python, e.g.
  python3 -m venv .venv && .venv/bin/pip install yt-dlp
  .venv/bin/python scripts/find-exercise-videos.py find <exercises.json> <found.json> [threads]
  .venv/bin/python scripts/find-exercise-videos.py emit <found.json> <exercises.json>
exercises.json comes from: pnpm exec tsx -e "..." (see docs/burn-videos.md). `find` keeps what an
earlier run found and only fills gaps; `emit` writes data/burn/videos.json and docs/burn-videos.md.

Usage: find-exercise-videos.py find <exercises.json> <out.json> [threads]
  exercises.json: [{"id": "c-squat", "name": "Bodyweight squat", "style": "calisthenics"}, ...]
  out.json: {"<id>": {videoId, title, channel, durationSeconds, views, checkedOn, query, alternatives:[...]}}
Previously found entries in out.json are kept (re-run only fills the gaps).
"""
import json, math, os, re, subprocess, sys, datetime
from concurrent.futures import ThreadPoolExecutor

YT = os.environ.get('YT_DLP') or os.path.join(os.path.dirname(sys.executable), 'yt-dlp')
STOP = {'the', 'a', 'with', 'and', 'to', 'of', 'on', 'machine', 'exercise', 'hold', 'progression', 'series', 'variation'}
BAD_TITLE = re.compile(r'animat|\bai\b|cgi|\b3d\b|cartoon|reaction|fails?\b|funny|challenge', re.I)
MAX_S, MIN_S = 120, 12
STYLE_HINT = {'pilates': 'pilates', 'crossfit': 'crossfit', 'gym': 'gym', 'calisthenics': 'bodyweight'}

def words(s):
    return {w for w in re.findall(r'[a-z0-9]+', s.lower()) if w not in STOP}

def run(args, timeout=60):
    out = subprocess.run([YT, '--no-warnings', '--quiet', *args], capture_output=True, text=True, timeout=timeout)
    return out.stdout

def search(query, n=10):
    rows = []
    for line in run([f'ytsearch{n}:{query}', '--flat-playlist', '--dump-json']).splitlines():
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return rows

def score(name, row):
    title = row.get('title') or ''
    dur = row.get('duration') or 0
    if not (MIN_S <= dur <= MAX_S) or BAD_TITLE.search(title) or row.get('live_status') == 'is_live':
        return None
    need, have = words(name), words(title)
    overlap = len(need & have) / max(1, len(need))
    s = 4 * overlap
    if overlap == 1:
        s += 2
    s += math.log10((row.get('view_count') or 0) + 10)
    if 20 <= dur <= 90:
        s += 1
    if re.search(r'how to|form|technique|tutorial|proper', title, re.I):
        s += 1
    return s

def verify(video_id, row):
    """YouTube's oEmbed answers 200 (with the canonical title and channel) only for a public video
    that allows embedding; anything else is an error. Duration comes from the search listing."""
    import urllib.request, urllib.parse, urllib.error
    url = 'https://www.youtube.com/oembed?' + urllib.parse.urlencode({'url': f'https://www.youtube.com/watch?v={video_id}', 'format': 'json'})
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            j = json.load(r)
    except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
        return None
    dur = row.get('duration')
    if not dur or dur > MAX_S:
        return None
    return {'id': video_id, 'title': j.get('title') or row.get('title'), 'channel': j.get('author_name') or row.get('channel') or row.get('uploader'), 'duration': dur, 'view_count': row.get('view_count')}

def find(ex):
    name, style = ex['name'], ex.get('style', '')
    queries = [f'{name} exercise how to', f'{STYLE_HINT.get(style, "")} {name} proper form'.strip()]
    seen, ranked = set(), []
    for q in queries:
        for row in search(q):
            vid = row.get('id')
            if not vid or vid in seen:
                continue
            seen.add(vid)
            s = score(name, row)
            if s is not None:
                ranked.append((s, row))
    ranked.sort(key=lambda t: -t[0])
    alternatives = [{'videoId': r['id'], 'title': r.get('title'), 'channel': r.get('channel') or r.get('uploader'), 'durationSeconds': r.get('duration'), 'views': r.get('view_count')} for _, r in ranked[:5]]
    for _, row in ranked[:4]:
        j = verify(row['id'], row)
        if j:
            return ex['id'], {
                'videoId': j['id'], 'title': j.get('title'), 'channel': j.get('channel'),
                'durationSeconds': int(j['duration']), 'views': j.get('view_count'),
                'checkedOn': datetime.date.today().isoformat(), 'query': queries[0],
                'alternatives': [a for a in alternatives if a['videoId'] != j['id']],
            }
    return ex['id'], None

def emit(found_path, exercises_path):
    """The lean data the app ships, and the coach's review list (with the runner-up picks)."""
    found = json.load(open(found_path))
    exercises = json.load(open(exercises_path))
    lean = {}
    rows = []
    for ex in exercises:
        v = found.get(ex['id'])
        if not v:
            rows.append(f"| {ex['id']} | {ex['name']} | **none found** | | | |")
            continue
        lean[ex['id']] = {k: v[k] for k in ('videoId', 'title', 'channel', 'durationSeconds', 'checkedOn')}
        alts = ', '.join(f"[{a['channel']}](https://youtu.be/{a['videoId']}) ({a['durationSeconds']:.0f} s)" for a in v.get('alternatives', [])[:3])
        rows.append(f"| {ex['id']} | {ex['name']} | [{v['title']}](https://youtu.be/{v['videoId']}) | {v['channel']} | {v['durationSeconds']} s | {alts} |")
    json.dump(lean, open('data/burn/videos.json', 'w'), indent=1, ensure_ascii=False)
    open('data/burn/videos.json', 'a').write('\n')
    doc = ['# BurnToReturn exercise videos: coach review', '',
           'Every exercise links to a public YouTube video of a real trainer, two minutes or under, that',
           'allows embedding. The picks were made by `scripts/find-exercise-videos.py` from the title, the',
           'channel and the length, so a coach should watch each one and swap any that shows poor form or',
           'the wrong exercise: change its `videoId` in `data/burn/videos.json` (and the title, channel and',
           'length) to one of the runners-up here or any other video that meets the rules, then run',
           '`pnpm test`. To refresh the whole list, see the script.', '',
           f'Checked on {datetime.date.today().isoformat()}: {len(lean)} of {len(exercises)} exercises have a video.', '',
           '| Exercise id | Exercise | Video | Channel | Length | Runners-up |', '|---|---|---|---|---|---|', *rows, '']
    open('docs/burn-videos.md', 'w').write('\n'.join(doc))
    print(f'wrote data/burn/videos.json ({len(lean)} videos) and docs/burn-videos.md', file=sys.stderr)

def main():
    if sys.argv[1] == 'emit':
        return emit(sys.argv[2], sys.argv[3])
    src, dst = sys.argv[2], sys.argv[3]
    threads = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    exercises = json.load(open(src))
    try:
        found = json.load(open(dst))
    except FileNotFoundError:
        found = {}
    todo = [e for e in exercises if not found.get(e['id'])]
    print(f'{len(exercises)} exercises, {len(todo)} to find', file=sys.stderr)
    with ThreadPoolExecutor(threads) as pool:
        for ex_id, hit in pool.map(find, todo):
            if hit:
                found[ex_id] = hit
                print(f'ok   {ex_id:18} {hit["durationSeconds"]:4}s  {hit["channel"][:24]:24} | {hit["title"][:60]}', file=sys.stderr)
            else:
                print(f'MISS {ex_id}', file=sys.stderr)
            json.dump(found, open(dst, 'w'), indent=1, ensure_ascii=False)
    print(f'found {sum(1 for e in exercises if found.get(e["id"]))}/{len(exercises)}', file=sys.stderr)

main()
