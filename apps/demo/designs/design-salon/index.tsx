import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, Scene } from '@opencanva/core';

/** "Dark Botanical" poster — soft overlapping gradient glows, an elegant
 *  Cormorant serif, warm gold/pink accents, italic signature. (portrait) */

const Poster: Scene = () => (
  <>
    {/* soft abstract glows (radial gradients fade to transparent — export-safe) */}
    <Ellipse x={520} y={-220} w={780} h={780} fill="radial-gradient(circle at 35% 35%, #d4a574 0%, transparent 68%)" opacity={0.75} />
    <Ellipse x={-260} y={820} w={820} h={820} fill="radial-gradient(circle, #e8b4b8 0%, transparent 66%)" opacity={0.5} />

    {/* thin vertical accent line + eyebrow */}
    <Box x={120} y={150} w={3} h={92} radius={0} fill="var(--ox-accent)" />
    <Text x={152} y={150} w={600} h={92} valign="center" size={26} weight={500} color="var(--ox-accent)" uppercase letterSpacing={8}>
      An evening of
    </Text>

    <Text x={118} y={360} w={880} size={184} weight={500} font="display" color="var(--ox-fg)" lineHeight={0.96} italic>
      Modern Design
    </Text>

    <Text x={124} y={748} w={780} size={40} weight={400} color="var(--ox-muted)" lineHeight={1.5}>
      A salon on craft, typography, and the tools shaping how we make things — with drinks, demos, and good company.
    </Text>

    <Line x={124} y={1000} w={120} thickness={1} color="var(--ox-accent)" />
    <Text x={124} y={1036} w={560} size={36} weight={500} font="display" color="var(--ox-fg)">
      Friday, July 18 · 7:00pm
    </Text>
    <Text x={124} y={1094} w={560} size={28} weight={400} color="var(--ox-muted)">
      The Atrium · 4th floor
    </Text>

    <Text x={124} y={1210} w={560} size={46} weight={500} font="display" color="var(--ox-accent)" italic>
      OpenCanva
    </Text>
  </>
);
Poster.id = 'poster';
Poster.label = 'Salon';

export const artboard: Artboard = { w: 1080, h: 1350 };

export const meta: DesignMeta = {
  title: 'Design Salon',
  author: 'OpenCanva',
  theme: 'botanical',
  createdAt: '2026-06-20T10:10:00Z',
};

export default [Poster] satisfies Scene[];
