import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, Scene } from '@opencanva/core';

const Poster: Scene = () => (
  <>
    {/* decorative blobs */}
    <Ellipse x={-170} y={-180} w={560} h={560} fill="var(--ox-accent2)" opacity={0.22} />
    <Ellipse x={720} y={690} w={520} h={520} fill="var(--ox-accent)" opacity={0.3} />

    <Text x={96} y={140} w={888} size={34} weight={700} color="var(--ox-accent2)" uppercase letterSpacing={10}>
      Limited time only
    </Text>

    <Text x={88} y={196} w={920} size={196} weight={800} lineHeight={0.9} font="display">
      Summer{'\n'}Sale
    </Text>

    <Line x={96} y={612} w={300} thickness={6} color="var(--ox-accent2)" />

    <Text x={96} y={648} w={760} size={56} weight={500} color="var(--ox-fg)">
      Up to 50% off everything in store.
    </Text>

    {/* CTA button: a Box with a centered Text child (they move together) */}
    <Box x={96} y={808} w={420} h={132} fill="var(--ox-accent)" radius={66} shadow="0 24px 60px rgba(255,122,89,0.45)">
      <Text x={0} y={0} w={420} h={132} align="center" valign="center" size={52} weight={700} color="#1c0a16">
        Shop now →
      </Text>
    </Box>

    <Text x={560} y={852} w={420} size={30} weight={500} color="var(--ox-muted)" valign="center" h={44}>
      use code SUN50
    </Text>
  </>
);
Poster.id = 'poster';
Poster.label = 'Summer Sale';

export const artboard: Artboard = { w: 1080, h: 1080 };

export const meta: DesignMeta = {
  title: 'Summer Sale',
  author: 'OpenCanva',
  theme: 'sunset',
  createdAt: '2026-06-20T09:00:00Z',
};

export default [Poster] satisfies Scene[];
