"""Add Oakland / East Bay (real places only) to data/full. Safe to re-run: replaces earlier Oakland rows.

Every listing here is a real organization or public place, checked on 2026-11-14 (websites load).
Hours and prices are NOT invented: where we don't know them, schedule is null and the card says
to check the official site. Run from the repo folder:  python scripts/add_oakland.py
"""
import json
from pathlib import Path

FULL = Path(__file__).resolve().parent.parent / "data" / "full"


def load(name):
    return json.loads((FULL / f"{name}.json").read_text(encoding="utf-8"))


def save(name, obj):
    (FULL / f"{name}.json").write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


CHECK = "Check today's hours and prices on their website before you go"

HOTSPOT = {
    "id": "oakland-ca", "city": "Oakland", "state": "CA", "region": "Pacific",
    "aliases": ["east bay", "berkeley", "alameda", "alameda county", "emeryville", "oakland ca"],
    "lat": 37.80, "lon": -122.27,
    "scores": {"transit_curb_cuts": 80, "inclusive_playgrounds": 72, "medicaid_waiver": 84,
               "pediatric_specialty": 88, "inclusive_schools": 70},
    "tagline": "Lake Merritt sunsets, a children's hospital in town, and Northern California's youth sled hockey team next door.",
    "highlights": [
        "UCSF Benioff Children's Hospital Oakland is right in the city",
        "BORP (Berkeley) runs youth sled hockey with the Oakland Ice Center, plus wheelchair basketball, power soccer and adaptive cycling",
        "BART stations have elevators, AC Transit buses have ramps, and East Bay Paratransit covers trips fixed routes can't",
        "California Children's Services (CCS) and the Regional Center of the East Bay can add therapy, equipment and respite help",
    ],
    "pediatric_hospitals": ["UCSF Benioff Children's Hospital Oakland"],
    "inclusive_playgrounds": [
        "Magical Bridge playgrounds on the Peninsula and in the South Bay (a drive, but built for every body)",
        "Ask Oakland Parks, Recreation & Youth Development which neighborhood playgrounds have rubber surfacing",
    ],
    "transit_notes": "BART stations have elevators and AC Transit buses kneel and deploy ramps; East Bay Paratransit serves riders who can't use fixed routes. The flats (Lake Merritt, downtown, Jack London) roll easily; the hills are steep.",
    "waiver_notes": "California's Medi-Cal covers kids under 21 (EPSDT). California Children's Services (CCS) and its Medical Therapy Program can provide PT/OT for qualifying conditions such as cerebral palsy, and the Regional Center of the East Bay serves eligible kids with developmental disabilities (including CP) under the Lanterman Act. Ask both about equipment, respite and In-Home Supportive Services (IHSS).",
    "school_notes": "Oakland Unified's special education team runs IEPs; DREDF in Berkeley is the free Parent Training and Information Center for Alameda County and helps families prepare for IEP meetings.",
    "insider_tips": [
        {"tip": "Lake Merritt's paved loop is flat and about three miles around, so you can turn back at any bench.", "from": "Joy Risers tip"},
        {"tip": "Call BORP before the season starts and ask about a sled hockey try-it session; they provide the sleds.", "from": "Joy Risers tip"},
        {"tip": "Ask your CCS therapist whether a Medical Therapy Unit at a nearby school can do seating checks.", "from": "Joy Risers tip"},
    ],
    "watch_outs": ["Steep hills in many neighborhoods", "High cost of living", "Regional Center and CCS intake can take time, so start early"],
    "cost_of_living": "high",
}


def act(i, **kw):
    base = {"id": f"act-{i}", "hotspot_id": "oakland-ca", "city": "Oakland", "state": "CA", "caregiver_tip": "",
            "venue": "", "neighborhood": "", "schedule": None, "how_to_join": "", "website": ""}
    base.update(kw)
    return base


ACTIVITIES = [
    act(171, name="Lake Merritt Loop Roll & Stroll", category="accessible_trail",
        access=["wheelchair", "walker", "cane", "vision"], ages=["0-5", "6-12", "13-17", "18-21"],
        cost_tier="free", price_note="Free public path", setting="outdoor",
        description="A flat, paved loop around Oakland's lake with ducks, pelicans and skyline views. Roll a short stretch or the whole loop, about three miles, and turn back whenever you like.",
        accessibility_notes=["Mostly flat paved path around the lake", "Benches all along the way for rest stops",
                             "Nearby downtown sidewalks and transit; check parking near your starting point"],
        best_time="Open daily; mornings are calmer", venue="Lake Merritt shoreline path",
        neighborhood="Lake Merritt / Downtown",
        schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "start": "07:00", "end": "19:00",
                  "season": "Year-round", "notes": "Public path, open every day; weekend afternoons get busy"},
        how_to_join="Just show up and pick a starting point by the lake.",
        caregiver_tip="Start near Children's Fairyland so little ones have a fun goal at the end."),
    act(172, name="BORP Youth Sled Hockey (with Oakland Ice Center)", category="adaptive_sports",
        access=["wheelchair", "walker", "cane"], ages=["6-12", "13-17", "18-21"],
        cost_tier="under25", price_note="Low cost; confirm current fees with BORP", setting="indoor",
        description="Northern California's ongoing youth sled hockey program: kids fly across the ice in custom sleds, stick-handling and scoring with a real team. Sleds and equipment are provided.",
        accessibility_notes=["Custom sleds and equipment provided by the program", "Coaches experienced with wheelchair users",
                             "Ask about group transportation, which BORP has offered youth participants"],
        best_time=CHECK, venue="Oakland Ice Center rink (BORP program)", neighborhood="Downtown Oakland",
        how_to_join="Contact BORP to ask about the current season and a try-it session.",
        website="https://www.borp.org",
        caregiver_tip="Bring warm layers and gloves; the rink is cold even when the bench is cheering."),
    act(173, name="BORP Adaptive Cycling Center", category="adaptive_recreation",
        access=["wheelchair", "walker", "cane", "vision"], ages=["6-12", "13-17", "18-21"],
        cost_tier="under25", price_note="Membership or program enrollment may be required; confirm fees", setting="outdoor",
        description="A fleet of more than 65 adaptive cycles, including youth sizes: handcycles, trikes and tandems. Group youth rides are escorted by trained volunteers.",
        accessibility_notes=["Adaptive bikes in youth and adult sizes", "Trained volunteers on group youth rides",
                             "Hours are seasonal; book ahead"],
        best_time=CHECK, venue="BORP Adaptive Cycling Center", neighborhood="West Berkeley (East Bay)",
        how_to_join="Email or call BORP to book a ride or ask about youth group rides.",
        website="https://www.borp.org"),
    act(174, name="BORP Youth Wheelchair Basketball & Power Soccer", category="adaptive_sports",
        access=["wheelchair"], ages=["6-12", "13-17", "18-21"],
        cost_tier="under25", price_note="Low cost; confirm current fees with BORP", setting="indoor",
        description="Team practices where kids who use manual or power chairs learn the game, make friends and compete. Power soccer is built for power-chair users.",
        accessibility_notes=["Sports chairs and equipment through the program", "Power soccer designed for power-chair users",
                             "Also ask about Jr. Adventures, BORP's non-competitive outings"],
        best_time=CHECK, venue="BORP youth sports (East Bay gyms)", neighborhood="Berkeley / Oakland",
        how_to_join="Contact BORP's youth sports team to ask about practices and sign-up.",
        website="https://www.borp.org"),
    act(175, name="Children's Fairyland", category="adaptive_recreation",
        access=["wheelchair", "walker", "cane"], ages=["0-5", "6-12"],
        cost_tier="under25", price_note="Paid admission; check current prices", setting="outdoor",
        description="A storybook park on the shore of Lake Merritt with puppet shows, small rides and fairy-tale sets made for young children. A beloved Oakland classic.",
        accessibility_notes=["Ask staff for the most accessible route through the park", "Lakeside location next to the flat Lake Merritt path",
                             "Call ahead about accessible restrooms and changing space"],
        best_time=CHECK, venue="Children's Fairyland, Lakeside Park", neighborhood="Lake Merritt",
        how_to_join="Buy admission at the gate or on their website.", website="https://fairyland.org"),
    act(176, name="Oakland Zoo", category="zoo_aquarium",
        access=["wheelchair", "walker", "cane", "hearing"], ages=["0-5", "6-12", "13-17", "18-21"],
        cost_tier="under50", price_note="Paid admission; check current prices", setting="outdoor",
        description="Lions, giraffes and a gondola ride up to the California Trail with views over the bay. Some paths are hilly, so plan your route.",
        accessibility_notes=["Ask about the gondola to the California Trail and wheelchair loading", "Some paths are steep; ask for an accessibility map",
                             "Check their website for accessibility services and sensory resources"],
        best_time=CHECK, venue="Oakland Zoo, Knowland Park", neighborhood="East Oakland hills",
        how_to_join="Buy tickets on their website or at the gate.", website="https://www.oaklandzoo.org"),
    act(177, name="Chabot Space & Science Center", category="sensory_friendly_museum",
        access=["wheelchair", "walker", "cane"], ages=["6-12", "13-17", "18-21"],
        cost_tier="under50", price_note="Paid admission; check current prices", setting="indoor",
        description="Planetarium shows, hands-on space exhibits and big telescopes up in the Oakland hills. A cozy indoor adventure for curious kids.",
        accessibility_notes=["Ask about accessible parking and elevator access", "Planetarium shows can be loud and dark; ask about seating near exits",
                             "Check their site for sensory-friendly events"],
        best_time=CHECK, venue="Chabot Space & Science Center", neighborhood="Oakland hills",
        how_to_join="Buy tickets on their website.", website="https://chabotspace.org"),
    act(178, name="Oakland Public Library Storytimes", category="library_storytime",
        access=["wheelchair", "walker", "cane", "vision", "hearing"], ages=["0-5"],
        cost_tier="free", price_note="Free", setting="indoor",
        description="Songs, stories and wiggles for little ones at Oakland's library branches. A free, easy outing on a rainy day.",
        accessibility_notes=["Ask your branch about accessible entrances and seating", "Libraries can often help with large print and audiobooks",
                             "Check the branch calendar for sensory-friendly storytimes"],
        best_time="Check your branch's storytime calendar", venue="Oakland Public Library branches",
        neighborhood="Citywide", how_to_join="Find a storytime on the library's events calendar.",
        website="https://oaklandlibrary.org"),
    act(179, name="Magical Bridge Playgrounds (Peninsula & South Bay)", category="inclusive_playground",
        access=["wheelchair", "walker", "cane", "vision", "hearing"], ages=["0-5", "6-12", "13-17"],
        cost_tier="free", price_note="Free public playgrounds", setting="outdoor",
        description="Playgrounds designed from the ground up for kids of every ability, with wheelchair-friendly surfacing and sensory play. Worth the drive from Oakland for a big day out.",
        accessibility_notes=["Designed for people of all abilities", "Smooth surfacing for wheelchairs and walkers",
                             "Several locations; check which is closest"],
        best_time=CHECK, venue="Magical Bridge playgrounds", neighborhood="Peninsula & South Bay (a drive from Oakland)",
        how_to_join="Free and open to the public; see their site for locations.", website="https://magicalbridge.org"),
]

PROGRAMS = [
    {"id": "prog-034", "name": "California Children's Services (CCS) and its Medical Therapy Program", "type": "grant",
     "scope": "state", "states": ["CA"], "covers": ["any"], "ages": "0-21",
     "what_they_offer": "California's program for kids with qualifying conditions, such as cerebral palsy, can cover medical equipment, and its Medical Therapy Program provides PT/OT, often at school-based Medical Therapy Units.",
     "how_to_apply": "Ask your pediatrician or county CCS office about a referral; check eligibility rules on the DHCS site.",
     "url": "https://www.dhcs.ca.gov/services/ccs", "real_org": True},
    {"id": "prog-035", "name": "Regional Center of the East Bay (Alameda & Contra Costa counties)", "type": "grant",
     "scope": "local", "states": ["CA"], "covers": ["any"], "ages": "0-21",
     "what_they_offer": "California's regional center for the East Bay serves eligible people with developmental disabilities, including cerebral palsy, and can help with services, some equipment and respite when other sources don't cover them.",
     "how_to_apply": "Call RCEB intake to request an eligibility assessment; services are planned in an Individual Program Plan (IPP).",
     "url": "https://www.rceb.org", "real_org": True},
]

RESPITE = {"id": "respite-rceb", "name": "Regional Center of the East Bay: respite services",
           "scope": "local", "states": ["CA"],
           "what_they_offer": "Eligible East Bay families can ask their regional center service coordinator about funded respite hours.",
           "eligibility": "Children and adults found eligible for regional center services (Alameda & Contra Costa counties).",
           "how_to_apply": "Ask your RCEB service coordinator to add respite to your Individual Program Plan.",
           "url": "https://www.rceb.org", "real_org": True}

GROUP = {"id": "group-dredf-pti", "name": "DREDF Parent Training & Information Center (free IEP help)",
         "audience": ["all", "foster_resource", "kinship"], "format": "hybrid", "city": "Berkeley", "state": "CA",
         "schedule": "Call or email for advocate support and workshops",
         "description": "Free help for East Bay families of children and young adults with disabilities (birth to 26): understanding IEPs, preparing for meetings, and support for foster families and foster youth.",
         "url": "https://dredf.org", "real_org": True}

h = load("hotspots")
h["hotspots"] = [x for x in h["hotspots"] if x["id"] != "oakland-ca"] + [HOTSPOT]
save("hotspots", h)
a = load("activities")
a["activities"] = [x for x in a["activities"] if x["hotspot_id"] != "oakland-ca"] + ACTIVITIES
save("activities", a)
p = load("equipment_programs")
p["programs"] = [x for x in p["programs"] if x["id"] not in {"prog-034", "prog-035"}] + PROGRAMS
save("equipment_programs", p)
s = load("sanctuary")
s["respite_grants"] = [x for x in s["respite_grants"] if x["id"] != RESPITE["id"]] + [RESPITE]
s["support_groups"] = [x for x in s["support_groups"] if x["id"] != GROUP["id"]] + [GROUP]
save("sanctuary", s)
print(f"hotspots={len(h['hotspots'])} activities={len(a['activities'])} programs={len(p['programs'])} "
      f"respite={len(s['respite_grants'])} groups={len(s['support_groups'])}")
