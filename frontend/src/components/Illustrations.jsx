// Hand-built SVG cartoons: diverse kids, teens and caregivers using wheelchairs, power chairs,
// canes (incl. white canes), walkers and hearing aids — playing, exploring, laughing.
// Pure SVG + CSS animations (see index.css), no image files.

const NAVY = '#14213D'

export function Head({ x = 0, y = 0, r = 13, skin, hair, style = 'short', accent = '#E8A317', hearing = false, glasses = false }) {
  const back = {
    // shoulder-length hair with a wavy edge that stops at chin level (no drape below the face)
    long: <path d={`M${x - r - 2},${y - 3} Q${x - r - 4},${y + 6} ${x - r - 3},${y + r - 1} Q${x - r + 1},${y + r + 3} ${x - r + 4},${y + r - 2} L${x + r - 4},${y + r - 2} Q${x + r - 1},${y + r + 3} ${x + r + 3},${y + r - 1} Q${x + r + 4},${y + 6} ${x + r + 2},${y - 3} Z`} fill={hair} />,
    // two bouncy pigtails with Dodger Blue hair ties
    pigtails: <g><ellipse cx={x - r - 5} cy={y + 3} rx="5" ry="8.5" transform={`rotate(18 ${x - r - 5} ${y + 3})`} fill={hair} /><ellipse cx={x + r + 5} cy={y + 3} rx="5" ry="8.5" transform={`rotate(-18 ${x + r + 5} ${y + 3})`} fill={hair} /><circle cx={x - r - 1} cy={y - 4} r="2.4" fill="#1E90FF" /><circle cx={x + r + 1} cy={y - 4} r="2.4" fill="#1E90FF" /></g>,
    locs: <g stroke={hair} strokeWidth="3.2" strokeLinecap="round">{[-10, -6, -2, 2, 6, 10].map((d) => <line key={d} x1={x + d} y1={y - 4} x2={x + d * 1.25} y2={y + r + 10} />)}</g>,
    braids: <g fill={hair}><circle cx={x - r - 2} cy={y + 8} r="3.5" /><circle cx={x - r - 3} cy={y + 15} r="3.2" /><circle cx={x + r + 2} cy={y + 8} r="3.5" /><circle cx={x + r + 3} cy={y + 15} r="3.2" /></g>,
    hijab: <path d={`M${x - r - 4},${y + 2} Q${x - r - 4},${y - r - 6} ${x},${y - r - 6} Q${x + r + 4},${y - r - 6} ${x + r + 4},${y + 2} L${x + r + 8},${y + r + 18} L${x - r - 8},${y + r + 18} Z`} fill={accent} />,
  }[style]
  const top = {
    short: <path d={`M${x - r},${y - 1} Q${x - r},${y - r - 3} ${x},${y - r - 3} Q${x + r},${y - r - 3} ${x + r},${y - 1} Q${x + 2},${y - r + 3} ${x - r},${y - 1} Z`} fill={hair} />,
    // side-swept bangs: the forehead shows, so it reads as hair
    long: <path d={`M${x - r - 1},${y + 2} Q${x - r - 1},${y - r - 3} ${x + 1},${y - r - 3} Q${x + r + 1},${y - r - 3} ${x + r + 1},${y + 2} Q${x + r - 3},${y - r + 3} ${x - 3},${y - r + 5} Q${x - r + 3},${y - r + 7} ${x - r - 1},${y + 2} Z`} fill={hair} />,
    pigtails: <path d={`M${x - r},${y} Q${x - r},${y - r - 3} ${x},${y - r - 3} Q${x + r},${y - r - 3} ${x + r},${y} Q${x + r - 3},${y - r + 3} ${x},${y - r + 2} Q${x - r + 3},${y - r + 3} ${x - r},${y} Z`} fill={hair} />,
    curly: <g fill={hair}>{[-10, -4, 3, 9].map((d, i) => <circle key={d} cx={x + d} cy={y - r + (i % 2 ? -1 : 2)} r="6" />)}<circle cx={x - r + 1} cy={y - 3} r="4.5" /><circle cx={x + r - 1} cy={y - 3} r="4.5" /></g>,
    locs: <path d={`M${x - r},${y - 1} Q${x},${y - r - 7} ${x + r},${y - 1} Q${x},${y - r + 2} ${x - r},${y - 1} Z`} fill={hair} />,
    bun: <g fill={hair}><circle cx={x} cy={y - r - 4} r="6" /><path d={`M${x - r},${y - 1} Q${x},${y - r - 5} ${x + r},${y - 1} Q${x},${y - r + 3} ${x - r},${y - 1} Z`} /></g>,
    braids: <path d={`M${x - r},${y} Q${x},${y - r - 6} ${x + r},${y} Q${x},${y - r + 3} ${x - r},${y} Z`} fill={hair} />,
    bald: null,
    hijab: null,
  }[style]
  return (
    <g>
      {back}
      <circle cx={x} cy={y} r={r} fill={skin} />
      {top}
      <circle cx={x - r * 0.36} cy={y + 1} r="1.6" fill={NAVY} />
      <circle cx={x + r * 0.36} cy={y + 1} r="1.6" fill={NAVY} />
      <path d={`M${x - 4},${y + 5.5} Q${x},${y + 9.5} ${x + 4},${y + 5.5}`} stroke={NAVY} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx={x - r * 0.62} cy={y + 5} r="2.2" fill="#E07A5F" opacity=".35" />
      <circle cx={x + r * 0.62} cy={y + 5} r="2.2" fill="#E07A5F" opacity=".35" />
      {glasses && <g stroke={NAVY} strokeWidth="1.3" fill="none"><circle cx={x - r * 0.36} cy={y + 1} r="3.6" /><circle cx={x + r * 0.36} cy={y + 1} r="3.6" /><line x1={x - 1} y1={y + 1} x2={x + 1} y2={y + 1} /></g>}
      {hearing && <g><circle cx={x + r - 1} cy={y + 1} r="2.6" fill="#1E90FF" stroke="#fff" strokeWidth="1" /></g>}
    </g>
  )
}

// Child using a manual or power wheelchair. Wheels spin; the arm waves.
export function WheelchairKid({ x = 0, y = 0, skin, hair, style, shirt = '#4A90C2', power = false, accent, hearing, wave = true, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {power && <rect x="-20" y="-30" width="34" height="14" rx="4" fill="#1B2333" />}
      <g className="anim-wheel">
        <circle cx="-2" cy="-22" r="22" fill="none" stroke={NAVY} strokeWidth="4" />
        {[0, 45, 90, 135].map((a) => <line key={a} x1="-2" y1="-22" x2={-2 + 20 * Math.cos((a * Math.PI) / 180)} y2={-22 + 20 * Math.sin((a * Math.PI) / 180)} stroke={NAVY} strokeWidth="1.4" />)}
        {[0, 45, 90, 135].map((a) => <line key={'b' + a} x1="-2" y1="-22" x2={-2 - 20 * Math.cos((a * Math.PI) / 180)} y2={-22 - 20 * Math.sin((a * Math.PI) / 180)} stroke={NAVY} strokeWidth="1.4" />)}
        <circle cx="-2" cy="-22" r="3" fill={accent || '#E8A317'} />
      </g>
      <circle cx="28" cy="-5" r="5" fill="none" stroke={NAVY} strokeWidth="3" />
      <line x1="28" y1="-10" x2="22" y2="-44" stroke={NAVY} strokeWidth="3" />
      <rect x="-16" y="-48" width="38" height="6" rx="3" fill={NAVY} />
      <line x1="-16" y1="-46" x2="-22" y2="-84" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
      {!power && <line x1="-22" y1="-84" x2="-32" y2="-84" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />}
      {power && <g><line x1="16" y1="-60" x2="24" y2="-60" stroke={NAVY} strokeWidth="3" /><line x1="24" y1="-60" x2="24" y2="-68" stroke={NAVY} strokeWidth="3" /><circle cx="24" cy="-70" r="3" fill={accent || '#C8553D'} /></g>}
      <path d="M2,-48 L24,-48 L24,-14" stroke="#1F4D3A" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="-14" y="-82" width="22" height="36" rx="9" fill={shirt} />
      <g className={wave ? 'anim-wave' : ''}><line x1="4" y1="-74" x2="18" y2="-98" stroke={skin} strokeWidth="6" strokeLinecap="round" /></g>
      <line x1="-4" y1="-72" x2="12" y2="-58" stroke={skin} strokeWidth="6" strokeLinecap="round" />
      <Head x={-2} y={-96} skin={skin} hair={hair} style={style} accent={accent} hearing={hearing} />
    </g>
  )
}

// Standing person (child or grown-up). aid: 'cane' | 'white-cane' | 'walker' | 'crutches' | null
export function StandingPerson({ x = 0, y = 0, skin, hair, style, shirt = '#C8553D', pants = '#14213D', aid = null, scale = 1, wave = false, hearing, glasses, accent, bob = false, holding = false, dress = null }) {
  // dress: a color for an ankle-length, long-sleeved dress (sleeves to the wrist, hands showing)
  const Arm = ({ x1, y1, x2, y2 }) => dress
    ? <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dress} strokeWidth="7.5" strokeLinecap="round" /><circle cx={x2} cy={y2} r="3.4" fill={skin} /></g>
    : <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={skin} strokeWidth="6" strokeLinecap="round" />
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <g className={bob ? 'anim-bob' : ''}>
        {!dress && <><line x1="-5" y1="-40" x2="-7" y2="-2" stroke={pants} strokeWidth="8" strokeLinecap="round" />
        <line x1="5" y1="-40" x2="7" y2="-2" stroke={pants} strokeWidth="8" strokeLinecap="round" /></>}
        <ellipse cx="-8" cy="0" rx="6" ry="3" fill={NAVY} />
        <ellipse cx="8" cy="0" rx="6" ry="3" fill={NAVY} />
        {dress
          ? <path d="M-11,-80 Q0,-84 11,-80 Q15,-62 16,-40 L19,-3 Q0,1 -19,-3 L-16,-40 Q-15,-62 -11,-80 Z" fill={dress} />
          : <rect x="-12" y="-78" width="24" height="42" rx="10" fill={shirt} />}
        {aid === 'walker' && (
          <g stroke="#7A8699" strokeWidth="3.5" fill="none" strokeLinecap="round">
            <line x1="16" y1="-54" x2="20" y2="0" /><line x1="30" y1="-54" x2="34" y2="0" />
            <line x1="14" y1="-54" x2="32" y2="-54" /><line x1="18" y1="-28" x2="32" y2="-28" />
            <circle cx="20" cy="0" r="3" fill="#7A8699" /><circle cx="34" cy="0" r="3" fill="#7A8699" />
          </g>
        )}
        {(aid === 'cane' || aid === 'white-cane') && (
          <g strokeLinecap="round">
            <line x1="18" y1="-50" x2="34" y2="0" stroke={aid === 'white-cane' ? '#FFFFFF' : '#8A5A2B'} strokeWidth="3.5" />
            {aid === 'white-cane' && <><line x1="18" y1="-50" x2="34" y2="0" stroke={NAVY} strokeWidth=".8" opacity=".35" /><line x1="31" y1="-9" x2="34" y2="0" stroke="#C8553D" strokeWidth="4" /></>}
            {aid === 'cane' && <path d="M18,-50 q-4,-6 -10,-2" stroke="#8A5A2B" strokeWidth="3.5" fill="none" />}
          </g>
        )}
        {aid === 'crutches' && <g stroke="#7A8699" strokeWidth="3" strokeLinecap="round"><line x1="-16" y1="-58" x2="-20" y2="0" /><line x1="16" y1="-58" x2="20" y2="0" /></g>}
        <Arm x1={-10} y1={-72} x2={aid === 'crutches' ? -17 : -18} y2={aid === 'crutches' ? -50 : -48} />
        {wave ? (
          <g className="anim-wave"><Arm x1={10} y1={-72} x2={24} y2={-98} /></g>
        ) : (
          <Arm x1={10} y1={-72} x2={aid ? 18 : holding ? 26 : 18} y2={aid ? -50 : holding ? -58 : -48} />
        )}
        <Head x={0} y={-92} skin={skin} hair={hair} style={style} hearing={hearing} glasses={glasses} accent={accent} />
      </g>
    </g>
  )
}

function Balloon({ x, y, color, delay = 0 }) {
  return (
    <g className="anim-float" style={{ animationDelay: `${delay}s` }}>
      <ellipse cx={x} cy={y} rx="11" ry="14" fill={color} />
      <path d={`M${x},${y + 14} q-4,12 2,24`} stroke={NAVY} strokeWidth="1" fill="none" opacity=".5" />
    </g>
  )
}

function Bubble({ x, y, delay }) {
  return <circle className="anim-float" style={{ animationDelay: `${delay}s` }} cx={x} cy={y} r="7" fill="#D2E9FF" stroke="#1E90FF" strokeWidth="1.4" opacity=".85" />
}

export function HeroScene() {
  return (
    <svg viewBox="0 0 900 380" className="w-full h-auto" role="img"
      aria-label="Cartoon park scene: a grandmother waves beside her grandson in a power wheelchair; two dads cheer as their daughter rolls in her wheelchair; a father walks with his son who uses a white cane; an aunt blows bubbles for her nephew who uses a walker; a teen with hearing aids and forearm crutches laughs with her guardian.">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#D7E9F5" /><stop offset="1" stopColor="#FBF6EC" /></linearGradient>
      </defs>
      <rect width="900" height="380" rx="36" fill="url(#sky)" />
      <g transform="translate(760,78)">
        <g className="anim-wheel" style={{ animationDuration: '30s' }}>
          {Array.from({ length: 12 }).map((_, i) => <line key={i} x1="0" y1="-50" x2="0" y2="-62" transform={`rotate(${i * 30})`} stroke="#E8A317" strokeWidth="4" strokeLinecap="round" />)}
        </g>
        <circle r="38" fill="#E8A317" />
      </g>
      <path d="M0,260 Q160,190 330,240 T660,230 T900,215 L900,380 L0,380 Z" fill="#B9D3A8" />
      <path d="M0,300 Q220,250 460,292 T900,280 L900,380 L0,380 Z" fill="#8FB98A" />
      <path d="M40,345 Q450,300 860,345" stroke="#EADBC2" strokeWidth="26" fill="none" strokeLinecap="round" />
      {[[95, 250], [640, 238], [860, 250]].map(([tx, ty], i) => (
        <g key={i}><rect x={tx - 4} y={ty - 10} width="8" height="40" fill="#8A5A2B" rx="3" /><circle cx={tx} cy={ty - 26} r="26" fill="#1F4D3A" /><circle cx={tx - 14} cy={ty - 14} r="16" fill="#2E6B50" /></g>
      ))}
      <Balloon x={210} y={120} color="#C8553D" delay={0} />
      <Balloon x={340} y={150} color="#1E90FF" delay={3} />
      <Balloon x={470} y={110} color="#E8A317" delay={2} />
      <Balloon x={600} y={140} color="#1E90FF" delay={4} />

      {/* Grandmother + grandson in a power chair */}
      <StandingPerson x={120} y={346} skin="#6B4226" hair="#D9D9D9" style="short" shirt="#C8553D" pants="#1F4D3A" scale={1.3} wave glasses />
      <g className="anim-roll"><WheelchairKid x={190} y={346} skin="#7A4B2A" hair="#1C1C1C" style="curly" shirt="#E8A317" power accent="#1E90FF" /></g>

      {/* Two dads cheering, daughter rolling */}
      <StandingPerson x={300} y={340} skin="#F1C9A5" hair="#5A3B22" style="short" shirt="#4A90C2" scale={1.35} wave />
      <StandingPerson x={345} y={342} skin="#3B2416" hair="#0F0F0F" style="bald" shirt="#1F4D3A" pants="#14213D" scale={1.35} />
      <g className="anim-roll" style={{ animationDelay: '-1.4s' }}><WheelchairKid x={410} y={344} skin="#C68E5C" hair="#2B1A10" style="braids" shirt="#C8553D" accent="#E8A317" /></g>

      {/* Dad + son with a white cane */}
      <StandingPerson x={520} y={340} skin="#E0AC69" hair="#1C1C1C" style="short" shirt="#E8A317" pants="#14213D" scale={1.35} holding />
      <StandingPerson x={562} y={342} skin="#D9A066" hair="#1C1C1C" style="short" shirt="#1E90FF" aid="white-cane" bob />

      {/* Aunt in hijab blowing bubbles, nephew with walker */}
      <StandingPerson x={660} y={340} skin="#B07A4F" hair="#2B1A10" style="hijab" accent="#1E90FF" dress="#E8A317" scale={1.32} wave />
      <StandingPerson x={712} y={344} skin="#8D5524" hair="#1C1C1C" style="locs" shirt="#C8553D" aid="walker" bob />
      <Bubble x={700} y={178} delay={0} /><Bubble x={738} y={196} delay={1.5} /><Bubble x={682} y={190} delay={3} />

      {/* Teen with hearing aids + forearm crutches and her guardian */}
      <StandingPerson x={800} y={344} skin="#F8DCC8" hair="#EBC35E" style="pigtails" shirt="#1F4D3A" aid="crutches" hearing scale={1.12} />
      <StandingPerson x={848} y={340} skin="#5C3A21" hair="#0F0F0F" style="bun" shirt="#4A90C2" scale={1.3} wave />
    </svg>
  )
}

// Small vignettes for module headers.
export function Vignette({ kind }) {
  const scenes = {
    map: <><circle cx="150" cy="44" r="18" fill="#C8553D" /><circle cx="150" cy="44" r="7" fill="#FBF6EC" /><path d="M150,62 L150,80" stroke="#C8553D" strokeWidth="4" /><WheelchairKid x={70} y={132} skin="#C68E5C" hair="#2B1A10" style="curly" shirt="#4A90C2" /></>,
    play: <><circle cx="155" cy="60" r="14" fill="#E8A317" className="anim-bob" /><WheelchairKid x={80} y={132} skin="#8D5524" hair="#1C1C1C" style="short" shirt="#C8553D" power accent="#E8A317" /></>,
    equipment: <><StandingPerson x={70} y={132} skin="#E0AC69" hair="#1C1C1C" style="bun" shirt="#1F4D3A" aid="walker" bob /><rect x="130" y="70" width="44" height="56" rx="6" fill="#fff" stroke="#14213D" strokeWidth="2" /><path d="M138,86 h28 M138,98 h28 M138,110 h18" stroke="#4A90C2" strokeWidth="3" strokeLinecap="round" /></>,
    iep: <><StandingPerson x={60} y={132} skin="#3B2416" hair="#0F0F0F" style="locs" shirt="#E8A317" wave /><WheelchairKid x={140} y={132} skin="#F1C9A5" hair="#B5562B" style="long" shirt="#1F4D3A" wave={false} /></>,
    providers: <><StandingPerson x={70} y={132} skin="#B07A4F" hair="#2B1A10" style="hijab" accent="#4A90C2" shirt="#FFFFFF" pants="#1F4D3A" holding /><StandingPerson x={140} y={132} skin="#D9A066" hair="#1C1C1C" style="short" shirt="#C8553D" aid="white-cane" /></>,
    sanctuary: <><circle cx="100" cy="72" r="46" fill="#FBE7B5" className="anim-breathe" style={{ transformOrigin: '100px 72px' }} /><StandingPerson x={100} y={132} skin="#6B4226" hair="#D9D9D9" style="short" shirt="#4A90C2" glasses /></>,
  }
  return <svg viewBox="0 0 200 140" className="w-40 h-28 shrink-0" aria-hidden="true">{scenes[kind]}</svg>
}

// Persona portrait: caregiver + child heads (from data/profiles.json).
export function FamilyPortrait({ avatar, mobility = '' }) {
  const m = mobility.toLowerCase()
  const chair = m.includes('wheelchair')
  return (
    <svg viewBox="0 0 120 100" className="w-24 h-20" aria-hidden="true">
      <circle cx="60" cy="54" r="46" fill={avatar.accent} opacity=".22" />
      <Head x={42} y={44} r={17} skin={avatar.caregiver_skin} hair={avatar.caregiver_hair} style={avatar.caregiver_hair_style} accent={avatar.accent} />
      <rect x="28" y="62" width="28" height="30" rx="12" fill={avatar.accent} />
      <Head x={80} y={58} r={13} skin={avatar.child_skin} hair={avatar.child_hair} style={avatar.child_hair_style} accent={avatar.accent} hearing={m.includes('hearing')} />
      <rect x="69" y="72" width="22" height="20" rx="9" fill="#14213D" opacity=".85" />
      {chair && <circle cx="80" cy="90" r="9" fill="none" stroke="#14213D" strokeWidth="3" />}
      {m.includes('cane') && <line x1="96" y1="70" x2="104" y2="96" stroke={m.includes('white') ? '#fff' : '#8A5A2B'} strokeWidth="3" />}
    </svg>
  )
}
