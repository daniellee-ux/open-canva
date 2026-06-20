import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Page frame — thin crisp black border, poster-like */}
    <Box x={48} y={48} w={984} h={984} fill="transparent" radius={6} borderColor="var(--ox-fg)" borderWidth={3} />

    {/* Top salmon header band carrying the structure */}
    <Box x={48} y={48} w={984} h={236} fill="var(--ox-accent)" radius={0} />
    <Line x={48} y={284} w={984} thickness={3} color="var(--ox-fg)" />

    {/* Eyebrow / kicker */}
    <Text x={92} y={98} w={628} size={24} weight={400} color="var(--ox-fg)" font="body" uppercase letterSpacing={5}>
      Greenhouse District · Est. 1994
    </Text>

    {/* Header lockup */}
    <Text x={88} y={150} w={648} size={74} weight={400} lineHeight={0.86} color="var(--ox-fg)" font="display" uppercase letterSpacing={1}>
      Spring Plant
    </Text>

    {/* Circular green postal stamp — the loud accent, top-right */}
    <Ellipse x={742} y={88} w={216} h={216} fill="var(--ox-accent2)" />
    <Ellipse x={762} y={108} w={176} h={176} fill="transparent" borderColor="#ffffff" borderWidth={3} />
    <Text x={742} y={132} w={216} size={26} weight={700} color="#ffffff" font="display" align="center" uppercase letterSpacing={2}>
      One Day
    </Text>
    <Text x={742} y={166} w={216} h={70} valign="center" size={46} weight={400} color="#ffffff" font="display" align="center">
      MAY 18
    </Text>
    <Text x={742} y={236} w={216} size={22} weight={700} color="#ffffff" font="body" align="center" uppercase letterSpacing={5}>
      Sat · 9–4
    </Text>

    {/* Subhead below the band */}
    <Text x={88} y={236} w={620} size={42} weight={700} color="var(--ox-fg)" font="display" uppercase letterSpacing={2}>
      Sale & Swap
    </Text>

    {/* Body intro */}
    <Text x={92} y={324} w={560} size={29} weight={400} lineHeight={1.34} color="var(--ox-fg)" font="body">
      Hundreds of homegrown seedlings, heirloom herbs, and leafy houseplants — all dug fresh and priced to grow. Bring a tray, take home a jungle.
    </Text>

    {/* Big green focal numeral — the one loud display mark */}
    <Text x={84} y={502} w={620} size={258} weight={400} lineHeight={0.8} color="var(--ox-accent2)" font="display" letterSpacing={-4}>
      30%
    </Text>
    <Text x={92} y={772} w={560} size={28} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={6}>
      Off every perennial after 2pm
    </Text>

    {/* Right column — salmon chip list of categories */}
    <Box x={688} y={344} w={296} h={64} fill="var(--ox-accent)" radius={6} />
    <Text x={688} y={344} w={296} h={64} align="center" valign="center" size={27} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={3}>
      Tomato Starts
    </Text>

    <Box x={688} y={424} w={296} h={64} fill="var(--ox-accent)" radius={6} />
    <Text x={688} y={424} w={296} h={64} align="center" valign="center" size={27} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={3}>
      Native Wildflowers
    </Text>

    <Box x={688} y={504} w={296} h={64} fill="var(--ox-accent)" radius={6} />
    <Text x={688} y={504} w={296} h={64} align="center" valign="center" size={27} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={3}>
      Rare Houseplants
    </Text>

    <Box x={688} y={584} w={296} h={64} fill="var(--ox-accent)" radius={6} />
    <Text x={688} y={584} w={296} h={64} align="center" valign="center" size={27} weight={700} color="var(--ox-fg)" font="body" uppercase letterSpacing={3}>
      Herb Six-Packs
    </Text>

    {/* Small green leaf-mark accent in the right column */}
    <Ellipse x={808} y={688} w={56} h={56} fill="var(--ox-accent2)" />
    <Text x={808} y={697} w={56} h={40} align="center" valign="center" size={30} color="#ffffff" font="display">
      ❀
    </Text>
    <Text x={688} y={760} w={296} size={24} weight={400} lineHeight={1.3} color="var(--ox-fg)" font="body" align="center">
      Free repotting & soil tips at the potting bench all day.
    </Text>

    {/* Dark outcome bar at the bottom — white text */}
    <Box x={48} y={888} w={984} h={144} fill="var(--ox-fg)" radius={0} />
    <Text x={92} y={922} w={660} size={26} weight={700} color="var(--ox-bg)" font="display" uppercase letterSpacing={2}>
      Fernbrook Community Garden
    </Text>
    <Text x={92} y={966} w={620} size={24} weight={400} color="var(--ox-muted)" font="body" letterSpacing={1}>
      214 Marigold Lane · plantsale.fernbrook.org
    </Text>
    <Box x={760} y={916} w={224} h={88} fill="var(--ox-accent2)" radius={6} />
    <Text x={760} y={916} w={224} h={88} align="center" valign="center" size={28} weight={700} color="#ffffff" font="display" uppercase letterSpacing={2}>
      Rain or Shine
    </Text>
  </>
);
Main.id = 'salmon-plant-sale';
Main.label = 'Spring Plant Sale';

export const design: DesignSystem = {
  palette: {
    bg: '#FFFFFF',
    fg: '#000000',
    muted: '#9aa39c',
    accent: '#F0AE9E',
    accent2: '#049550',
    surface: '#FBF1EE',
  },
  fonts: {
    display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 6,
};
export const meta: DesignMeta = { title: 'Spring Plant Sale', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
