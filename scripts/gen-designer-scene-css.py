#!/usr/bin/env python3
"""Generates components/scene/designer-scene.css (the 20s timeline of the designer scene).

Run:  python3 scripts/gen-designer-scene-css.py

One continuous skeleton (no pose swapping): every joint has its own keyframe track on the same 20s
clock. Times below are percent of the loop (1% = 0.2s). Distances are scene pixels (viewBox 640x400).

   0-3    idle at the board                       3-34   writes the flow, box by box
  34-37   idea: hop, "!" bubble, steps back        37-38  anticipation
  38-44   walks to the desk                        44-47  crouch, hop onto the chair, settle
  47-72   types (screen builds up)                 72-81  cheer: crouch, jump, arms up, confetti
  81-82   anticipation                             82-96  walks back (board erased 86-93)
  96-100  arrives and settles (identical to 0%, so the loop is seamless)

WRITING IS CONNECTED TO THE STROKES: the board sits low, and she works left to right. For each stroke
she stands at a station, her pen arm traces the stroke (shoulder angles below), and between strokes she
lifts the pen and scoots to the next station with a short stride-matched shuffle. Station x values are
the body centre; the pen hand sits about 50px left of it (arm length x scale).

Animation principles: eased timing, anticipation before every big move, squash and stretch on hops and
steps, overlapping action (pigtails lag), secondary motion (dangling feet, blink, eyes follow the pen),
stride length matched to ground speed (no foot skating), a camera that drifts with her and pushes in on
the idea, and one beat for the idea (!) and one for the payoff (cheer + confetti).
"""
import math, os

E_IO = 'var(--e-io)'    # cubic-bezier(.4,0,.2,1)   standard ease in-out
E_OUT = 'var(--e-out)'  # cubic-bezier(.2,.8,.3,1)  fast start, soft landing (hops, pops)
E_IN = 'var(--e-in)'    # cubic-bezier(.6,0,.9,.5)  slow start, fast finish (landings, anticipation)
E_LIN = 'linear'

SCALE = 1.2          # character scale in the scene
LEG = 60 * SCALE - 5 # hip to sole in scene px (about 67)
SEC = 0.2            # seconds per percent
X0, SIT_X = 135, 410
STATIONS = [135, 172, 209, 246, 283, 307]  # body x for: box A, arrow, box B, arrow, box C, bulb
STEP_BACK_X = 340

tracks = {}

def add(name, pct, value, ease=E_IO):
    tracks.setdefault(name, {})[round(pct, 3)] = (value, ease)  # later add at the same time wins

def rot(a): return f'rotate({a:g}deg)'
def tx(x): return f'translateX({x:g}px)'
def bob(y, sx=1, sy=1): return f'translateY({y:g}px) scale({sx:g}, {sy:g})'
def cam(x, s=1): return f'translateX({x:g}px) scale({s:g})'

def amp_for(speed_px_s, step_s):
    """Hip swing (deg) so the stance foot moves back as fast as the body moves forward."""
    return max(7.0, min(24.0, math.degrees(math.asin(min(.9, speed_px_s * step_s / 2 / LEG)))))

def walk(a, b, x0, x1, facing, arms=True, step_s=None):
    """Stride-matched walk (or scoot) from time a to b: travel, bob, legs and (optionally) arm swing."""
    dur = (b - a) * SEC
    v = abs(x1 - x0) / dur
    if step_s is None: step_s = 0.5 if dur > 1.5 else dur / 2
    n = max(2, round(dur / step_s))
    step_pct = (b - a) / n
    A = amp_for(v, dur / n) * facing
    B = A * 1.1
    add('x', a, tx(x0), E_LIN); add('x', b, tx(x1), E_LIN)
    for k in range(n + 1):
        p = a + k * step_pct
        fl = (k % 2 == 0)  # left leg forward at even contacts
        add('bob', p, bob(0, 1.03, .97), E_OUT)
        add('hipL', p, rot(-A if fl else A)); add('hipR', p, rot(A if fl else -A))
        add('kneeL', p, rot(0)); add('kneeR', p, rot(0))
        if arms:
            add('shL', p, rot(B if fl else -B)); add('shR', p, rot(-B if fl else B))
        if k < n:
            m = p + step_pct / 2
            add('bob', m, bob(-5 if dur > 1.5 else -3, .98, 1.03), E_IN)
            add('hipL', m, rot(0)); add('hipR', m, rot(0))
            add('kneeL', m, rot(26 if not fl else 0)); add('kneeR', m, rot(26 if fl else 0))
            if arms: add('shL', m, rot(0)); add('shR', m, rot(0))

def stand(p, hips=0):
    for n in ('hipL', 'hipR'): add(n, p, rot(hips))
    for n in ('kneeL', 'kneeR'): add(n, p, rot(0))

# ── travel root: where the body is ──────────────────────────────────────────
add('x', 0, tx(X0), E_IO)
add('bob', 0, bob(0), E_IO)
stand(0)

# ── WRITE: stations, strokes, pen arm ───────────────────────────────────────
# (name, station index, start, end, [pen-arm angles tapped in turn])
W = [
    ('boxA',  0, 3.0,  8.0,  [80, 102, 82, 100, 86, 98]),
    ('arrAB', 1, 9.8, 11.6,  [84, 90, 84]),
    ('boxB',  2, 13.4, 18.6, [80, 102, 82, 100, 86, 98]),
    ('arrBC', 3, 20.4, 22.2, [84, 90, 84]),
    ('boxC',  4, 24.0, 29.0, [80, 102, 82, 100, 86, 98]),
    ('bulb',  5, 30.8, 34.0, [152, 162, 154, 160]),
]
SHIFT = 1.8
PEN_UP = 50  # angle while the pen is lifted and she scoots
add('shL', 0, rot(PEN_UP), E_IO)
prev_x = X0
for i, (nm, st, t0, t1, angs) in enumerate(W):
    x = STATIONS[st]
    if i > 0:
        walk(t0 - SHIFT, t0, prev_x, x, +1, arms=False, step_s=SHIFT * SEC / 2)
        add('shL', t0 - SHIFT, rot(PEN_UP), E_IO)
    add('x', t0, tx(x), E_LIN)
    add('x', t1, tx(x), E_LIN)
    add('bob', t0 + .1, bob(0), E_OUT)
    n = len(angs)
    for j, a in enumerate(angs):
        p = t0 + (t1 - t0) * (j + .5) / n
        add('shL', p, rot(a), E_IO)
        add('head', p, rot(-7 if j % 2 else -3), E_IO)
        add('look', p, tx(-5 - (j % 2) * 2), E_IO)
    add('shL', t1, rot(angs[-1]), E_IO)
    prev_x = x
# the other arm hangs and sways a little
for p, a in [(0, -6), (14, -10), (28, -5)]: add('shR', p, rot(a), E_IO)
# torso and head while writing
for p, a in [(0, -2), (3, -3), (30.8, -3)]: add('torso', p, rot(a), E_IO)
add('head', 0, rot(-4), E_IO)
add('look', 0, tx(-5), E_IO)

# ── IDEA: hop, wide eyes, "!" ───────────────────────────────────────────────
add('shL', 34.6, rot(62), E_OUT); add('shR', 34.6, rot(-40), E_OUT)
for p, y, sx, sy, e in [(33.8, 0, 1, 1, E_OUT), (35.0, -12, .97, 1.05, E_OUT), (36.2, 0, 1.07, .92, E_IN)]:
    add('bob', p, bob(y, sx, sy), e)
add('torso', 35.0, rot(-6), E_OUT); add('torso', 36.2, rot(6), E_IN); add('torso', 37.4, rot(3), E_IO)
add('head', 35.0, rot(8), E_OUT); add('head', 37.4, rot(6), E_IO)
add('look', 34.4, tx(0), E_IO)
walk(36.4, 38.0, STATIONS[-1], STEP_BACK_X, +1, arms=False, step_s=.4 * 1.0)  # step back to reveal the board
add('bob', 38.4, bob(0), E_OUT)

# ── ANTICIPATE + WALK to the desk ───────────────────────────────────────────
add('bob', 39.0, bob(0, 1.05, .93), E_IO); add('bob', 39.7, bob(0), E_OUT)
add('torso', 39.0, rot(-4), E_IN); add('torso', 40.0, rot(8), E_OUT)
add('shL', 39.0, rot(-25), E_IN); add('shR', 39.0, rot(25), E_IN)
add('head', 39.0, rot(0), E_IO); add('look', 39.0, tx(4), E_IO)
walk(40.0, 46.0, STEP_BACK_X, SIT_X, +1)
add('torso', 46.0, rot(8), E_IO)

# ── SIT: crouch, hop onto the chair, settle ─────────────────────────────────
for p, y, sx, sy, e in [(46.0, 0, 1.05, .93, E_IO), (47.0, -14, .97, 1.05, E_OUT), (48.2, 2, 1.06, .9, E_IN), (49.0, 0, 1, 1, E_OUT)]:
    add('bob', p, bob(y, sx, sy), e)
add('x', 46.0, tx(SIT_X), E_LIN)
add('shL', 46.6, rot(-40), E_IO); add('shR', 46.6, rot(40), E_IO)
for name, v in [('hipL', -90), ('hipR', -90), ('kneeL', 90), ('kneeR', 90)]:
    add(name, 46.6, rot(0), E_IO); add(name, 47.8, rot(v), E_OUT)
add('shL', 48.4, rot(-82), E_OUT); add('shR', 48.4, rot(-74), E_OUT)
add('torso', 47.0, rot(-2), E_OUT); add('torso', 49.0, rot(4), E_IO)
add('head', 48.0, rot(-4), E_IO); add('look', 48.0, tx(5), E_IO)

# ── TYPE ────────────────────────────────────────────────────────────────────
for i in range(15):
    p = 49.4 + i * 1.5
    add('shL', p, rot(-82 + (6 if i % 2 else 0)), E_IO); add('shR', p, rot(-74 + (0 if i % 2 else 6)), E_IO)
    add('head', p, rot(3 if i % 2 else 6), E_IO)
for i in range(8):
    p = 51 + i * 2.8
    add('hipL', p, rot(-90 + (5 if i % 2 else -2))); add('hipR', p, rot(-90 + (-2 if i % 2 else 5)))
    add('kneeL', p, rot(90 - (12 if i % 2 else 0))); add('kneeR', p, rot(90 - (0 if i % 2 else 12)))
for i, p in enumerate(range(52, 72, 3)):
    add('bob', p, bob(-1 if i % 2 else 0, 1, 1.012 if i % 2 else 1), E_IO)
add('look', 70, tx(5), E_IO)

# ── CHEER: crouch, jump (legs kick), arms up, happy face, confetti ──────────
for p, y, sx, sy, e in [(72.0, 0, 1.05, .92, E_IN), (73.5, -22, .95, 1.07, E_OUT), (74.8, 0, 1.06, .9, E_IN), (76.0, 0, 1, 1, E_OUT),
                       (77.6, -3, .99, 1.02, E_OUT), (78.8, 0, 1, 1, E_IN)]:
    add('bob', p, bob(y, sx, sy), e)
add('shL', 72.0, rot(-70), E_IN); add('shR', 72.0, rot(-60), E_IN)
for p, l in [(73.5, 165), (76, 152), (78, 165), (81, 165)]:
    add('shL', p, rot(l), E_OUT if p == 73.5 else E_IO); add('shR', p, rot(-l), E_OUT if p == 73.5 else E_IO)
add('shL', 82.0, rot(8), E_IN); add('shR', 82.0, rot(-8), E_IN)
for name, a, b, c in [('hipL', -90, -25, 0), ('hipR', -90, 12, 0), ('kneeL', 90, 40, 0), ('kneeR', 90, 25, 0)]:
    add(name, 72.0, rot(a), E_IN); add(name, 74.0, rot(b), E_OUT); add(name, 74.8, rot(c), E_IN)
add('torso', 72.0, rot(-3), E_IN); add('torso', 73.5, rot(0), E_OUT); add('torso', 74.8, rot(3), E_IN); add('torso', 76.0, rot(-2), E_OUT); add('torso', 80, rot(0), E_IO)
for p, a in [(72.0, 4), (73.5, -8), (75.5, 6), (77.5, -6), (80, 0)]: add('head', p, rot(a), E_IO)
add('look', 72.0, tx(0), E_IO)

# ── ANTICIPATE + WALK back ──────────────────────────────────────────────────
add('bob', 80.6, bob(0, 1.05, .93), E_IO); add('bob', 81.5, bob(0), E_OUT)
add('torso', 80.6, rot(4), E_IN); add('torso', 82.0, rot(-8), E_OUT)
add('head', 82.0, rot(-3), E_IO); add('look', 81.4, tx(-5), E_IO)
add('x', 81.5, tx(SIT_X), E_LIN)
stand(80.6)
walk(82.0, 96.0, SIT_X, X0, -1, arms=True)
add('shL', 96.0, rot(0), E_IO)
# arrive: crouch, then raise the pen arm ready for the first stroke
for p, y, sx, sy, e in [(96.8, 0, 1.05, .93, E_IO), (98.2, 0, 1, 1, E_OUT)]:
    add('bob', p, bob(y, sx, sy), e)
add('torso', 97.0, rot(-2), E_IO); add('torso', 98.5, rot(-3), E_IO)
add('head', 98.0, rot(-4), E_IO); add('look', 98.0, tx(-5), E_IO)
add('shL', 98.4, rot(PEN_UP), E_OUT)
stand(97.0)
add('shR', 97.0, rot(-6), E_IO)

# ── pigtails lag the body: swing opposite to vertical moves, then settle ────
bob_y = {p: float(v.split('translateY(')[1].split('px')[0]) for p, (v, _) in tracks['bob'].items()}
prev = 0
add('pigL', 0, rot(0), E_IO); add('pigR', 0, rot(0), E_IO)
for p in sorted(bob_y):
    dy = bob_y[p] - prev
    if abs(dy) >= 4:
        a = max(-26, min(26, -dy * 1.1))
        add('pigL', p + .5, rot(a), E_OUT); add('pigR', p + .5, rot(-a), E_OUT)
        add('pigL', p + 1.7, rot(-a * .4), E_IO); add('pigR', p + 1.7, rot(a * .4), E_IO)
        add('pigL', p + 2.8, rot(0), E_IO); add('pigR', p + 2.8, rot(0), E_IO)
    prev = bob_y[p]

# ── face swaps ──────────────────────────────────────────────────────────────
def window(name, windows, on='1', off='0'):
    add(name, 0, off, E_LIN)
    for a, b in windows:
        add(name, a - .01, off, E_LIN); add(name, a, on, E_LIN); add(name, b, on, E_LIN); add(name, b + .01, off, E_LIN)
window('happy', [(73.6, 80.6)])
window('normal', [(73.6, 80.6)], on='0', off='1')
window('mouth', [(34.2, 37.4), (73.6, 80.6)])
window('marker', [(0, 40.0), (97.6, 100)])
for p, v, e in [(0, 'scale(0)', E_LIN), (34.4, 'scale(0)', E_OUT), (35.3, 'scale(1.25)', E_IO), (36.0, 'scale(1)', E_IO), (38.4, 'scale(1)', E_IN), (39.1, 'scale(0)', E_LIN), (100, 'scale(0)', E_LIN)]:
    add('bubble', p, v, e)

# ── camera: drifts with her, pushes in on the idea and the cheer ────────────
for p, c, s, e in [(0, 20, 1, E_IO), (8, 16, 1, E_IO), (20, 8, 1, E_IO), (30, 2, 1, E_IO), (34.5, 0, 1.0, E_IO), (36.0, -2, 1.05, E_OUT), (40, -4, 1.0, E_IO),
                   (46, -9, 1, E_IO), (72, -9, 1, E_IO), (74.5, -9, 1.04, E_OUT), (79, -9, 1.0, E_IO), (86, -2, 1, E_IO), (96, 20, 1, E_IO), (100, 20, 1, E_IO)]:
    add('cam', p, cam(c, s), e)

# ── confetti pieces (start at the laptop; gravity arc) ──────────────────────
CONF = [(-120, '#e53416'), (-70, '#ffd34d'), (-30, '#3fc1c9'), (10, '#ff9fb4'), (50, '#ffd34d'), (90, '#e53416'), (130, '#3fc1c9'), (-95, '#ff9fb4')]
for i, (dx, _) in enumerate(CONF):
    t0 = 73.6 + i * .25
    hide = 'translate(0px, 0px) rotate(0deg); opacity: 0'
    add(f'cf{i}', 0, hide, E_LIN)
    add(f'cf{i}', t0 - .01, hide, E_LIN)
    add(f'cf{i}', t0, 'translate(0px, 0px) rotate(0deg); opacity: 1', E_OUT)
    add(f'cf{i}', t0 + 2.0, f'translate({dx * .55:g}px, {-70 - (i % 3) * 14:g}px) rotate({180 + i * 40}deg); opacity: 1', E_IN)
    add(f'cf{i}', t0 + 4.6, f'translate({dx:g}px, 90px) rotate({420 + i * 50}deg); opacity: 1', E_LIN)
    add(f'cf{i}', t0 + 5.0, f'translate({dx:g}px, 96px) rotate({440 + i * 50}deg); opacity: 0', E_LIN)
    add(f'cf{i}', 100, hide, E_LIN)

# ── the room: board strokes, laptop pops, cursor, sparkles ──────────────────
board = [('b2', 3.0, 6.0), ('bi1', 6.2, 7.8), ('b3', 9.8, 11.4), ('b4', 13.4, 16.4), ('bi2', 16.6, 18.4), ('b5', 20.4, 22.0),
         ('b6', 24.0, 27.0), ('bi3', 27.2, 28.8), ('b9', 30.8, 32.6), ('b10', 32.6, 33.8)]
ui = [('u1', 49, 52), ('u2', 52, 55), ('u3', 55, 57), ('u4', 57, 59), ('u5', 59, 62), ('u6', 63, 65), ('u7', 65, 67), ('u8', 67, 69)]

PROPS = {'cam': 'transform', 'x': 'transform', 'bob': 'transform', 'torso': 'transform', 'head': 'transform', 'look': 'transform', 'pigL': 'transform', 'pigR': 'transform',
         'shL': 'transform', 'shR': 'transform', 'hipL': 'transform', 'hipR': 'transform', 'kneeL': 'transform', 'kneeR': 'transform',
         'happy': 'opacity', 'normal': 'opacity', 'mouth': 'opacity', 'marker': 'opacity', 'bubble': 'transform'}
SEL = {'cam': '.sc-cam', 'x': '.r-x', 'bob': '.r-bob', 'torso': '.j-torso', 'head': '.j-head', 'look': '.j-look', 'pigL': '.j-pigL', 'pigR': '.j-pigR',
       'shL': '.j-shL', 'shR': '.j-shR', 'hipL': '.j-hipL', 'hipR': '.j-hipR', 'kneeL': '.j-kneeL', 'kneeR': '.j-kneeR',
       'happy': '.f-happy', 'normal': '.f-normal', 'mouth': '.f-mouth', 'marker': '.f-marker', 'bubble': '.sc-bubble'}
for i in range(len(CONF)): PROPS[f'cf{i}'] = 'transform'; SEL[f'cf{i}'] = f'.sc-cf{i}'

def block(name, pts, prop):
    out = [f'  @keyframes sc-{name} {{']
    for p, v, e in pts:
        out.append(f'    {p:g}% {{ {prop}: {v}; animation-timing-function: {e}; }}')
    out.append('  }')
    return '\n'.join(out)

parts, anim = [], []
for name, d in tracks.items():
    pts = sorted(((p, v, e) for p, (v, e) in d.items()), key=lambda t: t[0])
    if pts[0][0] > 0: pts.insert(0, (0, pts[-1][1], E_IO))
    if pts[-1][0] < 100: pts.append((100, pts[0][1], E_IO))
    assert pts[0][1] == pts[-1][1], (name, pts[0], pts[-1])
    parts.append(block(name, pts, PROPS[name]))
    anim.append(f'  {SEL[name]} {{ animation: sc-{name} 20s linear; }}')

extra = []
for n, s, e in board:
    extra.append(f'  .sc-{n} {{ animation: sc-draw-{n} 20s linear; }}\n  @keyframes sc-draw-{n} {{ 0%, {s}% {{ stroke-dashoffset: 1.02; }} {e}%, 100% {{ stroke-dashoffset: 0; }} }}')
for n, s, e in ui:
    grow = 'scaleX(.1)' if n in ('u1', 'u3', 'u4') else 'scale(.6)'
    extra.append(f'  .sc-{n} {{ animation: sc-pop-{n} 20s ease-out; }}\n  @keyframes sc-pop-{n} {{ 0%, {s}% {{ opacity: 0; transform: {grow}; }} {e}%, 100% {{ opacity: 1; transform: none; }} }}')
extra.append('''  .sc-board { animation: sc-board 20s linear; }
  @keyframes sc-board { 0%, 86% { opacity: 1; } 93% { opacity: 0; } 99.9% { opacity: 0; } 100% { opacity: 1; } }
  .sc-ui { animation: sc-ui 20s linear; }
  @keyframes sc-ui { 0%, 47.5% { opacity: 0; } 47.6%, 82.4% { opacity: 1; } 82.8%, 100% { opacity: 0; } }
  .sc-cursor { animation: sc-cursor 20s linear; }
  @keyframes sc-cursor { 0%, 48.9% { opacity: 0; transform: translate(0, 0); } 49% { opacity: 1; transform: translate(0, 0); } 53% { transform: translate(40px, -8px); } 57% { transform: translate(44px, 22px); } 61% { transform: translate(-6px, 36px); } 66% { transform: translate(40px, 36px); } 70%, 82.4% { opacity: 1; transform: translate(70px, 14px); } 82.8%, 100% { opacity: 0; transform: translate(70px, 14px); } }
  .sc-sparkles { animation: sc-sparkles 20s linear; }
  @keyframes sc-sparkles { 0%, 73.4% { opacity: 0; } 73.6%, 83% { opacity: 1; } 84%, 100% { opacity: 0; } }''')

HEAD = '''/* Designer scene (components/scene/DesignerScene.tsx). GENERATED by scripts/gen-designer-scene-css.py: edit the script, not this file.
   Base (no animation) = the calm final frame: seated at the desk, board filled, screen built.
   Animations run only under prefers-reduced-motion: no-preference, and only while on screen. */

.sc-root {
  --sc-delay: 0s;
  --sc-state: paused;
  --sc-board: #ffffff;
  --sc-floor: var(--px-border-strong, #c8c5be);
  --sc-shadow: rgba(40, 30, 80, 0.14);
  --sc-wood: #d2a679;
  --sc-wood-dark: #a9784f;
  --sc-outfit: var(--px-accent, #e53416);
  --e-io: cubic-bezier(.4, 0, .2, 1);
  --e-out: cubic-bezier(.2, .8, .3, 1);
  --e-in: cubic-bezier(.6, 0, .9, .5);
  width: 100%;
  max-width: 720px;
}
.sc-root[data-play="true"] { --sc-state: running; }
.sc-root svg { display: block; width: 100%; height: auto; overflow: visible; }

/* base pose: seated at the desk */
.sc-cam { transform-origin: 320px 200px; }
.r-x { transform: translateX(%SIT%px); }
.j-hipL, .j-hipR { transform: rotate(-90deg); }
.j-kneeL, .j-kneeR { transform: rotate(90deg); }
.j-shL { transform: rotate(-82deg); }
.j-shR { transform: rotate(-74deg); }
.j-torso { transform: rotate(4deg); }
.j-head { transform: rotate(3deg); }
.j-look { transform: translateX(5px); }
.f-happy, .f-mouth, .f-marker { opacity: 0; }
.sc-bubble { transform: scale(0); }
.sc-sparkles { opacity: 0; }
[class*="sc-cf"] { opacity: 0; }
.sc-board path { stroke-dasharray: 1 1; stroke-dashoffset: 0; }
.sc-cursor { opacity: 0; }
.sc-u1, .sc-u2, .sc-u3, .sc-u4, .sc-u5, .sc-u6, .sc-u7, .sc-u8, .sc-sp1, .sc-sp2, .sc-sp3 { transform-box: fill-box; transform-origin: center; }
.sc-u1, .sc-u3, .sc-u4 { transform-origin: left center; }
.f-normal, .sc-steam { transform-box: fill-box; transform-origin: center; }
.sc-steam { opacity: 0.6; }

@media (prefers-reduced-motion: no-preference) {
'''.replace('%SIT%', str(SIT_X))
TAIL = '''
  /* life: blink, steam, sparkle twinkle (independent short loops) */
  .f-blink { animation: sc-blink 4.6s ease-in-out; transform-box: fill-box; transform-origin: center; }
  @keyframes sc-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
  .sc-steam { animation: sc-steam 2.4s ease-in-out; }
  @keyframes sc-steam { 0% { opacity: 0; transform: translateY(4px); } 50% { opacity: 0.7; } 100% { opacity: 0; transform: translateY(-6px); } }
  .sc-sp1 { animation: sc-twinkle 1.1s ease-in-out; }
  .sc-sp2 { animation: sc-twinkle 1.1s ease-in-out 0.25s; }
  .sc-sp3 { animation: sc-twinkle 1.1s ease-in-out 0.5s; }
  @keyframes sc-twinkle { 0%, 100% { transform: scale(0.4) rotate(0); } 50% { transform: scale(1.1) rotate(25deg); } }

  /* shared playback settings: must stay AFTER every `animation:` shorthand above (a shorthand resets them) */
  .sc-root * { animation-play-state: var(--sc-state); animation-delay: var(--sc-delay); animation-iteration-count: infinite; animation-fill-mode: both; }
  .sc-root[data-frozen="true"] * { animation-play-state: paused; }
}
'''
css = HEAD + '\n'.join(anim) + '\n\n' + '\n'.join(parts) + '\n\n' + '\n'.join(extra) + '\n' + TAIL
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'components', 'scene', 'designer-scene.css')
open(out, 'w').write(css)
print('wrote', os.path.normpath(out), len(css), 'bytes,', sum(len(v) for v in tracks.values()), 'keyframes in', len(tracks), 'tracks')
