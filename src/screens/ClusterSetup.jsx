// ClusterSetup.jsx — Shows the detected Kubernetes contexts and lets the user pick one.
//
// What it does:
//   1. Reads the available contexts from kubeconfig (via createK8sClient)
//   2. Highlights the currently active context
//   3. User navigates with arrow keys, presses Enter to confirm
//   4. Calls onDone(selectedContext) to pass the choice back to app.jsx
//
// New Ink concept here: useInput — a hook that listens for keypresses in the terminal.
// It's how all keyboard navigation in terminal UIs works.

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { createK8sClient } from '../k8s/client.js';

export default function ClusterSetup({ onDone }) {
  // Load the k8s client once to read the available contexts.
  // We call createK8sClient() directly here — it's synchronous (just reads a file).
  const { contexts, currentContext } = createK8sClient();

  // Track which item in the list the cursor is on
  const [cursor, setCursor] = useState(
    // Start the cursor on the currently active context so it feels pre-selected
    Math.max(0, contexts.indexOf(currentContext))
  );

  // useInput fires a callback on every keypress while this component is rendered.
  // key.upArrow, key.downArrow, key.return are the properties we care about.
  useInput((input, key) => {
    if (key.upArrow) {
      // Move cursor up, but not past the first item
      setCursor(c => Math.max(0, c - 1));
    }
    if (key.downArrow) {
      // Move cursor down, but not past the last item
      setCursor(c => Math.min(contexts.length - 1, c + 1));
    }
    if (key.return) {
      // User pressed Enter — pass the selected context name back to app.jsx
      onDone(contexts[cursor]);
    }
  });

  return (
    <Box flexDirection="column" paddingTop={1} paddingLeft={2}>

      {/* Header */}
      <Text color="cyan" bold>🌍 Select a launch site</Text>
      <Box marginTop={1} marginBottom={1}>
        <Text color="gray">  Use ↑↓ arrows to navigate, Enter to confirm</Text>
      </Box>

      {/* Render one row per context */}
      {contexts.map((ctx, i) => {
        const isSelected = i === cursor;
        const isCurrent  = ctx === currentContext;

        return (
          <Box key={ctx}>
            {/* Cursor indicator: "›" on the selected row, " " on others */}
            <Text color="cyan">{isSelected ? '› ' : '  '}</Text>

            {/* Context name — bold and white when selected, gray when not */}
            <Text color={isSelected ? 'white' : 'gray'} bold={isSelected}>
              {ctx}
            </Text>

            {/* "(active)" badge next to the currently active context */}
            {isCurrent && (
              <Text color="green">  (active)</Text>
            )}
          </Box>
        );
      })}

      {/* If no contexts found — kubeconfig is missing or empty */}
      {contexts.length === 0 && (
        <Box marginTop={1}>
          <Text color="red">✗ No launch sites found.</Text>
          <Text color="gray"> Is Docker Desktop running with Kubernetes enabled?</Text>
        </Box>
      )}

    </Box>
  );
}
