import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, Scene } from '@opencanva/core';

const Promo: Scene = () => (
  <>
    {/* header band */}
    <Box x={0} y={0} w={1080} h={120} fill="var(--ox-surface)" radius={0} />
    <Text x={64} y={0} w={500} h={120} valign="center" size={34} weight={700} font="display" color="var(--ox-accent2)" uppercase letterSpacing={4}>
      Live webinar
    </Text>
    <Text x={580} y={0} w={436} h={120} valign="center" align="right" size={30} weight={500} color="var(--ox-muted)" font="body">
      Free · 60 min
    </Text>

    <Text x={64} y={230} w={760} size={130} weight={800} lineHeight={0.95} font="display">
      Designing with AI agents
    </Text>

    <Text x={64} y={690} w={840} size={42} weight={500} color="var(--ox-muted)" lineHeight={1.4} font="body">
      Ship production graphics 10× faster. A hands-on session on agent-native design workflows.
    </Text>

    <Line x={64} y={920} w={952} thickness={2} color="var(--ox-surface)" />

    {/* speaker chip */}
    <Ellipse x={64} y={980} w={120} h={120} fill="var(--ox-accent)" />
    <Text x={210} y={994} w={440} size={40} weight={700} color="var(--ox-fg)">
      Daniel Lee
    </Text>
    <Text x={210} y={1046} w={440} size={28} weight={400} color="var(--ox-muted)">
      Design Engineer
    </Text>

    {/* date badge */}
    <Box x={664} y={976} w={352} h={128} fill="var(--ox-accent2)" radius={16}>
      <Text x={28} y={28} w={296} size={28} weight={600} align="center" color="#0b2447">
        JUL 14 · 10:00 PT
      </Text>
      <Text x={28} y={68} w={296} size={38} weight={800} align="center" color="#0b2447">
        Save my seat
      </Text>
    </Box>

    <Text x={64} y={1240} w={952} size={28} weight={500} color="var(--ox-muted)" align="center">
      opencanva.dev/webinar
    </Text>
  </>
);
Promo.id = 'promo';
Promo.label = 'Webinar';

export const artboard: Artboard = { w: 1080, h: 1350 };

export const meta: DesignMeta = {
  title: 'Webinar Promo',
  author: 'OpenCanva',
  theme: 'blueprint',
  createdAt: '2026-06-20T09:20:00Z',
};

export default [Promo] satisfies Scene[];
