"""Add New Haven / Connecticut (real places only) to data/full. Safe to re-run.

Facts checked on 2026-11-14 (web search + websites load). Hours and prices are NOT invented: where
we don't know them, schedule is null and the card points to the official site.
Run from the repo folder:  python scripts/add_new_haven.py
"""
import json
from pathlib import Path

FULL = Path(__file__).resolve().parent.parent / "data" / "full"
CHECK = "Check today's hours on their website before you go"


def load(name):
    return json.loads((FULL / f"{name}.json").read_text(encoding="utf-8"))


def save(name, obj):
    (FULL / f"{name}.json").write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


HOTSPOT = {
    "id": "new-haven-ct", "city": "New Haven", "state": "CT", "region": "Northeast",
    "aliases": ["connecticut", "yale", "hartford", "wallingford", "new haven ct"],
    "lat": 41.31, "lon": -72.92,
    "scores": {"transit_curb_cuts": 72, "inclusive_playgrounds": 64, "medicaid_waiver": 78,
               "pediatric_specialty": 86, "inclusive_schools": 70},
    "tagline": "Free world-class museums you can roll right into, a children's hospital in town, and Connecticut's only sled hockey team nearby.",
    "highlights": [
        "Yale New Haven Children's Hospital is downtown; Connecticut Children's is in Hartford",
        "Free admission at the Yale Peabody Museum, Yale University Art Gallery and Yale Center for British Art",
        "Gaylord Sports Association (Wallingford) runs 17 adaptive sports and Connecticut's only sled hockey team (ages 16+)",
        "Connecticut's HUSKY Health, Birth to Three and CPAC's free IEP help",
    ],
    "pediatric_hospitals": ["Yale New Haven Children's Hospital", "Connecticut Children's (Hartford)"],
    "inclusive_playgrounds": ["Ask New Haven Parks & Recreation which playgrounds have rubber surfacing and ramps",
                              "The New Haven Green's flat paths make an easy downtown outing"],
    "transit_notes": "CT Transit buses have ramps, and ADA paratransit serves Greater New Haven for riders who can't use fixed routes (CTrides.com lists options). Downtown and the Green are flat; East Rock and the hills are steep.",
    "waiver_notes": "HUSKY Health is Connecticut's Medicaid/CHIP for kids, including EPSDT for under-21s. Birth to Three covers babies and toddlers. Ask the Department of Social Services about home- and community-based waivers for children, which can have waitlists.",
    "school_notes": "New Haven Public Schools handles IEPs; CPAC (Connecticut Parent Advocacy Center) is the state's free Parent Training and Information Center, serving families from birth to 26.",
    "insider_tips": [
        {"tip": "The Peabody has step-free entrances and big elevators, and you can request a sighted guide ahead by email.", "from": "Joy Risers tip"},
        {"tip": "Three free Yale museums sit within a few blocks; pick one per visit so nobody gets tired.", "from": "Joy Risers tip"},
        {"tip": "Teens 16+ can try sled hockey with the Gaylord Wolfpack in Wallingford.", "from": "Joy Risers tip"},
    ],
    "watch_outs": ["Snowy, icy winters on sidewalks and curb cuts", "Hilly neighborhoods beyond downtown",
                   "Few youth (under 16) adaptive sports teams in-state; ask Gaylord and CPAC about options"],
    "cost_of_living": "moderate",
}


def act(i, **kw):
    base = {"id": f"act-{i}", "hotspot_id": "new-haven-ct", "city": "New Haven", "state": "CT", "caregiver_tip": "",
            "venue": "", "neighborhood": "", "schedule": None, "how_to_join": "", "website": ""}
    base.update(kw)
    return base


ACTIVITIES = [
    act(180, name="Yale Peabody Museum", category="sensory_friendly_museum",
        access=["wheelchair", "walker", "cane", "vision"], ages=["0-5", "6-12", "13-17", "18-21"],
        cost_tier="free", price_note="Free admission", setting="indoor",
        description="Dinosaurs, including the famous Brontosaurus in the Great Hall, in a museum reopened after a big renovation. Free for everyone, every visit.",
        accessibility_notes=["Step-free entrances with ramps and large elevators inside",
                             "Accessible parking at Whitney Avenue & Humphrey Street (lot 22v)",
                             "Sighted guides available on request in advance by email"],
        best_time=CHECK, venue="Yale Peabody Museum", neighborhood="Science Hill / Whitney Avenue",
        how_to_join="Just walk in; admission is free.", website="https://peabody.yale.edu",
        caregiver_tip="Spanish-speaking tour guides lead several tours each week."),
    act(181, name="Yale University Art Gallery", category="sensory_friendly_museum",
        access=["wheelchair", "walker", "cane"], ages=["6-12", "13-17", "18-21"],
        cost_tier="free", price_note="Free admission", setting="indoor",
        description="One of the country's oldest university art museums, with everything from ancient art to modern masterpieces. A calm, free indoor outing.",
        accessibility_notes=["See the gallery's accessibility page for entrances and elevators",
                             "Quiet galleries with room to roll", "Ask at the desk about seating and rest spots"],
        best_time=CHECK, venue="Yale University Art Gallery, Chapel Street", neighborhood="Downtown / Yale campus",
        how_to_join="Free; just walk in.", website="https://artgallery.yale.edu"),
    act(182, name="Yale Center for British Art", category="sensory_friendly_museum",
        access=["wheelchair", "walker", "cane"], ages=["6-12", "13-17", "18-21"],
        cost_tier="free", price_note="Free admission", setting="indoor",
        description="Light-filled galleries of paintings, prints and sculpture in a landmark building. Free, peaceful and easy to explore in a short visit.",
        accessibility_notes=["Check their visit page for accessible entrances and elevators",
                             "Galleries are spacious and calm", "Ask about family activity guides"],
        best_time=CHECK, venue="Yale Center for British Art, Chapel Street", neighborhood="Downtown / Yale campus",
        how_to_join="Free; just walk in.", website="https://britishart.yale.edu"),
    act(183, name="New Haven Free Public Library Storytimes", category="library_storytime",
        access=["wheelchair", "walker", "cane", "vision", "hearing"], ages=["0-5"],
        cost_tier="free", price_note="Free", setting="indoor",
        description="Songs, books and wiggles for little ones at New Haven's library branches. A free, cozy outing on a cold day.",
        accessibility_notes=["Ask your branch about accessible entrances and seating",
                             "Libraries can help with large print and audiobooks", "Check the calendar for sensory-friendly events"],
        best_time="Check your branch's storytime calendar", venue="New Haven Free Public Library branches",
        neighborhood="Citywide", how_to_join="Find a storytime on the library's events calendar.",
        website="https://nhfpl.org"),
    act(184, name="New Haven Green Roll & Stroll", category="accessible_trail",
        access=["wheelchair", "walker", "cane", "vision"], ages=["0-5", "6-12", "13-17", "18-21"],
        cost_tier="free", price_note="Free public green", setting="outdoor",
        description="The historic town green at the heart of downtown, with flat paths, big trees and people-watching. Pair it with a free museum a few blocks away.",
        accessibility_notes=["Flat paths across the green", "Benches around the edges",
                             "Watch for snow and ice on curb cuts in winter"],
        best_time="Open daily; sunny afternoons are lovely", venue="New Haven Green", neighborhood="Downtown",
        schedule={"days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "start": "07:00", "end": "19:00",
                  "season": "Year-round", "notes": "Public green, open every day"},
        how_to_join="Just show up."),
    act(185, name="Gaylord Sports Association: Wolfpack Sled Hockey & adaptive sports (ages 16+)",
        category="adaptive_sports", access=["wheelchair", "walker", "cane", "vision"], ages=["13-17", "18-21"],
        cost_tier="under25", price_note="Fees vary by program; confirm with Gaylord", setting="hybrid",
        description="Connecticut's largest adaptive sports program, with 17 sports, including the Gaylord Wolfpack, the state's only sled hockey team. Programs are for ages 16 and up.",
        accessibility_notes=["For people 16+ with a physical disability or visual impairment",
                             "Adaptive equipment through the program", "Recreational and competitive options year-round"],
        best_time="Sled hockey season runs roughly September to May; check their calendar",
        venue="Gaylord Sports Association", neighborhood="Wallingford (about 20 minutes from New Haven)",
        how_to_join="Contact the Gaylord Sports Association to ask about joining or a try-it day.",
        website="https://sportsassociation.gaylord.org",
        caregiver_tip="Younger than 16? Ask Gaylord and CPAC about youth options nearby."),
]

PROGRAMS = [
    {"id": "prog-036", "name": "Connecticut Tech Act Project (assistive technology loans)", "type": "loan_closet",
     "scope": "state", "states": ["CT"], "covers": ["any"], "ages": "0-21",
     "what_they_offer": "Connecticut's statewide assistive technology program (Department of Aging and Disability Services) offers low-interest loans to buy AT and connects families to equipment programs.",
     "how_to_apply": "See the CT Tech Act page on portal.ct.gov or call the program to ask about loans and device options.",
     "url": "https://portal.ct.gov/aginganddisability/content-pages/programs/connecticut-tech-act", "real_org": True},
    {"id": "prog-037", "name": "NEAT Marketplace (restored equipment)", "type": "reuse",
     "scope": "state", "states": ["CT"], "covers": ["any"], "ages": "0-21",
     "what_they_offer": "Restores donated adaptive devices and medical equipment so families can buy them for less than new.",
     "how_to_apply": "Browse what's available on their site or call to ask about specific equipment.",
     "url": "https://www.neatmarketplace.org", "real_org": True},
]

GROUP = {"id": "group-cpac", "name": "CPAC: Connecticut Parent Advocacy Center (free IEP help)",
         "audience": ["all", "foster_resource", "kinship", "grandparents"], "format": "hybrid", "city": "", "state": "CT",
         "schedule": "Call or email for one-on-one help and workshops",
         "description": "Connecticut's statewide Parent Training and Information Center: free support for families of children with any disability, from birth to 26, including help preparing for IEP meetings.",
         "url": "https://cpacinc.org", "real_org": True}

h = load("hotspots")
h["hotspots"] = [x for x in h["hotspots"] if x["id"] != HOTSPOT["id"]] + [HOTSPOT]
save("hotspots", h)
a = load("activities")
a["activities"] = [x for x in a["activities"] if x["hotspot_id"] != HOTSPOT["id"]] + ACTIVITIES
save("activities", a)
p = load("equipment_programs")
ids = {x["id"] for x in PROGRAMS}
p["programs"] = [x for x in p["programs"] if x["id"] not in ids] + PROGRAMS
save("equipment_programs", p)
s = load("sanctuary")
s["support_groups"] = [x for x in s["support_groups"] if x["id"] != GROUP["id"]] + [GROUP]
save("sanctuary", s)
print(f"hotspots={len(h['hotspots'])} activities={len(a['activities'])} programs={len(p['programs'])} groups={len(s['support_groups'])}")
