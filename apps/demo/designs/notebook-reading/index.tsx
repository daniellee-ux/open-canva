import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Soft glow on the dark ground */}
    <Ellipse x={-180} y={-160} w={620} h={620} fill="var(--ox-accent)" opacity={0.1} />
    <Ellipse x={760} y={980} w={560} h={560} fill="#f4b8c5" opacity={0.1} />

    {/* Paper card */}
    <Box
      x={96}
      y={96}
      w={888}
      h={1158}
      fill="var(--ox-surface)"
      radius={20}
      shadow="0 40px 90px rgba(0,0,0,0.45)"
    />

    {/* Colorful section tabs on the right edge */}
    <Box x={952} y={188} w={64} h={150} fill="#98d4bb" radius={14}>
      <Text x={0} y={0} w={150} h={64} align="center" valign="center" rotate={90} size={17} weight={500} color="#1a1a1a" font="body" uppercase letterSpacing={3}>
        Fiction
      </Text>
    </Box>
    <Box x={952} y={348} w={64} h={150} fill="#c7b8ea" radius={14}>
      <Text x={0} y={0} w={150} h={64} align="center" valign="center" rotate={90} size={17} weight={500} color="#1a1a1a" font="body" uppercase letterSpacing={3}>
        Essays
      </Text>
    </Box>
    <Box x={952} y={508} w={64} h={150} fill="#f4b8c5" radius={14}>
      <Text x={0} y={0} w={150} h={64} align="center" valign="center" rotate={90} size={17} weight={500} color="#1a1a1a" font="body" uppercase letterSpacing={3}>
        Memoir
      </Text>
    </Box>
    <Box x={952} y={668} w={64} h={150} fill="#a8d8ea" radius={14}>
      <Text x={0} y={0} w={150} h={64} align="center" valign="center" rotate={90} size={17} weight={500} color="#1a1a1a" font="body" uppercase letterSpacing={3}>
        Poetry
      </Text>
    </Box>

    {/* Binder holes on the left */}
    <Ellipse x={132} y={300} w={26} h={26} fill="var(--ox-bg)" opacity={0.18} />
    <Ellipse x={132} y={560} w={26} h={26} fill="var(--ox-bg)" opacity={0.18} />
    <Ellipse x={132} y={820} w={26} h={26} fill="var(--ox-bg)" opacity={0.18} />
    <Ellipse x={132} y={1080} w={26} h={26} fill="var(--ox-bg)" opacity={0.18} />

    {/* Header */}
    <Text x={210} y={154} w={620} size={22} weight={500} color="var(--ox-accent)" font="body" uppercase letterSpacing={6}>
      The Reading List
    </Text>
    <Text x={206} y={200} w={640} size={108} weight={700} lineHeight={0.94} color="var(--ox-fg)" font="display">
      June
    </Text>
    <Text x={210} y={322} w={730} size={25} weight={400} color="#4a4a4a" font="body" italic lineHeight={1.4}>
      Four pages we dog-eared this month, sorted by shelf.
    </Text>
    <Line x={210} y={376} w={560} thickness={2} color="var(--ox-bg)" dash="2 8" />

    {/* Book 1 — Fiction */}
    <Text x={210} y={400} w={66} size={40} weight={700} color="#98d4bb" font="display">
      01
    </Text>
    <Text x={278} y={398} w={500} size={40} weight={700} color="var(--ox-fg)" font="display" lineHeight={1.02}>
      The Salt Almanac
    </Text>
    <Text x={278} y={450} w={520} size={22} weight={500} color="#4a4a4a" font="body">
      Marguerite Holloway
    </Text>
    <Text x={278} y={480} w={540} size={21} weight={400} color="#5a5a5a" font="body" lineHeight={1.3}>
      A lighthouse keeper inherits a year of her grandmother's tide charts and the secrets folded between them.
    </Text>

    {/* Book 2 — Essays */}
    <Text x={210} y={560} w={66} size={40} weight={700} color="#c7b8ea" font="display">
      02
    </Text>
    <Text x={278} y={558} w={500} size={40} weight={700} color="var(--ox-fg)" font="display" lineHeight={1.02}>
      Notes on Slowness
    </Text>
    <Text x={278} y={610} w={520} size={22} weight={500} color="#4a4a4a" font="body">
      Idris Okonkwo
    </Text>
    <Text x={278} y={640} w={540} size={21} weight={400} color="#5a5a5a" font="body" lineHeight={1.3}>
      Twelve quiet essays arguing that attention, not time, is the resource we are actually running out of.
    </Text>

    {/* Book 3 — Memoir */}
    <Text x={210} y={720} w={66} size={40} weight={700} color="#f4b8c5" font="display">
      03
    </Text>
    <Text x={278} y={718} w={500} size={40} weight={700} color="var(--ox-fg)" font="display" lineHeight={1.02}>
      Kitchen of Ghosts
    </Text>
    <Text x={278} y={770} w={520} size={22} weight={500} color="#4a4a4a" font="body">
      Renata Bianchi
    </Text>
    <Text x={278} y={800} w={540} size={21} weight={400} color="#5a5a5a" font="body" lineHeight={1.3}>
      A chef rebuilds her late mother's recipes from memory, and finds the family she thought she'd lost.
    </Text>

    {/* Book 4 — Poetry */}
    <Text x={210} y={880} w={66} size={40} weight={700} color="#a8d8ea" font="display">
      04
    </Text>
    <Text x={278} y={878} w={500} size={40} weight={700} color="var(--ox-fg)" font="display" lineHeight={1.02}>
      Field Recordings
    </Text>
    <Text x={278} y={930} w={520} size={22} weight={500} color="#4a4a4a" font="body">
      Theo Marchetti
    </Text>
    <Text x={278} y={960} w={540} size={21} weight={400} color="#5a5a5a" font="body" lineHeight={1.3}>
      Spare, luminous poems gathered from a year spent walking the same forgotten coastal road at dawn.
    </Text>

    {/* Footer */}
    <Line x={210} y={1080} w={560} thickness={2} color="var(--ox-bg)" dash="2 8" />
    <Text x={210} y={1112} w={420} size={20} weight={500} color="#4a4a4a" font="body" uppercase letterSpacing={3}>
      Marginalia Book Club
    </Text>
    <Box x={636} y={1100} w={134} h={56} fill="#ffe6a7" radius={28}>
      <Text x={0} y={0} w={134} h={56} align="center" valign="center" size={20} weight={700} color="#1a1a1a" font="body">
        4 / 4
      </Text>
    </Box>
  </>
);
Main.id = 'notebook-reading';
Main.label = 'June Reading List';

export const design: DesignSystem = {
  palette: {
    bg: '#2d2d2d',
    fg: '#1a1a1a',
    muted: '#8a8a8a',
    accent: '#c7967a',
    accent2: '#98d4bb',
    surface: '#f8f6f1',
  },
  fonts: {
    display: "'Bodoni Moda', Georgia, serif",
    body: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 20,
};
export const meta: DesignMeta = {
  title: 'June Reading List',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1350 };
export default [Main] satisfies Scene[];
