import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* ===== BACKGROUND DECORATION — tilted candy blocks bleeding past edges ===== */}
    <Box x={-60} y={-70} w={260} h={260} fill="var(--ox-accent)" borderColor="#000000" borderWidth={4} rotate={-14} z={1} opacity={0.9} />
    <Box x={900} y={-90} w={300} h={300} fill="#99E885" borderColor="#000000" borderWidth={4} rotate={12} z={1} opacity={0.9} />
    <Ellipse x={-90} y={760} w={320} h={320} fill="#C0F7FE" borderColor="#000000" borderWidth={4} z={1} opacity={0.9} />
    <Box x={930} y={840} w={280} h={280} fill="var(--ox-accent2)" borderColor="#000000" borderWidth={4} rotate={-10} z={1} opacity={0.9} />

    {/* scatter sticker dots */}
    <Ellipse x={70} y={470} w={54} h={54} fill="#FE90E8" borderColor="#000000" borderWidth={4} z={2} />
    <Ellipse x={955} y={470} w={48} h={48} fill="#F7CB46" borderColor="#000000" borderWidth={4} z={2} />
    <Box x={130} y={930} w={46} h={46} fill="#99E885" borderColor="#000000" borderWidth={4} rotate={18} z={2} />
    <Box x={905} y={415} w={42} h={42} fill="#FFDC8B" borderColor="#000000" borderWidth={4} rotate={-22} z={2} />

    {/* ===== TOP RIBBON ===== */}
    <Box x={64} y={56} w={952} h={96} fill="#C0F7FE" borderColor="#000000" borderWidth={4} radius={0} z={5} />
    <Box x={56} y={48} w={952} h={96} fill="#C0F7FE" borderColor="#000000" borderWidth={4} radius={0} z={6} />
    <Text x={56} y={48} w={760} h={96} align="left" valign="center" size={30} weight={900} color="#000000" font="display" uppercase letterSpacing={3}>
      {"★ The candy maximalist meetup"}
    </Text>
    <Box x={832} y={48} w={176} h={96} fill="#FE90E8" borderColor="#000000" borderWidth={4} z={7}>
      <Text x={0} y={0} w={176} h={96} align="center" valign="center" size={30} weight={900} color="#000000" font="display" uppercase letterSpacing={2}>
        Vol 06
      </Text>
    </Box>

    {/* ===== HERO HEADLINE BLOCK ===== */}
    {/* offset shadow behind hero card */}
    <Box x={76} y={216} w={928} h={384} fill="#000000" radius={0} z={8} />
    <Box x={64} y={204} w={928} h={384} fill="#FFFDF5" borderColor="#000000" borderWidth={4} radius={0} z={9} />

    <Text x={96} y={214} w={840} size={34} weight={900} color="#000000" font="display" uppercase letterSpacing={5} z={11}>
      Hello, you're invited to
    </Text>

    <Text x={92} y={276} w={935} size={176} weight={900} lineHeight={0.84} color="#000000" font="display" uppercase letterSpacing={-2} z={11}>
      {"Sticker\nFest"}
    </Text>

    {/* tilted year badge puncturing the hero edge */}
    <Box x={700} y={452} w={252} h={252} fill="#000000" rotate={8} z={11} />
    <Box x={688} y={440} w={252} h={252} fill="#F7CB46" borderColor="#000000" borderWidth={4} rotate={8} z={12}>
      <Text x={0} y={0} w={252} h={252} align="center" valign="center" size={96} weight={900} color="#000000" font="display" uppercase letterSpacing={-2}>
        2026
      </Text>
    </Box>

    {/* ===== DETAIL CARDS ROW (cycle pink / green / blue) ===== */}
    {/* Card 1 — DATE (pink) */}
    <Box x={76} y={648} w={292} h={232} fill="#000000" z={13} />
    <Box x={64} y={636} w={292} h={232} fill="#FE90E8" borderColor="#000000" borderWidth={4} z={14}>
      <Text x={22} y={20} w={250} size={26} weight={900} color="#000000" font="display" uppercase letterSpacing={3}>
        When
      </Text>
      <Line x={22} y={64} w={120} thickness={4} color="#000000" />
      <Text x={22} y={78} w={250} size={54} weight={900} lineHeight={0.86} color="#000000" font="display" uppercase letterSpacing={-1}>
        {"Sat\nMar 14"}
      </Text>
      <Text x={22} y={200} w={250} size={24} weight={700} color="#000000" font="body">
        11AM — Late
      </Text>
    </Box>

    {/* Card 2 — VENUE (green) */}
    <Box x={406} y={648} w={292} h={232} fill="#000000" z={13} />
    <Box x={394} y={636} w={292} h={232} fill="#99E885" borderColor="#000000" borderWidth={4} z={14}>
      <Text x={22} y={20} w={250} size={26} weight={900} color="#000000" font="display" uppercase letterSpacing={3}>
        Where
      </Text>
      <Line x={22} y={64} w={120} thickness={4} color="#000000" />
      <Text x={22} y={78} w={250} size={35} weight={900} lineHeight={0.9} color="#000000" font="display" uppercase letterSpacing={-1}>
        {"Goo\nWarehouse"}
      </Text>
      <Text x={22} y={200} w={250} size={24} weight={700} color="#000000" font="body">
        84 Marshmallow Ave
      </Text>
    </Box>

    {/* Card 3 — ENTRY (blue) */}
    <Box x={736} y={648} w={280} h={232} fill="#000000" z={13} />
    <Box x={724} y={636} w={280} h={232} fill="#C0F7FE" borderColor="#000000" borderWidth={4} z={14}>
      <Text x={22} y={20} w={240} size={26} weight={900} color="#000000" font="display" uppercase letterSpacing={3}>
        Entry
      </Text>
      <Line x={22} y={64} w={120} thickness={4} color="#000000" />
      <Text x={22} y={76} w={240} size={84} weight={900} lineHeight={0.86} color="#000000" font="display" uppercase letterSpacing={-2}>
        {"Free"}
      </Text>
      <Text x={22} y={178} w={240} size={20} weight={700} color="#000000" font="body" lineHeight={1.05}>
        BYO blank laptop + good vibes
      </Text>
    </Box>

    {/* ===== BOTTOM CTA BAR with featured yellow offset shadow ===== */}
    <Box x={88} y={928} w={904} h={108} fill="#F7CB46" z={15} />
    <Box x={64} y={904} w={904} h={108} fill="#FE90E8" borderColor="#000000" borderWidth={4} z={16} />
    <Text x={92} y={904} w={520} h={108} align="left" valign="center" size={42} weight={900} color="#000000" font="display" uppercase letterSpacing={1} z={18}>
      {"Swap • trade • stick"}
    </Text>
    <Box x={700} y={924} w={252} h={68} fill="#000000" z={17} />
    <Box x={688} y={916} w={252} h={68} fill="#FFFDF5" borderColor="#000000" borderWidth={4} z={18}>
      <Text x={0} y={0} w={252} h={68} align="center" valign="center" size={26} weight={900} color="#000000" font="display" uppercase letterSpacing={2}>
        Rsvp now
      </Text>
    </Box>

    {/* tiny tilted star sticker over the headline corner */}
    <Box x={108} y={172} w={64} h={64} fill="#99E885" borderColor="#000000" borderWidth={4} rotate={-18} z={19} />
    <Text x={108} y={172} w={64} h={64} align="center" valign="center" size={40} weight={900} color="#000000" font="display" rotate={-18} z={20}>
      {"★"}
    </Text>
  </>
);
Main.id = 'blockframe-fest';
Main.label = 'Sticker Fest 2026';

export const design: DesignSystem = {
  palette: {
    bg: '#FFFDF5',
    fg: '#000000',
    muted: '#7A7466',
    accent: '#FE90E8',
    accent2: '#F7CB46',
    surface: '#FFFFFF',
  },
  fonts: {
    display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif",
    body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 0,
};
export const meta: DesignMeta = { title: 'Sticker Fest 2026', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
