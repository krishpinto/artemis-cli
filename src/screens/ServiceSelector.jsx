// ServiceSelector.jsx — The interactive service picker.
//
// What it does:
//   1. Lists all services from catalog.js
//   2. User navigates with ↑↓, toggles selection with Space, confirms with Enter
//   3. Calls onDone(selectedServices) with the array of chosen service configs
//
// This is the most interactive screen — the one that makes the CLI feel like a real app.

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SERVICE_CATALOG } from '../services/catalog.js';

export default function ServiceSelector({ onDone }) {
  const [cursor, setCursor]   = useState(0);
  // selected is a Set of service IDs — Set makes toggle O(1) and deduplication automatic
  const [selected, setSelected] = useState(new Set());

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1));
    }

    if (key.downArrow) {
      setCursor(c => Math.min(SERVICE_CATALOG.length - 1, c + 1));
    }

    if (input === ' ') {
      // Space toggles the service under the cursor
      const id = SERVICE_CATALOG[cursor].id;
      setSelected(prev => {
        const next = new Set(prev);
        // If already selected → remove it. If not → add it.
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }

    if (key.return) {
      // Must have at least one service selected before proceeding
      if (selected.size === 0) return;

      // Filter the full catalog down to just the selected services, preserving order
      const chosen = SERVICE_CATALOG.filter(s => selected.has(s.id));
      onDone(chosen);
    }

    // 'a' selects or deselects all services at once
    if (input === 'a') {
      if (selected.size === SERVICE_CATALOG.length) {
        setSelected(new Set()); // all selected → deselect all
      } else {
        setSelected(new Set(SERVICE_CATALOG.map(s => s.id))); // select all
      }
    }
  });

  return (
    <Box flexDirection="column" paddingTop={1} paddingLeft={2}>

      {/* Header */}
      <Text color="cyan" bold>🛰️  Select your payload</Text>
      <Box marginTop={1} marginBottom={1}>
        <Text color="gray">  ↑↓ navigate  ·  Space toggle  ·  A select all  ·  Enter launch</Text>
      </Box>

      {/* Service list */}
      {SERVICE_CATALOG.map((service, i) => {
        const isActive   = i === cursor;
        const isSelected = selected.has(service.id);

        return (
          <Box key={service.id} marginBottom={0}>
            {/* Cursor */}
            <Text color="cyan">{isActive ? '› ' : '  '}</Text>

            {/* Checkbox — [✓] when selected, [ ] when not */}
            <Text color={isSelected ? 'green' : 'gray'}>
              {isSelected ? '[✓] ' : '[ ] '}
            </Text>

            {/* Service name */}
            <Text color={isActive ? 'white' : 'gray'} bold={isActive}>
              {service.name.padEnd(14)}
            </Text>

            {/* Short description — only shown on the active row to reduce noise */}
            {isActive && (
              <Text color="gray">{service.description}</Text>
            )}
          </Box>
        );
      })}

      {/* Footer: confirm hint */}
      <Box marginTop={1}>
        {selected.size > 0 ? (
          <Text color="green">  🚀 {selected.size} service{selected.size > 1 ? 's' : ''} in payload — press Enter to launch</Text>
        ) : (
          <Text color="gray">  Select at least one service to continue</Text>
        )}
      </Box>

    </Box>
  );
}
