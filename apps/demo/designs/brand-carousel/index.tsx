import { Box, Ellipse, Icon, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, Scene } from '@opencanva/core';

/** A two-board Instagram carousel — demonstrates multiple Scenes per design. */

const Cover: Scene = () => (
  <>
    <Ellipse x={620} y={-160} w={620} h={620} fill="var(--ox-accent)" opacity={0.25} />
    <Text x={90} y={150} w={500} size={30} weight={700} color="var(--ox-accent2)" uppercase letterSpacing={8}>
      A thread
    </Text>
    <Text x={86} y={210} w={900} size={150} weight={800} lineHeight={0.92} font="display">
      5 rules of bold layout
    </Text>
    <Line x={96} y={760} w={260} thickness={6} color="var(--ox-accent)" />
    <Text x={96} y={804} w={760} size={40} weight={500} color="var(--ox-muted)">
      Swipe to read →
    </Text>
    <Icon glyph="✦" x={900} y={900} size={90} color="var(--ox-accent2)" />
  </>
);
Cover.id = 'cover';
Cover.label = 'Cover';

const Tip: Scene = () => (
  <>
    <Text x={90} y={150} w={400} size={260} weight={800} color="var(--ox-accent)" font="display">
      01
    </Text>
    <Text x={96} y={520} w={900} size={96} weight={800} lineHeight={1.0} font="display">
      Pick one focal point
    </Text>
    <Text x={96} y={760} w={880} size={44} weight={400} color="var(--ox-muted)" lineHeight={1.4}>
      Make a single element dominate. Everything else supports it — never competes.
    </Text>
    <Box x={96} y={980} w={300} h={8} fill="var(--ox-accent2)" radius={4} />
  </>
);
Tip.id = 'tip-01';
Tip.label = 'Tip 01';

export const artboard: Artboard = { w: 1080, h: 1080 };

export const meta: DesignMeta = {
  title: 'Bold Layout Carousel',
  author: 'OpenCanva',
  theme: 'ember',
  createdAt: '2026-06-20T09:30:00Z',
};

export default [Cover, Tip] satisfies Scene[];
