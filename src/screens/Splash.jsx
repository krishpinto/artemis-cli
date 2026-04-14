// Splash.jsx — The opening screen shown when you run "npx artemis".
//
// ASCII art is hardcoded as a string — figlet loads fonts from disk at runtime
// which breaks when the CLI is bundled into a single file by esbuild.
// Hardcoding is more reliable and loads instantly.

import React, { useEffect } from 'react';
import { Box, Text } from 'ink';

// ANSI Shadow style ASCII art for "ARTEMIS"
const ASCII = `
 █████╗ ██████╗ ████████╗███████╗███╗   ███╗██╗███████╗
██╔══██╗██╔══██╗╚══██╔══╝██╔════╝████╗ ████║██║██╔════╝
███████║██████╔╝   ██║   █████╗  ██╔████╔██║██║███████╗
██╔══██║██╔══██╗   ██║   ██╔══╝  ██║╚██╔╝██║██║╚════██║
██║  ██║██║  ██║   ██║   ███████╗██║ ╚═╝ ██║██║███████║
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝╚══════╝`;

export default function Splash({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box flexDirection="column" paddingTop={1} paddingLeft={2}>
      <Text color="cyan">{ASCII}</Text>

      <Box marginTop={1}>
        <Text color="white">  🚀 One command. </Text>
        <Text color="cyan" bold>Launch your entire dev stack.</Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">  v1.0.0  ·  by Krish Pinto</Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">  Preparing for launch...</Text>
      </Box>
    </Box>
  );
}
