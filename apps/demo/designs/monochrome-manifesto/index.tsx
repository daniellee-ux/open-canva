import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Manifesto: Scene = () => (
  <>
    {/* Thin framing border, squared and quiet */}
    <Box x={64} y={64} w={952} h={952} fill="transparent" borderColor="var(--ox-fg)" borderWidth={1} radius={2} />

    {/* Kicker / eyebrow */}
    <Text x={112} y={150} w={700} size={22} weight={600} color="var(--ox-muted)" font="body" uppercase letterSpacing={9}>
      A Working Manifesto
    </Text>

    {/* Issue marker, top right, barely-present structure */}
    <Text x={616} y={150} w={352} h={28} size={22} weight={600} color="var(--ox-muted)" font="body" align="right" uppercase letterSpacing={6}>
      No. 04
    </Text>

    {/* Hairline rule under the kicker */}
    <Line x={112} y={196} w={856} thickness={1} color="var(--ox-fg)" />

    {/* The statement — the single focal point */}
    <Text x={108} y={296} w={864} size={104} weight={700} lineHeight={0.98} color="var(--ox-fg)" font="display" letterSpacing={-2}>
      {"Make it\nquiet, make\nit true, make\nit last."}
    </Text>

    {/* Supporting line in graphite, stepping back from the headline */}
    <Text x={112} y={748} w={788} size={28} weight={400} lineHeight={1.45} color="var(--ox-muted)" font="body">
      Restraint is not the absence of an idea. It is the discipline to remove everything that is not the idea.
    </Text>

    {/* A small squared void to anchor the lower-left, marking structure */}
    <Box x={112} y={872} w={56} h={56} fill="var(--ox-surface)" borderColor="var(--ox-fg)" borderWidth={1} radius={0} />

    {/* Attribution, small and exact */}
    <Text x={188} y={874} w={500} size={22} weight={600} color="var(--ox-fg)" font="body" letterSpacing={1}>
      The Plainwork Studio
    </Text>
    <Text x={188} y={904} w={500} size={20} weight={400} color="var(--ox-graphite-light, var(--ox-muted))" font="body" letterSpacing={1}>
      Editorial Practice — Est. 2019
    </Text>

    {/* Closing hairline rule near the foot, aligned to attribution baseline */}
    <Line x={616} y={900} w={352} thickness={1} color="var(--ox-fg)" />
    <Text x={616} y={874} w={352} h={24} size={20} weight={500} color="var(--ox-muted)" font="body" align="right" uppercase letterSpacing={5}>
      Folio 01 / 01
    </Text>
  </>
);
Manifesto.id = 'monochrome-manifesto';
Manifesto.label = 'Monochrome Manifesto';

export const design: DesignSystem = {
  palette: {
    bg: '#FAFADF',
    fg: '#1A1A16',
    muted: '#5E5E54',
    accent: '#1A1A16',
    accent2: '#8A8A80',
    surface: '#F0F0D4',
  },
  fonts: {
    display: "'Fraunces', Georgia, 'Times New Roman', serif",
    body: "'Work Sans', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 2,
};
export const meta: DesignMeta = {
  title: 'Monochrome Manifesto',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Manifesto] satisfies Scene[];
