import { Ellipse, Icon, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, Scene } from '@opencanva/core';

const Card: Scene = () => (
  <>
    <Icon glyph="“" x={84} y={40} size={320} color="var(--ox-accent2)" />

    <Text x={110} y={360} w={860} size={84} weight={700} lineHeight={1.12} font="display">
      Design is not just what it looks like and feels like. Design is how it works.
    </Text>

    <Line x={110} y={780} w={120} thickness={4} color="var(--ox-accent2)" />

    <Text x={110} y={812} w={700} size={40} weight={600} color="var(--ox-fg)">
      Steve Jobs
    </Text>
    <Text x={110} y={864} w={700} size={30} weight={400} color="var(--ox-muted)">
      Co-founder, Apple
    </Text>

    <Ellipse x={900} y={904} w={96} h={96} fill="var(--ox-accent2)" />
  </>
);
Card.id = 'card';
Card.label = 'Quote';

export const artboard: Artboard = { w: 1080, h: 1080 };

export const meta: DesignMeta = {
  title: 'Quote Card',
  author: 'OpenCanva',
  theme: 'noir',
  createdAt: '2026-06-20T09:10:00Z',
};

export default [Card] satisfies Scene[];
