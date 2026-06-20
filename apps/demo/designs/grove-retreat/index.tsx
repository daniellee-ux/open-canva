import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ── Top forest-green header band: the signature motif ── */}
    <Box x={0} y={0} w={1240} h={470} fill="var(--ox-accent)" />

    {/* faint concentric tree-ring rings, top-right, subtle on the band */}
    <Ellipse x={760} y={-260} w={760} h={760} fill="none" borderColor="var(--ox-bg)" borderWidth={2} opacity={0.16} />
    <Ellipse x={840} y={-180} w={600} h={600} fill="none" borderColor="var(--ox-bg)" borderWidth={2} opacity={0.13} />
    <Ellipse x={910} y={-110} w={460} h={460} fill="none" borderColor="var(--ox-bg)" borderWidth={2} opacity={0.1} />
    <Ellipse x={978} y={-44} w={324} h={324} fill="none" borderColor="var(--ox-bg)" borderWidth={2} opacity={0.08} />

    {/* Kicker + coral spark rule */}
    <Text x={96} y={72} w={900} size={26} weight={700} color="var(--ox-bg)" uppercase letterSpacing={9} font="body">
      A weekend in the woods
    </Text>
    <Line x={100} y={116} w={150} thickness={5} color="var(--ox-accent2)" />

    {/* Masthead title on the green band */}
    <Text x={92} y={158} w={1060} size={172} weight={800} lineHeight={0.9} color="var(--ox-bg)" font="display">
      {'The Cedar' + '\n' + 'Grove Retreat'}
    </Text>

    {/* ── Parchment body ── */}
    <Text x={96} y={548} w={300} size={24} weight={700} color="var(--ox-accent)" uppercase letterSpacing={6} font="body">
      Est. Wildwood
    </Text>
    <Line x={100} y={588} w={92} thickness={4} color="var(--ox-accent2)" />

    <Text x={96} y={626} w={1052} size={33} weight={500} lineHeight={1.34} color="var(--ox-fg)" font="body">
      Three slow days among the firs — trail walks, fireside talks, cold-water swims, and the kind of quiet that resets a year. No screens, no schedules you didn't choose.
    </Text>

    {/* ── Detail grid: three editorial blocks ── */}
    {/* Dates */}
    <Text x={96} y={820} w={360} size={22} weight={700} color="var(--ox-muted)" uppercase letterSpacing={5} font="body">
      The dates
    </Text>
    <Line x={96} y={858} w={360} thickness={2} color="var(--ox-accent)" opacity={0.35} />
    <Text x={96} y={874} w={120} size={96} weight={800} color="var(--ox-accent2)" font="display" lineHeight={0.95}>
      19
    </Text>
    <Text x={206} y={880} w={250} size={40} weight={600} lineHeight={1.12} color="var(--ox-fg)" font="display">
      {'– 21' + '\n' + 'Sept'}
    </Text>
    <Text x={96} y={1004} w={360} size={28} weight={500} color="var(--ox-fg)" font="body">
      Friday eve to Sunday noon, 2026
    </Text>

    {/* Location */}
    <Text x={520} y={820} w={300} size={22} weight={700} color="var(--ox-muted)" uppercase letterSpacing={5} font="body">
      The place
    </Text>
    <Line x={520} y={858} w={300} thickness={2} color="var(--ox-accent)" opacity={0.35} />
    <Text x={520} y={880} w={320} size={52} weight={700} lineHeight={1.05} color="var(--ox-fg)" font="display">
      {'Hollow Pine' + '\n' + 'Lodge'}
    </Text>
    <Text x={520} y={1004} w={340} size={28} weight={500} color="var(--ox-fg)" font="body">
      Mistwood Valley, Cascade foothills
    </Text>

    {/* Includes */}
    <Text x={892} y={820} w={260} size={22} weight={700} color="var(--ox-muted)" uppercase letterSpacing={5} font="body">
      Included
    </Text>
    <Line x={892} y={858} w={252} thickness={2} color="var(--ox-accent)" opacity={0.35} />
    <Text x={892} y={882} w={262} size={30} weight={500} lineHeight={1.42} color="var(--ox-fg)" font="body">
      {'Cabin lodging' + '\n' + 'All meals' + '\n' + 'Guided hikes' + '\n' + 'Sauna & fire'}
    </Text>

    {/* divider before footer */}
    <Line x={96} y={1140} w={1048} thickness={2} color="var(--ox-accent)" opacity={0.3} />

    {/* schedule strip */}
    <Text x={96} y={1180} w={1048} size={26} weight={600} color="var(--ox-fg)" font="body" letterSpacing={1}>
      Twelve spots only — small group, long table, real rest.
    </Text>

    {/* ── Footer green panel with the CTA ── */}
    <Box x={0} y={1296} w={1240} h={458} fill="var(--ox-accent)" />

    {/* faint single ring bottom-left */}
    <Ellipse x={-180} y={1430} w={520} h={520} fill="none" borderColor="var(--ox-bg)" borderWidth={2} opacity={0.12} />

    <Text x={96} y={1356} w={760} size={30} weight={700} color="var(--ox-accent2)" uppercase letterSpacing={7} font="body">
      Reserve your spot
    </Text>
    <Text x={96} y={1404} w={720} size={64} weight={700} lineHeight={1.04} color="var(--ox-bg)" font="display">
      {'Hold your seat' + '\n' + 'by the fire.'}
    </Text>
    <Text x={96} y={1576} w={720} size={30} weight={500} lineHeight={1.35} color="var(--ox-bg)" font="body">
      {'$420 per person · early-bird through Aug 1' + '\n' + 'cedargrove.retreat — book online'}
    </Text>

    {/* CTA button (coral spark as the action) */}
    <Box x={838} y={1430} w={306} h={118} fill="var(--ox-accent2)" radius={6} shadow="0 16px 36px rgba(0,0,0,0.22)">
      <Text x={0} y={0} w={306} h={118} align="center" valign="center" size={38} weight={800} color="var(--ox-accent)" font="display" letterSpacing={1}>
        Reserve →
      </Text>
    </Box>
    <Text x={838} y={1572} w={306} size={24} weight={500} align="center" color="var(--ox-bg)" font="body" opacity={0.85}>
      Limited cabins remain
    </Text>
  </>
);
Main.id = 'grove-retreat';
Main.label = 'The Cedar Grove Retreat';

export const design: DesignSystem = {
  palette: {
    bg: '#e8e4d6',
    fg: '#192b1b',
    muted: '#7c7a66',
    accent: '#192b1b',
    accent2: '#c8524a',
    surface: '#dedad0',
  },
  fonts: {
    display: "'Fraunces', Georgia, serif",
    body: "'Work Sans', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 6,
};
export const meta: DesignMeta = {
  title: 'The Cedar Grove Retreat',
  author: 'OpenCanva',
  createdAt: '2026-06-20T09:00:00Z',
};
export const artboard: Artboard = { w: 1240, h: 1754 };
export default [Main] satisfies Scene[];
