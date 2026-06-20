import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* large aqua color-block anchor, soft rounded paper cut-out */}
    <Box x={560} y={-140} w={720} h={720} fill="var(--ox-accent)" radius={360} opacity={0.95} z={1} />
    {/* deeper aqua block layered over the first for Matisse depth */}
    <Ellipse x={120} y={760} w={520} h={520} fill="var(--ox-accent2)" opacity={0.9} z={1} />
    {/* small offset aqua leaf-circle */}
    <Ellipse x={840} y={930} w={230} h={230} fill="var(--ox-accent)" opacity={0.85} z={1} />
    {/* a calm navy dot accent */}
    <Ellipse x={92} y={236} w={26} h={26} fill="var(--ox-fg)" z={3} />

    {/* eyebrow / kicker */}
    <Text x={130} y={228} w={760} size={26} weight={600} color="var(--ox-fg)" uppercase letterSpacing={9} font="body" z={4}>
      Solo Exhibition · Opening Reception
    </Text>

    {/* thin navy hairline rule */}
    <Line x={130} y={296} w={300} thickness={3} color="var(--ox-fg)" z={4} />

    {/* artist name — the focal point */}
    <Text x={120} y={330} w={900} size={158} weight={600} lineHeight={0.9} color="var(--ox-fg)" font="display" z={5}>
      Élise{'\n'}Marchand
    </Text>

    {/* show title, set in italic serif over the cream */}
    <Text x={126} y={650} w={780} size={62} weight={500} italic lineHeight={1.04} color="var(--ox-fg)" font="display" z={5}>
      Paper, Light & Other Quiet Things
    </Text>

    {/* short curatorial line */}
    <Text x={130} y={808} w={420} size={26} weight={400} lineHeight={1.4} color="var(--ox-fg)" font="body" z={6}>
      Cut-paper compositions and aqua washes — an exhibition of forms left to breathe.
    </Text>

    {/* date block inside the deeper-aqua circle, centered navy ink */}
    <Text x={150} y={930} w={460} h={70} align="center" size={46} weight={600} color="var(--ox-fg)" font="display" z={6}>
      14 September 2026
    </Text>
    <Text x={150} y={1006} w={460} h={40} align="center" size={26} weight={500} color="var(--ox-fg)" uppercase letterSpacing={5} font="body" z={6}>
      6 – 9 PM · Free Entry
    </Text>

    {/* venue card — crisp navy block, bottom-left of composition */}
    <Box x={130} y={1160} w={560} h={130} fill="var(--ox-fg)" radius={28} z={6}>
      <Text x={40} y={26} w={480} size={30} weight={600} color="var(--ox-bg)" font="display">
        Galerie Beaumont
      </Text>
      <Text x={40} y={72} w={480} size={23} weight={400} color="var(--ox-accent)" font="body">
        48 Rue des Tilleuls · Marais, Paris
      </Text>
    </Box>

    {/* rsvp / footer line under venue */}
    <Text x={130} y={1310} w={820} size={22} weight={500} color="var(--ox-fg)" uppercase letterSpacing={4} font="body" z={6}>
      RSVP — atelier-marchand.fr/opening
    </Text>

    {/* small navy index mark, top right */}
    <Text x={760} y={228} w={200} size={24} weight={600} color="var(--ox-fg)" align="right" uppercase letterSpacing={6} font="body" z={4}>
      No. 07
    </Text>
  </>
);
Main.id = 'papier-gallery';
Main.label = 'Papier Gallery Opening';

export const design: DesignSystem = {
  palette: {
    bg: '#FAF3EB',
    fg: '#1A3C8F',
    muted: '#8FA6C4',
    accent: '#72D0E9',
    accent2: '#4FB8D8',
    surface: '#F1E7DA',
  },
  fonts: {
    display: "'Fraunces', Georgia, serif",
    body: "'Work Sans', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 28,
};
export const meta: DesignMeta = {
  title: 'Papier Gallery Opening',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1350 };
export default [Main] satisfies Scene[];
