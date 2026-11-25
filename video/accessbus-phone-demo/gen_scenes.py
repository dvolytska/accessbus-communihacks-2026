#!/usr/bin/env python3
"""Writes production/scenes/<id>.html for the AccessBus video from one shared phone layout.
Screen coordinates are the app's CSS px (375-wide viewport); the phone screen shows them at K = 504/375."""
import json, os, html
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'production', 'scenes')
os.makedirs(OUT, exist_ok=True)
K = 504 / 375
NAT = {}
from PIL import Image
for f in os.listdir(os.path.join(HERE, 'assets/screens')):
    if f.endswith('.png'):
        w, h = Image.open(os.path.join(HERE, 'assets/screens', f)).size
        NAT[f[:-4]] = h / 3  # css px tall

PHONE = dict(left=270, top=620, w=540, h=1170)
SCREEN_W, SCREEN_H = 504, 1134

def r(v): return round(v, 2)

def headline_html(p, head, accent):
    words = head.split(' ')
    acc = accent.split(' ') if accent else []
    # find the accent run
    start = -1
    if acc:
        for i in range(len(words) - len(acc) + 1):
            if [w.strip('.,:') for w in words[i:i+len(acc)]] == [a.strip('.,:') for a in acc]:
                start = i; break
    out = []
    for i, w in enumerate(words):
        cls = f'{p}-w' + (f' {p}-acc' if start >= 0 and start <= i < start + len(acc) else '')
        out.append(f'<span class="{p}-m"><span class="{cls}">{html.escape(w)}</span></span>')
    return ' '.join(out)

def build(s):
    sid, dur = s['id'], s['dur']
    p = 's' + sid[:2]
    css = []
    body = []
    js = []
    E = js.append
    css.append(f"""
#{p}-root{{position:relative;width:1080px;height:1920px;overflow:hidden;background:#ffffff;font-family:var(--f-text)}}
.{p}-panel{{position:absolute;left:72px;top:820px;width:936px;height:900px;border-radius:48px;background:#eef5f5}}
.{p}-kicker{{position:absolute;left:72px;top:150px;font-family:var(--f-mono);font-weight:500;font-size:30px;letter-spacing:.18em;text-transform:uppercase;color:#007c84;white-space:nowrap}}
.{p}-head{{position:absolute;left:72px;top:{s.get('head_top',205)}px;width:{s.get('head_w',880)}px;font-family:var(--f-display);font-weight:700;font-size:{s.get('head_size',96)}px;letter-spacing:-0.025em;line-height:1.06;color:#14272a}}
.{p}-m{{display:inline-block;overflow:hidden;vertical-align:top;padding:.06em .02em .14em;margin:-.06em -.02em -.14em}}
.{p}-w{{display:inline-block}}
.{p}-acc{{color:#007c84}}
.{p}-sub{{position:absolute;left:72px;top:{s.get('sub_top',470)}px;font-family:var(--f-text);font-weight:400;font-size:42px;line-height:1.3;color:#3d5356;white-space:nowrap}}
.{p}-sub b{{display:inline-block;width:18px;height:18px;border-radius:50%;background:#f2682a;margin-right:16px;vertical-align:middle}}
.{p}-phone{{position:absolute;left:{PHONE['left']}px;top:{PHONE['top']}px;width:{PHONE['w']}px;height:{PHONE['h']}px;border-radius:72px;background:#14272a;padding:18px;box-shadow:0 50px 110px rgba(20,39,42,.22),0 8px 24px rgba(20,39,42,.14);transform-origin:50% 40%}}
.{p}-screen{{position:relative;width:{SCREEN_W}px;height:{SCREEN_H}px;border-radius:54px;overflow:hidden;background:#ffffff}}
.{p}-img{{position:absolute;left:0;top:0;width:{SCREEN_W}px;display:block}}
.{p}-ripple{{position:absolute;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:rgba(242,104,42,.30);border:5px solid #f2682a;opacity:0}}
.{p}-hl{{position:absolute;border:5px solid #f2682a;border-radius:16px;opacity:0;box-shadow:0 0 0 9999px rgba(20,39,42,0)}}
.{p}-rail{{position:absolute;left:96px;top:820px;display:flex;flex-direction:column;gap:30px}}
.{p}-dot{{width:80px;height:80px;border-radius:50%;border:4px solid #b9cbcc;background:#ffffff;color:#3d5356;font-family:var(--f-mono);font-weight:700;font-size:34px;display:flex;align-items:center;justify-content:center;box-sizing:border-box}}
""")
    # ---- background panel
    if s.get('panel', True):
        body.append(f'<div class="{p}-panel" data-decor="1"></div>')
    # ---- top text
    if s.get('kicker'):
        body.append(f'<div class="{p}-kicker" id="{p}-kicker" data-look="kicker">{html.escape(s["kicker"])}</div>')
    if s.get('head'):
        body.append(f'<div class="{p}-head" id="{p}-head" data-look="headline">{headline_html(p, s["head"], s.get("accent"))}</div>')
    if s.get('sub'):
        body.append(f'<div class="{p}-sub" id="{p}-sub" data-look="sub"><b></b>{html.escape(s["sub"])}</div>')
    if s.get('extra_html'):
        body.append(s['extra_html'].replace('{p}', p))
    if s.get('extra_css'):
        css.append(s['extra_css'].replace('{p}', p))
    # ---- phone
    if s.get('screens'):
        imgs = []
        for i, sc in enumerate(s['screens']):
            imgs.append(f'<img class="{p}-img" id="{p}-img{i}" src="assets/screens/{sc["img"]}.png" alt="">')
        overlays = []
        for i, t in enumerate(s.get('taps', [])):
            overlays.append(f'<div class="{p}-ripple" id="{p}-tap{i}" data-decor="1"></div>')
        for i, h in enumerate(s.get('hls', [])):
            overlays.append(f'<div class="{p}-hl" id="{p}-hl{i}" data-decor="1"></div>')
        body.append(f'<div class="{p}-phone" id="{p}-phone" data-look="phone" data-product="1"><div class="{p}-screen">{"".join(imgs)}{"".join(overlays)}</div></div>')
    if s.get('rail'):
        dots = ''.join(f'<div class="{p}-dot" id="{p}-dot{i}">{i+1}</div>' for i in range(4))
        body.append(f'<div class="{p}-rail" id="{p}-rail" data-look="rail">{dots}</div>')

    # ---- timeline
    E('gsap.config({nullTargetWarn:false});')
    E('const tl = gsap.timeline({ paused: true });')
    E(f'const P="#{p}-";')
    # proxy to fix duration
    E(f'tl.to({{}},{{duration:{dur}}},0);')
    # headline entrance
    if s.get('kicker'):
        E(f'tl.fromTo(P+"kicker",{{y:14,opacity:0}},{{y:0,opacity:1,duration:0.3,ease:"power3.out"}},0.02);')
    if s.get('head'):
        E(f'tl.fromTo(P+"head .{p}-w",{{yPercent:112}},{{yPercent:0,duration:0.34,ease:"power3.out",stagger:0.04}},0.05);')
    if s.get('sub'):
        E(f'tl.fromTo(P+"sub",{{y:16,opacity:0}},{{y:0,opacity:1,duration:0.3,ease:"power3.out"}},{s.get("sub_at",0.3)});')
    # phone entrance
    if s.get('screens'):
        pe = s.get('phone_in')
        if pe == 'rise':
            E(f'tl.fromTo(P+"phone",{{y:90,scale:0.94,opacity:0}},{{y:0,scale:1,opacity:1,duration:0.5,ease:"power3.out"}},0.12);')
        # gentle push over the scene
        if s.get('push', True):
            E(f'tl.fromTo(P+"phone",{{scale:1}},{{scale:1.018,duration:{dur},ease:"sine.inOut",immediateRender:false}},{0.62 if pe=="rise" else 0});')
        # screens: show/hide and scroll
        for i, sc in enumerate(s['screens']):
            sel = f'P+"img{i}"'
            if i == 0:
                E(f'tl.set({sel},{{opacity:1,y:{r(-sc.get("y0",0)*K)}}},0);')
            else:
                E(f'tl.set({sel},{{opacity:0,y:{r(-sc.get("y0",0)*K)}}},0);')
                E(f'tl.to({sel},{{opacity:1,duration:{sc.get("fade",0.25)},ease:"power1.inOut"}},{sc["at"]});')
            for (t, y, d) in sc.get('scroll', []):
                E(f'tl.to({sel},{{y:{r(-y*K)},duration:{d},ease:"power2.inOut"}},{t});')
            if 'hide' in sc:
                E(f'tl.to({sel},{{opacity:0,duration:0.2}},{sc["hide"]});')
        for i, (t, x, y, scroll) in enumerate(s.get('taps', [])):
            sx, sy = r(x*K), r((y-scroll)*K)
            E(f'tl.set(P+"tap{i}",{{left:{sx},top:{sy}}},0);')
            E(f'tl.fromTo(P+"tap{i}",{{scale:0.35,opacity:1}},{{scale:1.7,opacity:0,duration:0.6,ease:"power2.out",immediateRender:false}},{t});')
        for i, (t0, t1, x, y, w, h, scroll) in enumerate(s.get('hls', [])):
            E(f'tl.set(P+"hl{i}",{{left:{r(x*K-6)},top:{r((y-scroll)*K-6)},width:{r(w*K+12)},height:{r(h*K+12)}}},0);')
            E(f'tl.fromTo(P+"hl{i}",{{opacity:0,scale:1.06}},{{opacity:1,scale:1,duration:0.3,ease:"power3.out",immediateRender:false}},{t0});')
            E(f'tl.to(P+"hl{i}",{{opacity:0,duration:0.22,ease:"power1.in"}},{t1});')
    if s.get('rail'):
        on, events = s['rail']
        E(f'tl.fromTo(P+"rail",{{x:-30,opacity:0}},{{x:0,opacity:1,duration:0.32,ease:"power3.out"}},{s.get("rail_in",0.1)});')
        for i in range(4):
            st = 'done' if i < on else ('on' if i == on else 'off')
            E(f'tl.set(P+"dot{i}",{dot_style(st)},0);')
        for (t, i, st) in events:
            E(f'tl.to(P+"dot{i}",Object.assign({dot_style(st)},{{duration:0.3,ease:"power2.out"}}),{t});')
            E(f'tl.fromTo(P+"dot{i}",{{scale:1.18}},{{scale:1,duration:0.35,ease:"back.out(3)",immediateRender:false}},{t});')
    if s.get('extra_js'):
        E(s['extra_js'].replace('{p}', p).replace('{dur}', str(dur)))
    # exits: top text out in the last 0.3 s (body first, headline last)
    if s.get('exit_text', True):
        x = dur - 0.28
        if s.get('sub'): E(f'tl.to(P+"sub",{{opacity:0,y:-10,duration:0.14,ease:"power2.in"}},{r(x)});')
        if s.get('kicker'): E(f'tl.to(P+"kicker",{{opacity:0,duration:0.12,ease:"power2.in"}},{r(x+0.04)});')
        if s.get('head'): E(f'tl.to(P+"head .{p}-w",{{yPercent:-110,duration:0.1,ease:"power2.in",stagger:0.008}},{r(dur-0.16)});')
    if s.get('exit_phone'):
        E(f'tl.to(P+"phone",{{opacity:0,y:40,duration:0.2,ease:"power2.in"}},{r(dur-0.24)});')
        if s.get('rail'): E(f'tl.to(P+"rail",{{opacity:0,duration:0.18}},{r(dur-0.24)});')
    E(f'window.__timelines = window.__timelines || {{}};\nwindow.__timelines["{sid}"] = tl;')
    doc = f"""<style>{''.join(css)}</style>
<div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920" data-duration="{dur}">
<div id="{p}-root">
{chr(10).join(body)}
</div>
</div>
<script>
{chr(10).join(js)}
</script>
"""
    open(os.path.join(OUT, sid + '.html'), 'w').write(doc)

def dot_style(st):
    return {'off': '{backgroundColor:"#ffffff",borderColor:"#b9cbcc",color:"#3d5356"}',
            'on': '{backgroundColor:"#007c84",borderColor:"#007c84",color:"#ffffff"}',
            'done': '{backgroundColor:"#f2682a",borderColor:"#f2682a",color:"#ffffff"}'}[st]

# ---------------- paper scenes ----------------
PAPER_CSS = """
.{p}-paper{position:absolute;width:760px;height:1000px;background:#fbfaf6;border:3px solid #d8d3c4;border-radius:12px;box-shadow:0 30px 80px rgba(20,39,42,.16);padding:60px 64px;box-sizing:border-box;font-family:var(--f-mono);color:#3d5356}
.{p}-ptitle{font-family:var(--f-mono);font-weight:700;font-size:38px;letter-spacing:.12em;color:#14272a;margin-bottom:30px}
.{p}-prow{position:relative;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #d8d3c4;height:104px;font-size:32px;padding-bottom:12px;box-sizing:border-box}
.{p}-hand{font-family:var(--f-text);font-weight:600;font-style:italic;font-size:46px;color:#2b4a8a}
.{p}-strike{position:absolute;right:-8px;top:58px;width:230px;height:7px;border-radius:4px;background:#f2682a;transform-origin:0 50%}
.{p}-fix{position:absolute;right:250px;top:22px;font-family:var(--f-text);font-weight:600;font-style:italic;font-size:44px;color:#f2682a}
.{p}-under{position:absolute;height:12px;border-radius:6px;background:#f2682a;transform-origin:0 50%}
"""
def paper(p, idx, left, top, rot, rows, extra=''):
    rws = ''.join(f'<div class="{p}-prow"><span>{a}</span><span class="{p}-hand {p}-h{idx}">{b}</span></div>' for a, b in rows)
    return f'<div class="{p}-paper" id="{p}-paper{idx}" {'data-look="paper0"' if idx==0 else 'data-decor="1"'} style="left:{left}px;top:{top}px;transform:rotate({rot}deg)"><div class="{p}-ptitle">TRIP SHEET</div>{rws}{extra}</div>'

ROWS = [('Date', 'Nov 8'), ('Km start', '48210'), ('Km end', '48452'), ('Fuel (L)', '62'), ('Hours', '8.5'), ('Members', '5')]

S = []
S.append(dict(id='01-paper-every', dur=6, kicker='KW AccessAbility', head='Every trip still ends on a paper sheet.', accent='paper sheet', head_size=100, panel=False,
    extra_css=PAPER_CSS, extra_html=paper('{p}', 0, 160, 700, -3, ROWS) + '<div class="{p}-under" id="{p}-under" data-decor="1"></div>',
    extra_js="""
tl.fromTo(P+"paper0",{y:-260,opacity:0,rotation:-9},{y:0,opacity:1,rotation:-3,duration:0.55,ease:"power3.out"},0.15);
tl.fromTo(P+"paper0 .{p}-h0",{opacity:0,x:-14},{opacity:1,x:0,duration:0.3,ease:"power3.out",stagger:0.32},0.9);
const hb=()=>{const w=[...document.querySelectorAll('#{p}-head .{p}-acc')].map(e=>e.parentElement);const o=document.getElementById('{p}-root').getBoundingClientRect();const a=w[0].getBoundingClientRect(),b=w[w.length-1].getBoundingClientRect();return {l:Math.min(a.left,b.left)-o.left,t:b.bottom-o.top+2,w:Math.max(a.right,b.right)-Math.min(a.left,b.left)};};
tl.set(P+"under",{left:()=>hb().l,top:()=>hb().t,width:()=>hb().w,scaleX:0},0);
tl.to(P+"under",{scaleX:1,duration:0.45,ease:"power3.out"},1.1);
tl.to(P+"paper0",{y:-10,duration:2.6,ease:"sine.inOut"},3.2);
"""))
S.append(dict(id='02-totalled-by', dur=9, head='Collected, corrected, totalled by hand.', accent='by hand', head_size=100, panel=False,
    extra_css=PAPER_CSS,
    extra_html=paper('{p}', 2, 250, 760, 4, [('Date', 'Oct 18'), ('Km start', '47 890'), ('Km end', '48 077')])
               + paper('{p}', 1, 200, 730, -6, [('Date', 'Nov 6'), ('Km start', '47 950'), ('Km end', '48 136')])
               + paper('{p}', 0, 160, 700, -3, ROWS, extra='<div class="{p}-fix" id="{p}-fix" style="top:310px">48425</div><div class="{p}-strike" id="{p}-strike" style="top:350px"></div>')
               + '<div class="{p}-under" id="{p}-under" data-decor="1"></div>',
    extra_js="""
tl.set(P+"paper0",{rotation:-3},0);
tl.fromTo(P+"paper1",{x:700,opacity:0},{x:0,opacity:1,duration:0.5,ease:"power3.out"},0.35);
tl.fromTo(P+"paper2",{x:760,opacity:0},{x:0,opacity:1,duration:0.5,ease:"power3.out"},1.0);
tl.to(P+"paper0",{x:-40,y:40,duration:0.5,ease:"power3.out"},1.0);
tl.fromTo(P+"strike",{scaleX:0},{scaleX:1,duration:0.35,ease:"power2.out"},2.4);
tl.fromTo(P+"fix",{opacity:0,y:10},{opacity:1,y:0,duration:0.3,ease:"power3.out"},3.0);
const hb=()=>{const w=[...document.querySelectorAll('#{p}-head .{p}-acc')].map(e=>e.parentElement);const o=document.getElementById('{p}-root').getBoundingClientRect();const a=w[0].getBoundingClientRect(),b=w[w.length-1].getBoundingClientRect();return {l:Math.min(a.left,b.left)-o.left,t:b.bottom-o.top+2,w:Math.max(a.right,b.right)-Math.min(a.left,b.left)};};
tl.set(P+"under",{left:()=>hb().l,top:()=>hb().t,width:()=>hb().w,scaleX:0},0);
tl.to(P+"under",{scaleX:1,duration:0.45,ease:"power3.out"},1.6);
tl.to([P+"paper1",P+"paper2"],{y:"+=14",duration:2.2,ease:"sine.inOut",stagger:0.2},3.6);
tl.to(P+"paper0",{rotation:-1,duration:2.4,ease:"sine.inOut"},5.6);
tl.to([P+"paper0",P+"paper1",P+"paper2"],{scale:0.55,x:"+=60",y:"+=80",opacity:0,duration:0.5,ease:"power2.in",stagger:0.04},8.2);
tl.to(P+"under",{opacity:0,duration:0.15},8.6);
"""))
# 03 reveal: logo + wordmark, phone rises with sign-in
S.append(dict(id='03-the-sheet', dur=8, head='The trip sheet, now on a phone.', accent='on a phone', head_top=320, sub_top=0, phone_in='rise',
    screens=[dict(img='signin')],
    extra_css=""".{p}-brand{position:absolute;left:72px;top:150px;display:flex;align-items:center;gap:26px}
.{p}-brand img{width:120px;height:120px;object-fit:contain}
.{p}-bname{font-family:var(--f-display);font-weight:700;font-size:64px;letter-spacing:-0.02em;color:#14272a;line-height:1}
.{p}-borg{font-family:var(--f-text);font-weight:400;font-size:36px;color:#3d5356;margin-top:8px}""",
    extra_html='<div class="{p}-brand" id="{p}-brand" data-brand="1"><img src="assets/brand/logo.png" alt=""><div><div class="{p}-bname">AccessBus</div><div class="{p}-borg">KW AccessAbility</div></div></div>',
    extra_js="""tl.fromTo(P+"brand",{y:14,opacity:0},{y:0,opacity:1,duration:0.6,ease:"power3.out"},0.6);
tl.to(P+"brand",{opacity:0,duration:0.12},{dur}-0.28);""",
    hls=[(2.4, 4.4, 16, 212, 343, 280, 0), (4.8, 7.0, 24, 512, 327, 101, 0)]))
S.append(dict(id='04-sign-in', dur=8, kicker='Sign in', head='Pick your name. Enter your PIN.', accent='PIN',
    screens=[dict(img='signin'), dict(img='signin-pin', at=4.1), dict(img='driver-home', at=6.5, fade=0.35)],
    taps=[(1.9, 187, 252, 0), (3.8, 187, 575, 0), (5.8, 187, 694, 0)],
    hls=[(0.6, 1.8, 16, 220, 343, 268, 0), (3.9, 5.6, 24, 545, 327, 66, 0)]))
S.append(dict(id='05-office-plans', dur=12, kicker='Staff · Edward', head='The office plans the run.', accent='plans',
    screens=[dict(img='staff-setup', y0=0, scroll=[(2.2, 740, 0.9), (4.9, 1262, 0.9), (7.6, 1662, 0.9), (10.0, 2560, 0.8)])],
    hls=[(0.7, 2.0, 33, 330, 309, 520, 0), (3.2, 4.7, 33, 845, 309, 500, 740), (5.9, 7.4, 33, 1368, 309, 380, 1262), (8.6, 9.8, 33, 1768, 309, 560, 1662)],
    taps=[(11.0, 187, 3025, 2560)]))
S.append(dict(id='06-today-s', dur=10, kicker='Driver · Priya', head='Everything the driver needs, up front.', accent='up front',
    screens=[dict(img='driver-home', y0=0, scroll=[(2.4, 520, 0.9), (5.9, 700, 0.8), (8.2, 0, 0.7)])],
    hls=[(0.6, 2.2, 16, 16, 343, 420, 0), (3.4, 5.6, 33, 650, 309, 140, 520), (6.8, 8.0, 33, 806, 293, 107, 700)],
    taps=[(9.25, 187, 509, 0)]))
S.append(dict(id='07-kilometres-at', dur=9, kicker='Step 1 of 4', head='Step 1: kilometres at the lot.', accent='Step 1',
    screens=[dict(img='step1'), dict(img='step1-filled', at=3.2)],
    rail=(0, [(7.2, 0, 'done'), (7.35, 1, 'on')]),
    taps=[(2.6, 187, 680, 0), (6.6, 187, 763, 0)],
    hls=[(0.8, 2.4, 20, 500, 335, 88, 0), (3.0, 5.6, 24, 598, 327, 109, 0)]))
S.append(dict(id='08-sign-members', dur=11, kicker='Step 2 of 4', head='Step 2: sign members in.', accent='Step 2', sub='Drop-offs already set', sub_top=430,
    screens=[dict(img='step2', y0=380), dict(img='step2-two', at=3.0, y0=380), dict(img='step2-ticked', at=5.6, y0=380), dict(img='step3', at=7.6, y0=440, fade=0.3)],
    rail=(1, [(7.5, 1, 'done'), (7.65, 2, 'on')]),
    taps=[(2.0, 187, 700, 380), (2.7, 187, 751, 380), (4.2, 187, 802, 380), (4.75, 187, 852, 380), (5.3, 187, 903, 380), (7.1, 187, 1008, 380)],
    hls=[(0.6, 1.8, 33, 623, 309, 310, 380), (8.3, 10.5, 33, 675, 309, 95, 440)]))
S.append(dict(id='09-finish-this', dur=9, kicker='Step 3 of 4', head='Step 3: finish this trip.', accent='Step 3', sub='Hours worked out', sub_top=430,
    screens=[dict(img='step3', y0=1050), dict(img='step3-filled', at=2.3, y0=1050, scroll=[(4.3, 1250, 0.8)])],
    rail=(2, [(8.0, 2, 'done'), (8.15, 3, 'on')]),
    taps=[(1.6, 187, 1240, 1050), (7.5, 187, 1793, 1250)],
    hls=[(0.6, 2.1, 49, 1173, 277, 237, 1050), (5.3, 7.2, 41, 1440, 293, 260, 1250)]))
S.append(dict(id='10-send-to', dur=9, kicker='Step 4 of 4', head='Step 4: fuel, then send.', accent='send', sub='Saved throughout', sub_top=430,
    screens=[dict(img='step4'), dict(img='step4-filled', at=2.4), dict(img='sent', at=6.0, fade=0.3)],
    rail=(3, [(6.0, 3, 'done')]),
    taps=[(1.8, 187, 680, 0), (5.5, 187, 909, 0)],
    hls=[(2.5, 5.0, 24, 611, 327, 242, 0), (6.6, 8.6, 25, 756, 325, 131, 0)]))
S.append(dict(id='11-staff-check', dur=12, kicker='Staff · Edward', head='The office checks every sheet.', accent='checks',
    screens=[dict(img='staff-home-pending', y0=0, scroll=[(0.5, 560, 0.8)]),
             dict(img='review', at=3.0, y0=0, scroll=[(4.0, 640, 1.2), (6.0, 1820, 0.7)]),
             dict(img='review-correct', at=7.5, y0=1820, scroll=[(8.2, 2860, 0.9)]),
             dict(img='review-checked', at=10.4, y0=1000, fade=0.3)],
    taps=[(2.55, 187, 1080, 560), (7.15, 187, 2156, 1820), (9.85, 187, 3388, 2860)],
    hls=[(1.4, 2.5, 33, 722, 309, 400, 560), (3.5, 4.0, 49, 340, 277, 36, 0), (4.9, 5.9, 33, 750, 309, 640, 640), (8.4, 9.6, 33, 2118, 309, 120, 1820), (10.9, 11.6, 25, 1204, 325, 106, 1000)]))
S.append(dict(id='12-bus-costs', dur=10, kicker='Bus totals', head='Bus costs, on their own.', accent='on their own',
    screens=[dict(img='staff-home-after', y0=520)],
    hls=[(1.0, 2.4, 33, 740, 309, 110, 520), (2.6, 4.1, 33, 862, 309, 84, 520), (4.3, 5.8, 33, 946, 309, 84, 520), (6.0, 7.6, 33, 1030, 309, 84, 520), (7.9, 9.6, 25, 860, 325, 254, 520)]))
S.append(dict(id='13-repairs-members', dur=11, head='Repairs, members, drivers. One place.', accent='One place',
    screens=[dict(img='maintenance', y0=600, scroll=[(0.8, 760, 2.2)], hide=3.9),
             dict(img='members', at=3.6, y0=1100, scroll=[(4.2, 1400, 2.4)], hide=7.5),
             dict(img='drivers', at=7.2, y0=700)],
    hls=[(1.2, 3.3, 24, 823, 327, 36, 760), (4.6, 6.8, 25, 1296, 325, 86, 1400), (8.0, 10.4, 25, 899, 325, 86, 700)],
    extra_css=""".{p}-tag{position:absolute;left:72px;top:500px;font-family:var(--f-mono);font-weight:500;font-size:34px;letter-spacing:.14em;text-transform:uppercase;color:#007c84;white-space:nowrap}""",
    extra_html='<div class="{p}-tag" id="{p}-t0" data-look="tag0">Repair history</div><div class="{p}-tag" id="{p}-t1" data-look="tag1">Members</div><div class="{p}-tag" id="{p}-t2" data-look="tag2">Drivers</div>',
    extra_js="""[[0.4,3.4],[3.7,7.0],[7.3,10.6]].forEach(([a,b],i)=>{tl.fromTo(P+"t"+i,{x:-24,opacity:0},{x:0,opacity:1,duration:0.3,ease:"power3.out"},a);tl.to(P+"t"+i,{opacity:0,duration:0.2,ease:"power1.in"},b);});"""))
S.append(dict(id='14-ready-for', dur=8, kicker='Export trips', head='Ready for reports and funders.', accent='funders',
    screens=[dict(img='staff-home-after', y0=0), dict(img='export', at=1.2, fade=0.3)],
    taps=[(0.8, 300, 48, 0), (5.2, 187, 764, 0)],
    hls=[(1.8, 3.2, 16, 285, 343, 96, 0), (3.4, 4.9, 16, 441, 343, 144, 0)]))
S.append(dict(id='15-made-for', dur=9, push=False,
    screens=[dict(img='driver-home', y0=0)],
    extra_css=""".{p}-big{position:absolute;left:72px;font-family:var(--f-display);font-weight:700;font-size:120px;letter-spacing:-0.03em;line-height:1;color:#14272a;white-space:nowrap}
.{p}-big.{p}-acc2{color:#007c84}""",
    extra_html='<div class="{p}-big" id="{p}-b0" data-look="big0" style="top:170px">Big type.</div><div class="{p}-big" id="{p}-b1" data-look="big1" style="top:310px">Plain words.</div><div class="{p}-big {p}-acc2" id="{p}-b2" data-look="big2" style="top:450px">Few steps.</div>',
    extra_js="""[0.1,2.3,4.6].forEach((a,i)=>{tl.fromTo(P+"b"+i,{y:40,opacity:0,scale:1.06},{y:0,opacity:1,scale:1,duration:0.32,ease:"power3.out"},a);});
tl.fromTo(P+"phone",{scale:1},{scale:1.22,y:120,duration:2.0,ease:"power2.inOut",immediateRender:false},0.4);
tl.to(P+"phone",{scale:1,y:0,duration:1.6,ease:"power2.inOut"},6.6);
tl.to([P+"b0",P+"b1",P+"b2"],{opacity:0,y:-12,duration:0.12,ease:"power2.in",stagger:0.03},{dur}-0.2);"""))
S.append(dict(id='16-built-for', dur=9, kicker='CommuniHacks 2026', head='Built for KW AccessAbility.', accent='KW AccessAbility', head_top=360, exit_text=False, push=False,
    screens=[dict(img='driver-home', y0=0)],
    extra_css=""".{p}-brand{position:absolute;left:72px;top:150px;display:flex;align-items:center;gap:26px}
.{p}-brand img{width:110px;height:110px;object-fit:contain}
.{p}-bname{font-family:var(--f-display);font-weight:700;font-size:62px;letter-spacing:-0.02em;color:#14272a;line-height:1}
.{p}-line{position:absolute;left:72px;top:600px;font-family:var(--f-text);font-size:40px;color:#3d5356;white-space:nowrap}""",
    extra_html='<div class="{p}-brand" id="{p}-brand" data-brand="1"><img src="assets/brand/logo.png" alt=""><div class="{p}-bname">AccessBus</div></div><div class="{p}-line" id="{p}-line" data-look="line">Built at CommuniHacks 2026 for KW AccessAbility.</div>',
    extra_js="""tl.fromTo(P+"brand",{y:14,opacity:0},{y:0,opacity:1,duration:0.6,ease:"power3.out"},0.5);
tl.fromTo(P+"line",{y:16,opacity:0},{y:0,opacity:1,duration:0.4,ease:"power3.out"},1.4);
tl.fromTo(P+"phone",{y:0},{y:60,scale:0.92,duration:1.2,ease:"power3.inOut",immediateRender:false},0.2);"""))
S[15]['kicker'] = None  # the brand row takes the kicker's place
S[15]['head_top'] = 300

for s in S:
    build(s)
print('wrote', len(S), 'scenes')
