import React, { useState } from 'react';
import { Box, Text } from 'ink';
import Splash          from './screens/Splash.jsx';
import ClusterSetup    from './screens/ClusterSetup.jsx';
import ServiceSelector from './screens/ServiceSelector.jsx';
import Deploying       from './screens/Deploying.jsx';
import Done            from './screens/Done.jsx';

const ASCII = `
 █████╗ ██████╗ ████████╗███████╗███╗   ███╗██╗███████╗
██╔══██╗██╔══██╗╚══██╔══╝██╔════╝████╗ ████║██║██╔════╝
███████║██████╔╝   ██║   █████╗  ██╔████╔██║██║███████╗
██╔══██║██╔══██╗   ██║   ██╔══╝  ██║╚██╔╝██║██║╚════██║
██║  ██║██║  ██║   ██║   ███████╗██║ ╚═╝ ██║██║███████║
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝╚══════╝`;

// Header shown persistently on every screen after splash
function Header() {
  return (
    <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
      <Text color="cyan">{ASCII}</Text>
      <Box marginTop={1} marginBottom={1}>
        <Text color="white">  🚀 One command. </Text>
        <Text color="cyan" bold>Launch your entire dev stack.</Text>
        <Text color="gray">  ·  v{__APP_VERSION__} by Krish Pinto</Text>
      </Box>
    </Box>
  );
}

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [context,  setContext]  = useState(null);
  const [services, setServices] = useState([]);
  const [results,  setResults]  = useState([]);

  // Splash handles its own ASCII — no persistent header yet
  if (screen === 'splash') {
    return <Splash onDone={() => setScreen('clusterSetup')} />;
  }

  // All other screens get the persistent header above them
  return (
    <Box flexDirection="column">
      <Header />

      {screen === 'clusterSetup' && (
        <ClusterSetup
          onDone={(selectedContext) => {
            setContext(selectedContext);
            setScreen('serviceSelector');
          }}
        />
      )}

      {screen === 'serviceSelector' && (
        <ServiceSelector
          onDone={(selectedServices) => {
            setServices(selectedServices);
            setScreen('deploying');
          }}
        />
      )}

      {screen === 'deploying' && (
        <Deploying
          context={context}
          services={services}
          onDone={(deployResults) => {
            setResults(deployResults);
            setScreen('done');
          }}
        />
      )}

      {screen === 'done' && <Done results={results} />}
    </Box>
  );
}
