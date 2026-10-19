#!/usr/bin/env python3
"""Generate FloodPath's route, flood-segment and transport geometry.

Reads an OpenStreetMap extract (scripts/osm/streets.json, an Overpass `out geom`
dump of named Southbank/CBD streets) and routes along the real street graph
between named intersections, so every polyline in the demo sits on an actual
street. Writes src/data/geo.generated.ts.

Only needed when changing routes. The app itself never calls a network service.
Run:  python3 scripts/build-geo.py

Street data (c) OpenStreetMap contributors, available under the ODbL.
"""
import collections
import heapq
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "osm", "streets.json")
OUT = os.path.join(HERE, "..", "src", "data", "geo.generated.ts")

# Streets whose OSM ways have small gaps (unnamed links); bridge them with straight edges.
GAP_STREETS = {"Dodds Street"}

# Average speeds in metres per minute and a boarding wait for trams.
SPEED = {"walk": 80, "drive": 300, "tram": 230}
TRAM_WAIT_MIN = 3
DRIVE_PARK_MIN = 1


def hav(a, b):
    r = 6371000.0
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


# ---------------------------------------------------------------- graph
data = json.load(open(SRC))
ways = [e for e in data["elements"] if e["type"] == "way"]
pos = {}
names_at = collections.defaultdict(set)
adj = collections.defaultdict(list)  # node -> [(neighbour, metres, street)]
ends = collections.defaultdict(set)
for w in ways:
    name = w["tags"]["name"]
    for nid, g in zip(w["nodes"], w["geometry"]):
        pos[nid] = (g["lat"], g["lon"])
        names_at[nid].add(name)
    for a, b in zip(w["nodes"], w["nodes"][1:]):
        d = hav(pos[a], pos[b])
        adj[a].append((b, d, name))
        adj[b].append((a, d, name))
    ends[name].update((w["nodes"][0], w["nodes"][-1]))

for name in GAP_STREETS:
    es = list(ends[name])
    for i, a in enumerate(es):
        for b in es[i + 1:]:
            d = hav(pos[a], pos[b])
            if 20 < d < 170:
                adj[a].append((b, d * 1.4, name))
                adj[b].append((a, d * 1.4, name))


def intersection(a, b):
    hits = [n for n in pos if a in names_at[n] and b in names_at[n]]
    if not hits:
        raise SystemExit(f"no intersection {a} x {b}")
    lat = sum(pos[h][0] for h in hits) / len(hits)
    lon = sum(pos[h][1] for h in hits) / len(hits)
    return min(hits, key=lambda h: hav(pos[h], (lat, lon)))


def nearest(street, latlng):
    cands = [n for n in pos if street in names_at[n]]
    return min(cands, key=lambda n: hav(pos[n], latlng))


def shortest(a, b, allowed, junction_m=60):
    """Dijkstra along `allowed` streets. Within `junction_m` of either end any street
    may be used, so dual carriageways and junction links can be entered and left."""
    allowed = set(allowed)
    pa, pb = pos[a], pos[b]
    dist = {a: 0.0}
    prev = {}
    pq = [(0.0, a)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == b:
            break
        if d > dist.get(u, math.inf):
            continue
        for v, w, street in adj[u]:
            if street not in allowed and hav(pos[v], pa) > junction_m and hav(pos[v], pb) > junction_m:
                continue
            nd = d + w
            if nd < dist.get(v, math.inf):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(pq, (nd, v))
    if b not in dist:
        return None
    path = [b]
    while path[-1] != a:
        path.append(prev[path[-1]])
    return [pos[n] for n in reversed(path)]


def reachable(a, allowed):
    seen = {a}
    stack = [a]
    while stack:
        u = stack.pop()
        for v, _, street in adj[u]:
            if street in allowed and v not in seen:
                seen.add(v)
                stack.append(v)
    return seen


def route_leg(a, b, allowed, connector_m=120):
    """Shortest path; if the street graph is split (one-way carriageways, flyovers),
    snap one end onto the reachable carriageway and join with a short connector."""
    p = shortest(a, b, allowed)
    if p:
        return p
    allowed = set(allowed)
    best = None
    for start, end, flip in ((a, b, False), (b, a, True)):
        r = min(reachable(start, allowed), key=lambda n: hav(pos[n], pos[end]))
        gap = hav(pos[r], pos[end])
        if gap <= connector_m and (best is None or gap < best[0]):
            seg = shortest(start, r, allowed) + [pos[end]]
            best = (gap, list(reversed(seg)) if flip else seg)
    if best is None:
        raise SystemExit(f"no path {a}->{b} via {sorted(allowed)}")
    return best[1]


def simplify(pts, tol=2.0):
    """Douglas-Peucker in metres (equirectangular), keeping both ends."""
    if len(pts) < 3:
        return pts
    lat0 = math.radians(pts[0][0])

    def xy(p):
        return (math.radians(p[1]) * math.cos(lat0) * 6371000, math.radians(p[0]) * 6371000)

    P = [xy(p) for p in pts]

    def perp(i, s, e):
        (x, y), (x1, y1), (x2, y2) = P[i], P[s], P[e]
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0:
            return math.hypot(x - x1, y - y1)
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))

    keep = {0, len(pts) - 1}
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        best, idx = 0.0, None
        for i in range(s + 1, e):
            d = perp(i, s, e)
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep.add(idx)
            stack += [(s, idx), (idx, e)]
    return [pts[i] for i in sorted(keep)]


def length(pts):
    return sum(hav(a, b) for a, b in zip(pts, pts[1:]))


# ---------------------------------------------------------------- waypoints
SB, ST, SKR, GR, DO = "Southbank Boulevard", "Sturt Street", "St Kilda Road", "Grant Street", "Dodds Street"
PB, SW, FL, EL = "Princes Bridge", "Swanston Street", "Flinders Street", "Elizabeth Street"
W = {
    "ORIGIN": intersection(GR, ST),
    "STURT_SBB": intersection(ST, SB),
    "DODDS_SBB": intersection(DO, SB),
    "DODDS_GRANT": intersection(DO, GR),
    "SBB_STKR": intersection(SB, SKR),
    "GRANT_STKR": intersection(GR, SKR),
    "PB_S": intersection(PB, SKR),
    "PB_N": intersection(PB, SW),
    "FSS": intersection(FL, SW),
    "FL_ELIZ": intersection(FL, EL),
    "FL_QUEEN": intersection(FL, "Queen Street"),
    "FL_WILLIAM": intersection(FL, "William Street"),
    "ELIZ_BOURKE": intersection(EL, "Bourke Street"),
    "ELIZ_FRANKLIN": intersection(EL, "Franklin Street"),
    "ELIZ_VICTORIA": intersection(EL, "Victoria Street"),
    "ELIZ_FLEM": intersection(EL, "Flemington Road"),
    "SW_FRANKLIN": intersection(SW, "Franklin Street"),
    "SW_GRATTAN": intersection(SW, "Grattan Street"),
    "Q_FRANKLIN": intersection("Queen Street", "Franklin Street"),
    "Q_VICTORIA": intersection("Queen Street", "Victoria Street"),
    "Q_LATROBE": intersection("Queen Street", "La Trobe Street"),
    "WILLIAM_LATROBE": intersection("William Street", "La Trobe Street"),
    "PEEL_VICTORIA": intersection("Peel Street", "Victoria Street"),
    "GRATTAN_RP": intersection("Grattan Street", "Royal Parade"),
    "CITY_SBB": intersection("City Road", SB),
    "POWER_CITY": intersection("Power Street", "City Road"),
    "KW_CITY": intersection("Kings Way", "City Road"),
    "KW_FL": intersection("Kings Way", FL),
    "KW_MILES": intersection("Kings Way", "Miles Street"),
    "STURT_MILES": intersection(ST, "Miles Street"),
    "STURT_KW": intersection(ST, "Kings Way"),
    "CLAR_CITY": intersection("Clarendon Street", "City Road"),
    "DEST_QVM": nearest("Queen Street", (-37.8076, 144.9582)),
    "PROM_A": nearest("Southbank Promenade", (-37.82015, 144.96514)),
    "PROM_B": nearest("Southbank Promenade", (-37.81975, 144.96726)),
    "ALEX_A": nearest("Alexandra Avenue", (-37.82076, 144.96998)),
    "ALEX_B": nearest("Alexandra Avenue", (-37.82203, 144.97471)),
    "POWER_S": nearest("Power Street", (-37.8261, 144.9654)),
}


def line(spec):
    """spec: [start, (to, [streets]), ...] -> simplified polyline."""
    pts = [pos[W[spec[0]]]]
    cur = spec[0]
    for to, streets in spec[1:]:
        leg = simplify(route_leg(W[cur], W[to], streets))
        pts += leg[1:]
        cur = to
    return pts


# ---------------------------------------------------------------- flood segments
SEGMENTS = {
    "seg-sbb": ["STURT_SBB", ("DODDS_SBB", [SB])],
    "seg-stkr": ["GRANT_STKR", ("SBB_STKR", [SKR])],
    "seg-dodds": ["DODDS_GRANT", ("DODDS_SBB", [DO])],
    "seg-elizabeth": ["FL_ELIZ", ("ELIZ_BOURKE", [EL])],
    "seg-cityrd": ["CITY_SBB", ("POWER_CITY", ["City Road"])],
    "seg-promenade": ["PROM_A", ("PROM_B", ["Southbank Promenade"])],
    "seg-sturt-south": ["ORIGIN", ("STURT_MILES", [ST])],
    "seg-kingsway": ["KW_MILES", ("KW_CITY", ["Kings Way"])],
    "seg-flinders": ["FL_QUEEN", ("FL_WILLIAM", [FL])],
    "seg-power": ["POWER_CITY", ("POWER_S", ["Power Street"])],
    "seg-alexandra": ["ALEX_A", ("ALEX_B", ["Alexandra Avenue"])],
}

TRANSPORT = {
    "td-route1": ["STURT_MILES", ("STURT_SBB", [ST]), ("SBB_STKR", [SB])],
    "td-arts": ["GRANT_STKR", ("PB_S", [SKR])],
    "td-elizabeth": ["FL_ELIZ", ("ELIZ_VICTORIA", [EL])],
    "bus-605": ["CITY_SBB", ("KW_CITY", ["City Road"])],
    "bus-234": ["KW_CITY", ("CLAR_CITY", ["City Road"])],
}

# ---------------------------------------------------------------- routes
# Leg: (to, streets, instruction-at-arrival or None, travel kind)
P_ORIG = [
    ("STURT_SBB", [ST], "Turn right onto Southbank Blvd"),
    ("SBB_STKR", [SB], "Turn left onto St Kilda Rd"),
    ("PB_S", [SKR], "Continue onto Princes Bridge"),
    ("PB_N", [PB], "Continue onto Swanston St"),
]
P_ALT = [
    ("GRANT_STKR", [GR], "Turn left onto St Kilda Rd"),
    ("SBB_STKR", [SKR], "Continue past the Arts Centre"),
    ("PB_S", [SKR], "Continue onto Princes Bridge"),
    ("PB_N", [PB], "Continue onto Swanston St"),
]
P_DETOUR = [
    ("DODDS_GRANT", [GR], "Turn left onto Dodds St"),
    ("DODDS_SBB", [DO], "Turn right onto Southbank Blvd"),
    ("SBB_STKR", [SB], "Turn left onto St Kilda Rd"),
    ("PB_S", [SKR], "Continue onto Princes Bridge"),
    ("PB_N", [PB], "Continue onto Swanston St"),
]


def legs(prefix, kind, arrive_fss):
    out = [(to, s, ins, kind) for to, s, ins in prefix]
    out.append(("FSS", [SW], arrive_fss, kind))
    return out


def tram_prefix(prefix, board_at_origin, board_text):
    """Walk to the stop (unless at origin), then ride along the rest of the prefix."""
    out = []
    riding = board_at_origin
    for to, s, ins in prefix:
        if riding:
            out.append((to, s, None, "tram"))
        else:
            out.append((to, s, ins, "walk"))
            if to in ("GRANT_STKR", "SBB_STKR"):
                riding = True
                out[-1] = (to, s, board_text, "walk")
    return out


ROUTES = collections.OrderedDict()


def route(rid, journey, mode, label, first, legspec, blocked, avoids=(), disruptions=(), note=None):
    ROUTES[rid] = dict(id=rid, journey=journey, mode=mode, label=label, first=first, legs=legspec,
                       blocked=list(blocked), avoids=list(avoids), disruptions=list(disruptions), note=note)


# Journey 1: Flinders St Station
for mode in ("walk", "drive"):
    k = mode
    route(f"{mode}-fss-orig", "j-fss", mode, "Original", "Head north on Sturt St",
          legs(P_ORIG, k, "Arrive at Flinders St Station"), ["seg-sbb"])
    route(f"{mode}-fss-alt", "j-fss", mode, "Alternative", "Head east on Grant St",
          legs(P_ALT, k, "Arrive at Flinders St Station"), ["seg-stkr"], ["seg-sbb"])
    route(f"{mode}-fss-detour", "j-fss", mode, "Alternative", "Head east on Grant St",
          legs(P_DETOUR, k, "Arrive at Flinders St Station"), ["seg-dodds"], ["seg-sbb", "seg-stkr"])

route("transit-fss-orig", "j-fss", "transit", "Original", "Board Route 1 at Sturt St/Grant St",
      tram_prefix(P_ORIG, True, None) + [("FSS", [SW], "Get off at Flinders St Station", "tram")],
      ["seg-sbb"], disruptions=["td-route1"])
route("transit-fss-alt", "j-fss", "transit", "Alternative", "Walk east on Grant St",
      tram_prefix(P_ALT, False, "Board Route 16, 64 or 72 at St Kilda Rd/Grant St")
      + [("FSS", [SW], "Get off at Flinders St Station", "tram")],
      ["seg-stkr"], ["seg-sbb"], note="Routes 3, 5 and 6 aren't stopping at Arts Precinct. Board Route 16, 64 or 72.")
route("transit-fss-detour", "j-fss", "transit", "Alternative", "Walk east on Grant St",
      tram_prefix(P_DETOUR, False, "Board Route 16, 64 or 72 at Arts Centre")
      + [("FSS", [SW], "Get off at Flinders St Station", "tram")],
      ["seg-dodds"], ["seg-sbb", "seg-stkr"], note="Walk via Dodds St to the Arts Centre stop.")

# Journey 2: Queen Victoria Market
QVM_ELIZ_TAIL = [
    ("FL_ELIZ", [FL], "Turn right onto Elizabeth St"),
    ("ELIZ_FRANKLIN", [EL], "Turn left onto Franklin St"),
    ("Q_FRANKLIN", ["Franklin Street"], "Turn right onto Queen St"),
    ("DEST_QVM", ["Queen Street"], "Arrive at Queen Victoria Market"),
]
QVM_SW_TAIL = [
    ("SW_FRANKLIN", [SW], "Turn left onto Franklin St"),
    ("Q_FRANKLIN", ["Franklin Street"], "Turn right onto Queen St"),
    ("DEST_QVM", ["Queen Street"], "Arrive at Queen Victoria Market"),
]
WEST_DRIVE = [
    ("STURT_SBB", [ST], "Turn left onto Southbank Blvd", "drive"),
    ("CITY_SBB", [SB], "Continue onto City Rd", "drive"),
    ("KW_CITY", ["City Road"], "Turn right onto Kings Way", "drive"),
    ("KW_FL", ["Kings Way"], "Turn right onto Flinders St", "drive"),
    ("FL_WILLIAM", [FL], "Turn left onto William St", "drive"),
]


def tail(t, kind):
    return [(to, s, ins, kind) for to, s, ins in t]


for mode in ("walk", "drive"):
    route(f"{mode}-qvm-orig", "j-qvm", mode, "Original", "Head north on Sturt St",
          legs(P_ORIG, mode, "Turn left onto Flinders St") + tail(QVM_ELIZ_TAIL, mode), ["seg-sbb", "seg-elizabeth"])
route("walk-qvm-alt", "j-qvm", "walk", "Alternative", "Head east on Grant St",
      legs(P_ALT, "walk", "Continue on Swanston St") + tail(QVM_SW_TAIL, "walk"), ["seg-stkr"], ["seg-sbb", "seg-elizabeth"])
route("walk-qvm-detour", "j-qvm", "walk", "Alternative", "Head east on Grant St",
      legs(P_DETOUR, "walk", "Continue on Swanston St") + tail(QVM_SW_TAIL, "walk"), ["seg-dodds"],
      ["seg-sbb", "seg-stkr", "seg-elizabeth"])
route("drive-qvm-alt", "j-qvm", "drive", "Alternative", "Head north on Sturt St",
      WEST_DRIVE + [
          ("WILLIAM_LATROBE", ["William Street"], "Turn right onto La Trobe St", "drive"),
          ("Q_LATROBE", ["La Trobe Street"], "Turn left onto Queen St", "drive"),
          ("DEST_QVM", ["Queen Street"], "Arrive at Queen Victoria Market", "drive"),
      ], ["seg-cityrd"], ["seg-sbb", "seg-elizabeth"])
route("transit-qvm-orig", "j-qvm", "transit", "Original", "Board Route 1 at Sturt St/Grant St",
      tram_prefix(P_ORIG, True, None) + [
          ("FSS", [SW], "Get off at Flinders St Station", "tram"),
          ("FL_ELIZ", [FL], "Board Route 19 at Elizabeth St", "walk"),
          ("ELIZ_VICTORIA", [EL], "Get off at Queen Victoria Market", "tram"),
          ("Q_VICTORIA", ["Victoria Street"], "Turn left onto Queen St", "walk"),
          ("DEST_QVM", ["Queen Street"], "Arrive at Queen Victoria Market", "walk"),
      ], ["seg-sbb", "seg-elizabeth"], disruptions=["td-route1", "td-elizabeth"])
route("transit-qvm-alt", "j-qvm", "transit", "Alternative", "Walk east on Grant St",
      tram_prefix(P_ALT, False, "Board Route 16, 64 or 72 at St Kilda Rd/Grant St") + [
          ("FSS", [SW], None, "tram"),
          ("SW_FRANKLIN", [SW], "Get off at Franklin St", "tram"),
          ("Q_FRANKLIN", ["Franklin Street"], "Turn right onto Queen St", "walk"),
          ("DEST_QVM", ["Queen Street"], "Arrive at Queen Victoria Market", "walk"),
      ], ["seg-stkr"], ["seg-sbb", "seg-elizabeth"],
      note="Routes 19, 57 and 59 are suspended on Elizabeth St. Ride Swanston St trams instead.")
route("transit-qvm-detour", "j-qvm", "transit", "Alternative", "Walk east on Grant St",
      tram_prefix(P_DETOUR, False, "Board Route 16, 64 or 72 at Arts Centre") + [
          ("FSS", [SW], None, "tram"),
          ("SW_FRANKLIN", [SW], "Get off at Franklin St", "tram"),
          ("Q_FRANKLIN", ["Franklin Street"], "Turn right onto Queen St", "walk"),
          ("DEST_QVM", ["Queen Street"], "Arrive at Queen Victoria Market", "walk"),
      ], ["seg-dodds"], ["seg-sbb", "seg-stkr", "seg-elizabeth"], note="Walk via Dodds St to the Arts Centre stop.")

# Journey 3: Royal Melbourne Hospital
RMH_ELIZ_TAIL = [
    ("FL_ELIZ", [FL], "Turn right onto Elizabeth St"),
    ("ELIZ_FLEM", [EL], "Keep right onto Royal Parade"),
    ("GRATTAN_RP", ["Royal Parade", "Flemington Road", EL], "Arrive at Royal Melbourne Hospital"),
]
RMH_SW_TAIL = [
    ("SW_GRATTAN", [SW], "Turn left onto Grattan St"),
    ("GRATTAN_RP", ["Grattan Street"], "Arrive at Royal Melbourne Hospital"),
]
for mode in ("walk", "drive"):
    route(f"{mode}-rmh-orig", "j-rmh", mode, "Original", "Head north on Sturt St",
          legs(P_ORIG, mode, "Turn left onto Flinders St") + tail(RMH_ELIZ_TAIL, mode), ["seg-sbb", "seg-elizabeth"])
route("walk-rmh-alt", "j-rmh", "walk", "Alternative", "Head east on Grant St",
      legs(P_ALT, "walk", "Continue on Swanston St") + tail(RMH_SW_TAIL, "walk"), ["seg-stkr"], ["seg-sbb", "seg-elizabeth"])
route("walk-rmh-detour", "j-rmh", "walk", "Alternative", "Head east on Grant St",
      legs(P_DETOUR, "walk", "Continue on Swanston St") + tail(RMH_SW_TAIL, "walk"), ["seg-dodds"],
      ["seg-sbb", "seg-stkr", "seg-elizabeth"])
route("drive-rmh-alt", "j-rmh", "drive", "Alternative", "Head north on Sturt St",
      WEST_DRIVE + [
          ("WILLIAM_LATROBE", ["William Street"], None, "drive"),
          ("PEEL_VICTORIA", ["William Street", "Peel Street", "Franklin Street", "Victoria Street"], "Continue onto Peel St", "drive"),
          ("GRATTAN_RP", ["Peel Street", "Flemington Road", "Royal Parade", "Grattan Street"], "Arrive at Royal Melbourne Hospital", "drive"),
      ], ["seg-cityrd"], ["seg-sbb", "seg-elizabeth"])
route("transit-rmh-orig", "j-rmh", "transit", "Original", "Board Route 1 at Sturt St/Grant St",
      tram_prefix(P_ORIG, True, None) + [
          ("FSS", [SW], "Get off at Flinders St Station", "tram"),
          ("FL_ELIZ", [FL], "Board Route 19 at Elizabeth St", "walk"),
          ("ELIZ_FLEM", [EL], None, "tram"),
          ("GRATTAN_RP", ["Royal Parade", "Flemington Road", EL], "Get off at Royal Melbourne Hospital", "tram"),
      ], ["seg-sbb", "seg-elizabeth"], disruptions=["td-route1", "td-elizabeth"])
route("transit-rmh-alt", "j-rmh", "transit", "Alternative", "Walk east on Grant St",
      tram_prefix(P_ALT, False, "Board Route 16 at St Kilda Rd/Grant St") + [
          ("FSS", [SW], None, "tram"),
          ("SW_GRATTAN", [SW], "Get off at Melbourne University", "tram"),
          ("GRATTAN_RP", ["Grattan Street"], "Arrive at Royal Melbourne Hospital", "walk"),
      ], ["seg-stkr"], ["seg-sbb", "seg-elizabeth"],
      note="Route 19 is suspended on Elizabeth St. Ride Route 16 up Swanston St instead.")
route("transit-rmh-detour", "j-rmh", "transit", "Alternative", "Walk east on Grant St",
      tram_prefix(P_DETOUR, False, "Board Route 16 at Arts Centre") + [
          ("FSS", [SW], None, "tram"),
          ("SW_GRATTAN", [SW], "Get off at Melbourne University", "tram"),
          ("GRATTAN_RP", ["Grattan Street"], "Arrive at Royal Melbourne Hospital", "walk"),
      ], ["seg-dodds"], ["seg-sbb", "seg-stkr", "seg-elizabeth"], note="Walk via Dodds St to the Arts Centre stop.")


def build(r):
    pts = [pos[W["ORIGIN"]]]
    steps = [{"instruction": r["first"], "at": pos[W["ORIGIN"]]}]
    minutes = 0.0
    boarded = False
    cur = "ORIGIN"
    for to, streets, ins, kind in r["legs"]:
        leg = simplify(route_leg(W[cur], W[to], streets))
        d = length(leg)
        if kind == "tram" and not boarded:
            minutes += TRAM_WAIT_MIN
            boarded = True
        if kind == "walk":
            boarded = False
        minutes += d / SPEED[kind]
        pts += leg[1:]
        if ins:
            steps.append({"instruction": ins, "at": pos[W[to]]})
        cur = to
    if r["mode"] == "drive":
        minutes += DRIVE_PARK_MIN
    return pts, steps, length(pts), max(1, math.ceil(minutes))


def fmt(p):
    return f"[{p[0]:.5f}, {p[1]:.5f}]"


def fmt_line(pts):
    return "[" + ", ".join(fmt(p) for p in pts) + "]"


def midpoint(pts):
    total = length(pts)
    acc = 0.0
    for a, b in zip(pts, pts[1:]):
        d = hav(a, b)
        if acc + d >= total / 2:
            t = (total / 2 - acc) / d if d else 0
            return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        acc += d
    return pts[-1]


out = []
out.append("// AUTO-GENERATED by scripts/build-geo.py. Do not edit by hand.")
out.append("// Street geometry (c) OpenStreetMap contributors, ODbL.")
out.append("import type { LatLng, RouteOption } from './types';")
out.append("")
out.append("export const WAYPOINTS = {")
for k, n in W.items():
    out.append(f"  {k}: {fmt(pos[n])} as LatLng,")
out.append("};")
out.append("")
out.append("export const SEGMENT_GEOMETRY: Record<string, LatLng[]> = {")
seg_lines = {}
for k, spec in SEGMENTS.items():
    seg_lines[k] = line(spec)
    out.append(f"  '{k}': {fmt_line(seg_lines[k])},")
out.append("};")
out.append("")
out.append("export const SEGMENT_MIDPOINTS: Record<string, LatLng> = {")
for k, pts in seg_lines.items():
    out.append(f"  '{k}': {fmt(midpoint(pts))},")
out.append("};")
out.append("")
out.append("export const TRANSPORT_GEOMETRY: Record<string, LatLng[]> = {")
for k, spec in TRANSPORT.items():
    out.append(f"  '{k}': {fmt_line(line(spec))},")
out.append("};")
out.append("")
out.append("export const JOURNEY_ROUTES: Record<string, RouteOption[]> = {")
by_journey = collections.OrderedDict()
for r in ROUTES.values():
    by_journey.setdefault(r["journey"], []).append(r)
for j, rs in by_journey.items():
    out.append(f"  '{j}': [")
    for r in rs:
        pts, steps, metres, eta = build(r)
        print(f"{r['id']:22s} {metres/1000:5.2f} km {eta:3d} min  {len(pts):3d} pts  {len(steps)} steps")
        out.append("    {")
        out.append(f"      id: '{r['id']}', mode: '{r['mode']}', label: '{r['label']}',")
        out.append(f"      etaMinutes: {eta}, distanceKm: {metres / 1000:.2f},")
        out.append(f"      blockedSegmentIds: {json.dumps(r['blocked'])}, avoidsSegmentIds: {json.dumps(r['avoids'])},")
        if r["disruptions"]:
            out.append(f"      disruptionIds: {json.dumps(r['disruptions'])},")
        if r["note"]:
            out.append(f"      note: {json.dumps(r['note'])},")
        out.append(f"      geometry: {fmt_line(pts)},")
        out.append("      steps: [")
        for s in steps:
            out.append(f"        {{ instruction: {json.dumps(s['instruction'])}, at: {fmt(s['at'])} }},")
        out.append("      ],")
        out.append("    },")
    out.append("  ],")
out.append("};")
out.append("")

with open(OUT, "w") as f:
    f.write("\n".join(out))
print("wrote", os.path.relpath(OUT))
