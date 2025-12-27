
import { Attributes, NodeEntry, SerializedGraph } from 'graphology-types';

export type ENTITY = {
  key: string;          // Unique wallet key of the node's author/owner
  root: string;         // Root hash of the Merkle DAG this node belongs to
  hash: string;         // Content hash (CID) of this specific node
  timestamp: number;    // Creation timestamp (logical clock value)
};
export type IDENTITY = {
  previous: string;
  hash: string; // Hashed of Encrypted Weights and/or Encrypted Weights & Features
  signature: string;
  timestamp: number;
};
export type DATA = {
  codec: string;      // Data encoding format (e.g., 'dag-cbor', 'float32-array')
  hash: string;       // Cryptographic hash of the data payload
  bytes: ArrayBuffer; // Actual binary content (tensors, objects, etc.)
  index: number;      // Position in schema or local subgraph structure
};
export type DOCUMENT = {
  author: string;
  title: string;
  summary: string;
  version: string;
}
export type DESCRIPTION = {
  author: string;     // Creator's identifier (name/DID)
  summary: string;    // Brief functional description
  description: string; // Detailed documentation
  signature: string;  // Cryptographic signature of this metadata
};
export type DETAILS = {
  roles: Record<string, any>;            // Functional/semantic roles this node fulfills
  responsibilities: Record<string, any>; // Operations/transformations this node performs
  relationships: Record<string, any>;    // Event subscriptions/publications
  references: Record<string, {          // Pointers to related nodes
    key: string;                   // Direct ancestor reference
    root: string;                       // Reference content hash
    hash: string;                  // Proof of reference validity
    timestamp: number;                  // When reference was established
  }>;
};
export type DEFINITION = {
  properties: Record<string, any>[];    // Data fields and their export types
  actions: Record<string, any>[];    // Semantic tags/embeddings
  events: Record<string, any>[];        // Event export types this node handles
  phases: Record<string, any>[];        // Lifecycle states
};
export type SCHEMA = {
  // Core entity identification and metadata
  entity: ENTITY,
  // Cryptographic identity and content information
  identity: IDENTITY;
  // Raw data payload with encoding information
  data: DATA;

  // Human-readable metadata with proof of authorship
  description: DESCRIPTION;

  // Semantic context and relationships
  details: DETAILS;

  // Structural schema definitions
  definitions: DEFINITION;
};

export interface NODE {
  read: string; // Node ID in source graph
  write: string; // Target graph ID
  sink: string; // Node ID in target graph
  source?: string; // Reference a transform function at any level
  features: string, //observed attributes(noun)

  weights: string, // internal configuration(modifier)

  bias: string, //perspective or predisposition(context)

  activate: string, //signal to act on perception(verb)
  apply: () => Promise<string> // enact transformation (verb)

  step: () => Promise<string> // process in sequence (time)

  generate: () => Promise<string> // create something new (action)

  resolve: () => Promise<string> // conclude or collapse ambiguity (goal)}
}
export interface EDGE {
  id: string;
  source: string; // Node ID in source graph
  target: string; // Node ID in target graph or node
  protocol?: string; // Reference a transform function at any level
  schema?: string; // Reference a translate function at any level
}
export interface LINK {
  input: string; // Node ID in source graph
  output: string; // Target graph ID
  proof: string; // Node ID in target graph
  transform?: string; // Reference a transform function at any level
}
export type LAYER = {
  entity: string;
  identity: Attributes;
  options: Attributes;
  attributes: Attributes;
  inputs: Attributes & { entity?: string };
  outputs: Attributes;
  sources: Attributes;
  targets: Attributes;
}
export type GRAPH = {
  entity: string;
  identity: Attributes;

  options: Attributes;
  attributes: Attributes;

  nodes: Attributes;
  edges: Attributes;
}
export interface IGRAPH {
  translate: (...content: any[]) => Promise<any>;
  transform: (...content: any[]) => Promise<any>;
  generate: (...content: any[]) => Promise<any>;
  propagate: (...content: any[]) => Promise<any>;
}