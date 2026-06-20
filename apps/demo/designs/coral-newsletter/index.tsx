import { Box, Ellipse, Icon, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* Decorative coral arcs bleeding off corners */}
    <Ellipse x={760} y={-260} w={620} h={620} fill="var(--ox-accent)" opacity={0.16} />
    <Ellipse x={-200} y={760} w={520} h={520} fill="var(--ox-accent)" opacity={0.12} />

    {/* Coral feature band across the top */}
    <Box x={0} y={0} w={1080} h={300} fill="var(--ox-accent)" radius={0} />
    <Box x={0} y={284} w={1080} h={16} fill="var(--ox-accent2)" radius={0} />

    {/* Scattered envelope + spark motifs on the coral band */}
    <Icon glyph="✉️" size={70} x={120} y={70} />
    <Icon glyph="✦" size={40} color="#ffffff" x={300} y={58} />
    <Icon glyph="✦" size={28} color="#ffffff" x={880} y={210} />
    <Ellipse x={910} y={70} w={86} h={86} fill="#ffffff" opacity={0.22} />
    <Icon glyph="📬" size={56} x={924} y={86} />

    {/* Eyebrow + headline on coral */}
    <Text x={210} y={86} w={520} size={26} weight={700} color="#fff1ec" uppercase letterSpacing={6} font="body">
      The Slow Sunday Letter
    </Text>
    <Text x={120} y={140} w={840} size={108} weight={800} lineHeight={0.92} color="#ffffff" font="display">
      Join our{'\n'}newsletter
    </Text>

    {/* Subhead on cream */}
    <Text x={120} y={352} w={840} size={34} weight={500} color="var(--ox-muted)" lineHeight={1.32} font="body">
      One thoughtful email each week — recipes, slow reads, and small joys. No spam, ever. Unsubscribe anytime.
    </Text>

    {/* Three quick perks with coral dots */}
    <Ellipse x={124} y={506} w={18} h={18} fill="var(--ox-accent)" />
    <Text x={158} y={498} w={760} size={30} weight={600} color="var(--ox-fg)" font="body">
      Weekly stories, hand-picked links, and a fresh recipe
    </Text>
    <Ellipse x={124} y={556} w={18} h={18} fill="var(--ox-accent)" />
    <Text x={158} y={548} w={760} size={30} weight={600} color="var(--ox-fg)" font="body">
      Subscriber-only guides and a free starter kit
    </Text>

    {/* Signup card — white on cream with signature coral top border */}
    <Box x={120} y={632} w={840} h={300} fill="var(--ox-surface)" radius={12} shadow="0 24px 60px rgba(26,26,26,0.10)">
      <Box x={0} y={0} w={840} h={6} fill="var(--ox-accent)" radius={0} />
    </Box>

    <Text x={160} y={672} w={760} size={26} weight={700} color="var(--ox-accent)" uppercase letterSpacing={4} font="body">
      Get on the list
    </Text>

    {/* Email input field */}
    <Box x={160} y={720} w={760} h={86} fill="#ffffff" radius={10} borderColor="#E4DCCF" borderWidth={2}>
      <Text x={28} y={0} w={500} h={86} valign="center" size={32} weight={500} color="var(--ox-muted)" font="body">
        you@example.com
      </Text>
    </Box>
    <Ellipse x={868} y={747} w={32} h={32} fill="var(--ox-accent)" opacity={0.18} />
    <Icon glyph="✉️" size={34} x={867} y={746} />

    {/* Subscribe button */}
    <Box x={160} y={830} w={760} h={84} fill="var(--ox-accent)" radius={10} shadow="0 10px 24px rgba(232,93,93,0.35)">
      <Text x={0} y={0} w={760} h={84} align="center" valign="center" size={36} weight={800} color="#ffffff" font="body">
        Subscribe — it's free
      </Text>
    </Box>

    {/* Footer trust line */}
    <Line x={120} y={984} w={120} thickness={4} color="var(--ox-accent)" />
    <Text x={120} y={1014} w={840} size={26} weight={500} color="var(--ox-muted)" font="body">
      Joined by 12,400+ curious readers · @theslowletter
    </Text>
  </>
);
Main.id = 'coral-newsletter';
Main.label = 'Join Our Newsletter';

export const design: DesignSystem = {
  palette: {
    bg: '#F5F0E8',
    fg: '#1A1A1A',
    muted: '#6B6B6B',
    accent: '#E85D5D',
    accent2: '#D44A4A',
    surface: '#FFFFFF',
  },
  fonts: {
    display: "'Fraunces', Georgia, serif",
    body: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  },
  radius: 12,
};
export const meta: DesignMeta = { title: 'Join Our Newsletter', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1080, h: 1080 };
export default [Main] satisfies Scene[];
