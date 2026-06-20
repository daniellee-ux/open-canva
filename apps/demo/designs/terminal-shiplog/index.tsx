import { Box, Ellipse, Line, Text } from '@opencanva/core';
import type { Artboard, DesignMeta, DesignSystem, Scene } from '@opencanva/core';

const Main: Scene = () => (
  <>
    {/* faint scanline / grid glow accents */}
    <Ellipse x={920} y={-220} w={620} h={620} fill="var(--ox-accent)" opacity={0.1} />
    <Ellipse x={-160} y={460} w={460} h={460} fill="var(--ox-accent)" opacity={0.07} />

    {/* terminal window */}
    <Box x={80} y={70} w={1120} h={580} fill="var(--ox-surface)" radius={16} borderColor="#2b3440" borderWidth={1} shadow="0 30px 70px rgba(0,0,0,0.55)" />

    {/* title bar */}
    <Box x={80} y={70} w={1120} h={56} fill="#161b22" radius={16} borderColor="#2b3440" borderWidth={1} />
    <Box x={80} y={102} w={1120} h={24} fill="#161b22" />
    <Ellipse x={108} y={89} w={16} h={16} fill="#ff5f56" />
    <Ellipse x={134} y={89} w={16} h={16} fill="#ffbd2e" />
    <Ellipse x={160} y={89} w={16} h={16} fill="#27c93f" />
    <Text x={300} y={86} w={680} h={24} align="center" valign="center" size={15} weight={500} color="var(--ox-muted)" font="body">
      ~/projects/aurora — shiplog — zsh
    </Text>

    {/* prompt line */}
    <Text x={120} y={158} w={60} size={18} weight={700} color="var(--ox-accent)" font="body">
      $
    </Text>
    <Text x={150} y={158} w={900} size={18} weight={500} color="var(--ox-fg)" font="body">
      git tag --release v2.0.0 && ./ship.sh
    </Text>

    {/* big release headline */}
    <Text x={120} y={206} w={760} size={28} weight={700} color="var(--ox-accent2)" letterSpacing={1} font="body">
      [ SHIP LOG ]
    </Text>
    <Text x={118} y={254} w={1000} size={108} weight={700} lineHeight={0.95} color="var(--ox-accent)" letterSpacing={-2} font="display">
      AURORA v2.0
    </Text>

    {/* version chip */}
    <Box x={920} y={232} w={196} h={44} fill="#0d2018" radius={8} borderColor="var(--ox-accent)" borderWidth={1}>
      <Text x={0} y={0} w={196} h={44} align="center" valign="center" size={16} weight={700} color="var(--ox-accent)" font="body">
        RELEASED · STABLE
      </Text>
    </Box>

    <Line x={120} y={382} w={960} thickness={1} color="#2b3440" dash="2 6" />

    {/* release bullets */}
    <Text x={120} y={392} w={40} size={20} weight={700} color="var(--ox-accent)" font="body">
      +
    </Text>
    <Text x={156} y={392} w={420} size={20} weight={600} color="var(--ox-fg)" font="body">
      Real-time collab engine
    </Text>
    <Text x={156} y={420} w={520} size={15} weight={400} color="var(--ox-muted)" font="body">
      // 4x faster sync, conflict-free edits
    </Text>

    <Text x={120} y={460} w={40} size={20} weight={700} color="var(--ox-accent)" font="body">
      +
    </Text>
    <Text x={156} y={460} w={420} size={20} weight={600} color="var(--ox-fg)" font="body">
      Dark-mode editor 2.0
    </Text>
    <Text x={156} y={488} w={520} size={15} weight={400} color="var(--ox-muted)" font="body">
      // themeable tokens, AA contrast
    </Text>

    <Text x={120} y={528} w={40} size={20} weight={700} color="var(--ox-accent)" font="body">
      +
    </Text>
    <Text x={156} y={528} w={420} size={20} weight={600} color="var(--ox-fg)" font="body">
      Public REST + webhooks
    </Text>
    <Text x={156} y={556} w={520} size={15} weight={400} color="var(--ox-muted)" font="body">
      // 38 endpoints, OpenAPI 3.1 spec
    </Text>

    {/* stats panel */}
    <Box x={720} y={392} w={360} h={196} fill="#0d1117" radius={12} borderColor="#2b3440" borderWidth={1} />
    <Text x={744} y={412} w={300} size={14} weight={500} color="var(--ox-muted)" uppercase letterSpacing={2} font="body">
      changeset
    </Text>
    <Text x={744} y={444} w={150} size={44} weight={700} color="var(--ox-accent)" font="display">
      214
    </Text>
    <Text x={744} y={494} w={150} size={14} weight={400} color="var(--ox-muted)" font="body">
      commits merged
    </Text>
    <Text x={912} y={444} w={150} size={44} weight={700} color="var(--ox-accent2)" font="display">
      31
    </Text>
    <Text x={912} y={494} w={150} size={14} weight={400} color="var(--ox-muted)" font="body">
      contributors
    </Text>

    {/* footer prompt + blinking cursor */}
    <Text x={120} y={600} w={40} size={18} weight={700} color="var(--ox-accent)" font="body">
      $
    </Text>
    <Text x={150} y={600} w={700} size={18} weight={500} color="var(--ox-muted)" font="body">
      run `npm i aurora@2.0.0` to upgrade
    </Text>
    <Box x={596} y={600} w={12} h={24} fill="var(--ox-accent)" />
  </>
);
Main.id = 'terminal-shiplog';
Main.label = 'Aurora v2.0 Ship Log';

export const design: DesignSystem = {
  palette: {
    bg: '#0d1117',
    fg: '#e6edf3',
    muted: '#7d8590',
    accent: '#39d353',
    accent2: '#58a6ff',
    surface: '#10161e',
  },
  fonts: {
    display: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
    body: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
  },
  radius: 16,
};
export const meta: DesignMeta = { title: 'Aurora v2.0 Ship Log', author: 'OpenCanva', createdAt: '2026-06-20T09:00:00Z' };
export const artboard: Artboard = { w: 1280, h: 720 };
export default [Main] satisfies Scene[];
