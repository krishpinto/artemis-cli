// client.js — Sets up the connection to your Kubernetes cluster.
//
// Kubernetes has an API server running inside your cluster. To talk to it,
// you need credentials and the server address — all of this lives in a file
// called "kubeconfig", usually at ~/.kube/config.
//
// This file was auto-created when you enabled Kubernetes in Docker Desktop.
// The @kubernetes/client-node library reads it and handles authentication for us.
//
// We return three things:
//   appsV1Api  — for managing Deployments (creating, deleting, checking status)
//   coreV1Api  — for managing Pods, Services, and PVCs
//   contexts   — the list of clusters in your kubeconfig (you might have more than one)
//   currentContext — whichever context is currently active

import * as k8s from '@kubernetes/client-node';

export function createK8sClient(contextName = null) {
  // KubeConfig is the main class — it reads your ~/.kube/config file
  const kc = new k8s.KubeConfig();

  // loadFromDefault() looks for the kubeconfig in the standard locations:
  //   1. KUBECONFIG environment variable (if set)
  //   2. ~/.kube/config (the default — this is where Docker Desktop writes it)
  kc.loadFromDefault();

  // If a specific context name was passed in (from the ClusterSetup screen),
  // switch to that context. Otherwise use whatever is currently active.
  if (contextName) {
    kc.setCurrentContext(contextName);
  }

  return {
    // makeApiClient creates a typed client for a specific k8s API group.
    // AppsV1Api handles Deployments, StatefulSets, DaemonSets, etc.
    appsV1Api: kc.makeApiClient(k8s.AppsV1Api),

    // CoreV1Api handles the "core" resources: Pods, Services, PVCs, ConfigMaps, Namespaces, etc.
    coreV1Api: kc.makeApiClient(k8s.CoreV1Api),

    // The list of all contexts (clusters) in your kubeconfig
    // e.g. ["docker-desktop", "minikube", "my-gke-cluster"]
    contexts: kc.getContexts().map(c => c.name),

    // The currently active context name
    currentContext: kc.getCurrentContext(),
  };
}
