import { Box, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, Scene } from '@opencanva/core';

/** "Bold Signal" keynote slide — colored focal card on a dark gradient,
 *  large section number, nav breadcrumb, title bottom-left. (16:9) */

const Slide: Scene = () => (
  <>
    <Box x={0} y={0} w={1920} h={1080} radius={0} fill="linear-gradient(135deg, #1a1a1a 0%, #262626 55%, #1a1a1a 100%)" />

    {/* section number + nav */}
    <Text x={120} y={92} w={420} size={120} weight={400} font="display" color="var(--ox-accent)">
      01
    </Text>
    <Text x={124} y={232} w={420} size={26} weight={500} color="var(--ox-muted)" uppercase letterSpacing={6}>
      Introduction
    </Text>
    <Text x={1100} y={112} w={700} h={40} align="right" valign="center" size={24} weight={500} color="var(--ox-fg)">
      Intro — Problem — Solution — Demo
    </Text>

    {/* focal card */}
    <Box x={1060} y={300} w={740} h={560} fill="var(--ox-accent)" radius={28} shadow="0 40px 120px rgba(255,87,34,0.35)">
      <Text x={56} y={56} w={620} size={28} weight={500} color="#1a1a1a" uppercase letterSpacing={4}>
        The shift
      </Text>
      <Text x={52} y={120} w={640} size={210} weight={400} font="display" color="#1a1a1a" lineHeight={0.9}>
        10×
      </Text>
      <Text x={56} y={392} w={620} size={42} weight={500} color="#1a1a1a" lineHeight={1.25}>
        faster from idea to finished graphic with an agent.
      </Text>
    </Box>

    {/* title block */}
    <Line x={120} y={590} w={120} thickness={6} color="var(--ox-accent2)" />
    <Text x={116} y={628} w={940} size={82} weight={400} font="display" color="var(--ox-fg)" lineHeight={1.0}>
      Design at the{'\n'}speed of thought
    </Text>
    <Text x={120} y={868} w={780} size={32} weight={400} color="var(--ox-muted)" lineHeight={1.4}>
      Describe it. Click any object to refine it. Export it. OpenCanva turns prompts into production graphics.
    </Text>

    {/* footer */}
    <Text x={120} y={1004} w={400} size={24} weight={500} color="var(--ox-muted)">
      opencanva.dev
    </Text>
    <Text x={1500} y={1004} w={300} h={32} align="right" valign="center" size={24} weight={500} color="var(--ox-muted)">
      01 / 06
    </Text>
  </>
);
Slide.id = 'slide';
Slide.label = 'Keynote';

export const artboard: Artboard = { w: 1920, h: 1080 };

export const meta: DesignMeta = {
  title: 'Keynote Slide',
  author: 'OpenCanva',
  theme: 'bold-signal',
  createdAt: '2026-06-20T10:00:00Z',
};

export default [Slide] satisfies Scene[];
