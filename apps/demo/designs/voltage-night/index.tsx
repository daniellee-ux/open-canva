import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Electric blue base panel (left/main) */}
    <Box x={0} y={0} w={648} h={1080} fill="var(--ox-accent)" z={1} />
    {/* Dark navy split panel (right) */}
    <Box x={648} y={0} w={432} h={1080} fill="var(--ox-bg)" z={1} />

    {/* Halftone dot texture, top-left of blue panel */}
    <Ellipse x={48} y={84} w={18} h={18} fill="var(--ox-accent2)" opacity={0.9} z={2} />
    <Ellipse x={92} y={84} w={14} h={14} fill="var(--ox-accent2)" opacity={0.7} z={2} />
    <Ellipse x={132} y={84} w={10} h={10} fill="var(--ox-accent2)" opacity={0.55} z={2} />
    <Ellipse x={166} y={84} w={7} h={7} fill="var(--ox-accent2)" opacity={0.4} z={2} />
    <Ellipse x={48} y={128} w={14} h={14} fill="var(--ox-accent2)" opacity={0.7} z={2} />
    <Ellipse x={90} y={128} w={11} h={11} fill="var(--ox-accent2)" opacity={0.55} z={2} />
    <Ellipse x={128} y={128} w={8} h={8} fill="var(--ox-accent2)" opacity={0.4} z={2} />
    <Ellipse x={48} y={168} w={10} h={10} fill="var(--ox-accent2)" opacity={0.5} z={2} />
    <Ellipse x={86} y={168} w={7} h={7} fill="var(--ox-accent2)" opacity={0.35} z={2} />

    {/* Halftone dot texture, bottom-right of dark panel */}
    <Ellipse x={1006} y={920} w={18} h={18} fill="var(--ox-accent)" opacity={0.9} z={2} />
    <Ellipse x={962} y={922} w={14} h={14} fill="var(--ox-accent)" opacity={0.7} z={2} />
    <Ellipse x={922} y={924} w={10} h={10} fill="var(--ox-accent)" opacity={0.55} z={2} />
    <Ellipse x={888} y={926} w={7} h={7} fill="var(--ox-accent)" opacity={0.4} z={2} />
    <Ellipse x={1008} y={964} w={14} h={14} fill="var(--ox-accent)" opacity={0.7} z={2} />
    <Ellipse x={968} y={966} w={11} h={11} fill="var(--ox-accent)" opacity={0.55} z={2} />
    <Ellipse x={930} y={968} w={8} h={8} fill="var(--ox-accent)" opacity={0.4} z={2} />
    <Ellipse x={1010} y={1004} w={10} h={10} fill="var(--ox-accent)" opacity={0.5} z={2} />

    {/* Neon medallion straddling the split, lower seam */}
    <Ellipse x={540} y={704} w={196} h={196} fill="var(--ox-accent2)" rotate={-8} z={3} />
    <Text x={540} y={704} w={196} h={196} align="center" valign="center" size={26} weight={800} font="display" color="#1a1a2e" uppercase letterSpacing={1} lineHeight={1.02} rotate={-8} z={4}>
      {'FREE\nUNTIL\n11PM'}
    </Text>

    {/* Top neon badge / callout */}
    <Box x={48} y={56} w={324} h={48} fill="var(--ox-accent2)" radius={24} z={6}>
      <Text x={0} y={0} w={324} h={48} align="center" valign="center" size={16} weight={700} font="body" color="#1a1a2e" uppercase letterSpacing={2}>
        Music + Art All Night
      </Text>
    </Box>

    {/* Tiny mono kicker */}
    <Text x={50} y={232} w={560} size={18} weight={700} font="body" color="var(--ox-accent2)" uppercase letterSpacing={6} z={6}>
      Volt Collective presents
    </Text>

    {/* HERO TITLE — sized to fit the left panel (right panel starts at x=648) */}
    <Text x={48} y={300} w={588} size={100} weight={800} lineHeight={0.96} font="display" color="var(--ox-fg)" uppercase z={6}>
      {'LATE\nNIGHT\nVOLT'}
    </Text>

    {/* Accent underline */}
    <Line x={50} y={772} w={300} thickness={10} color="var(--ox-accent2)" z={6} />

    {/* Tagline */}
    <Text x={50} y={804} w={470} size={26} weight={400} font="body" lineHeight={1.38} color="var(--ox-fg)" z={6}>
      {'A nocturnal session of live\nsets, projection art and\nwarehouse rave till dawn.'}
    </Text>

    {/* Date block, big on blue */}
    <Text x={50} y={928} w={560} size={88} weight={800} font="display" color="var(--ox-accent2)" lineHeight={0.9} z={6}>
      JUL 18
    </Text>
    <Text x={52} y={1026} w={420} size={20} weight={700} font="body" color="var(--ox-fg)" uppercase letterSpacing={4} z={6}>
      Saturday / 10PM till late
    </Text>

    {/* ---- RIGHT DARK PANEL CONTENT ---- */}

    {/* Section label */}
    <Text x={700} y={92} w={340} size={16} weight={700} font="body" color="var(--ox-accent)" uppercase letterSpacing={5} z={6}>
      Live Lineup
    </Text>
    <Line x={700} y={126} w={332} thickness={2} color="var(--ox-muted)" z={6} />

    {/* Lineup names */}
    <Text x={700} y={150} w={340} size={40} weight={800} font="display" color="var(--ox-fg)" lineHeight={1.05} uppercase z={6}>
      NOVA REX
    </Text>
    <Text x={700} y={206} w={340} size={15} weight={400} font="body" color="var(--ox-muted)" uppercase letterSpacing={3} z={6}>
      Headline / Live Synth
    </Text>

    <Text x={700} y={252} w={340} size={40} weight={800} font="display" color="var(--ox-accent2)" lineHeight={1.05} uppercase z={6}>
      KÅSI
    </Text>
    <Text x={700} y={308} w={340} size={15} weight={400} font="body" color="var(--ox-muted)" uppercase letterSpacing={3} z={6}>
      DJ Set / Acid House
    </Text>

    <Text x={700} y={354} w={340} size={40} weight={800} font="display" color="var(--ox-fg)" lineHeight={1.05} uppercase z={6}>
      THE GLOW
    </Text>
    <Text x={700} y={410} w={340} size={15} weight={400} font="body" color="var(--ox-muted)" uppercase letterSpacing={3} z={6}>
      Light Art / Visuals
    </Text>

    <Text x={700} y={456} w={340} size={40} weight={800} font="display" color="var(--ox-fg)" lineHeight={1.05} uppercase z={6}>
      AMARA B
    </Text>
    <Text x={700} y={512} w={340} size={15} weight={400} font="body" color="var(--ox-muted)" uppercase letterSpacing={3} z={6}>
      Closing / Deep House
    </Text>

    <Line x={700} y={576} w={332} thickness={2} color="var(--ox-muted)" z={6} />

    {/* Venue + mono details */}
    <Text x={700} y={602} w={340} size={16} weight={700} font="body" color="var(--ox-accent)" uppercase letterSpacing={5} z={6}>
      The Voltage Yard
    </Text>
    <Text x={700} y={632} w={340} size={20} weight={400} font="body" color="var(--ox-fg)" lineHeight={1.4} z={6}>
      {'Unit 9, Halftone Wharf\nEast Docks · 18+'}
    </Text>

    {/* Mono ticket line */}
    <Text x={700} y={1016} w={332} size={15} weight={700} font="body" color="var(--ox-muted)" uppercase letterSpacing={2} z={6}>
      Tickets · voltnight.live
    </Text>
  </>
);
Main.id = 'voltage-night';
Main.label = 'Late Night Volt';

export const design: DesignSystem = {
  palette: {
    bg: '#1a1a2e',
    fg: '#ffffff',
    muted: '#8a8ab0',
    accent: '#0066ff',
    accent2: '#d4ff00',
    surface: '#23233f',
  },
  fonts: {
    display: "'Syne', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Mono', ui-monospace, monospace",
  },
  radius: 24,
};
export const meta: DesignMeta = {
  title: 'Late Night Volt',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
