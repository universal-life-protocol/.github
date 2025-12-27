---
layout: default
title: Network Partitions
nav_order: 13
description: "Handling network partitions using geometric duality and Betti numbers"
permalink: /NETWORK_PARTITIONS
---

# Network Partitions

## What is a Network Partition?

A network partition occurs when a distributed system splits into disconnected groups that can't communicate with each other. This is a fundamental challenge in distributed systems - how do you maintain consensus when nodes can't talk to each other?

Traditional systems (like Raft or Paxos) handle this with complex quorum mechanisms and timeout-based detection. Geometric consensus provides a more elegant solution using **topological invariants** and **geometric duality**.

## The Geometric Approach

### Core Insight

Network partitions manifest as **disconnected components** in the vertex connectivity graph. The topological invariant β₀ (Betti number zero) counts connected components, providing instant partition detection.

```
Unified Network:           Partitioned Network:
    β₀ = 1                     β₀ = 2
    (connected)                (disconnected)
    
    Cube (8 vertices)          2 × Tetrahedron (4 vertices each)
    50% threshold     ⟺        100% threshold (per partition)
```

When a network partitions, geometric consensus automatically:
1. **Detects** the partition using Betti numbers
2. **Decomposes** the consensus shape to fit each partition
3. **Recovers** unified consensus when partitions reconnect

## Why Betti Numbers?

### Traditional Approach

```python
# DFS/BFS to find connected components
visited = set()
components = []
for vertex in vertices:
    if vertex not in visited:
        component = dfs(vertex, graph, visited)  # O(v + e)
        components.append(component)
```

**Complexity**: O(v + e) where e = edges

### Betti Number Approach

```python
# Direct topological calculation
betti = calculate_betti_numbers(simplicial_complex)
partition_count = betti.beta_0  # O(v)
```

**Complexity**: O(v) - fewer operations

**Key Advantage**: Betti numbers are already required for geometric validation (preventing cycles: β₁ = 0), so partition detection is **free**.

## How It Works

### Step 1: Partition Detection

A network is partitioned if and only if β₀ > 1.

```python
class BettiPartitionDetector:
    def detect_partition(vertices):
        graph = build_vertex_connectivity_graph(vertices)
        betti = calculate_betti_numbers(graph)
        
        # β₀ = 1: unified network
        # β₀ > 1: partitioned network
        is_partitioned = betti.beta_0 > 1
        partition_count = betti.beta_0
        
        return PartitionInfo(
            is_partitioned=is_partitioned,
            partition_count=partition_count,
            components=extract_connected_components(graph)
        )
```

### Step 2: Geometric Decomposition

When a network partitions, the consensus shape automatically decomposes:

| Original | Vertices | Threshold | After Partition | Per Partition | New Threshold |
|----------|----------|-----------|-----------------|---------------|---------------|
| 24-cell  | 24       | 20/24 (83%) | 2 parts | Cuboctahedron | 12 vertices | 10/12 (83%) |
| Cube     | 8        | 4/8 (50%)   | 2 parts | Tetrahedron | 4 vertices | 4/4 (100%) |
| Octahedron | 6     | 5/6 (83%)   | 2 parts | Triangle | 3 vertices | 3/3 (100%) |

**Key Observation**: Threshold **percentage** either stays constant or increases (degrades gracefully to unanimity). This prevents attacks where partitioning reduces security.

### Step 3: Dual-Based Recovery

When partitions reconnect, geometric duality provides automatic mapping:

```
Unified State:              Partitioned State:
Cube (8 vertices)     ⟷     2 × Tetrahedron (4 each)
  ↕ dual                      ↕ dual
Octahedron (6 vertices) ⟷   2 × Triangle (3 each)
```

The dual relationship ensures that consensus from partitions can be mathematically combined into unified consensus.

## Example: Cube Partitions into Tetrahedra

```yaml
Initial State:
  geometric_type: Cube
  vertices: 8
  threshold: 4/8 (50%)
  β₀: 1  # Unified network
  consensus_requirement: "MAY_SYSTEM"

Partition Event:
  cause: "network_split"
  result: "2 disconnected components"
  β₀: 2  # Partitioned

Partition 1:
  vertices: [v1, v2, v3, v4]
  decomposed_type: Tetrahedron
  threshold: 4/4 (100%)
  local_agrees: 4/4
  local_valid: true

Partition 2:
  vertices: [v5, v6, v7, v8]
  decomposed_type: Tetrahedron
  threshold: 4/4 (100%)
  local_agrees: 4/4
  local_valid: true

Recovery:
  method: "dual_mapping"
  dual_of_cube: Octahedron
  combined_agrees: 8/8
  combined_required: 4/8 (original threshold)
  unified_valid: true
```

## Advantages Over Traditional Approaches

| Aspect | Raft/Paxos | Geometric Duality |
|--------|------------|-------------------|
| **Partition Detection** | Heartbeat timeout | β₀ > 1 (topological) |
| **Detection Latency** | Network RTT × timeout | Immediate (O(v)) |
| **Quorum Calculation** | ⌊n/2⌋ + 1 | Geometric threshold (varies) |
| **Split-Brain Prevention** | Majority quorum | Geometric decomposition |
| **Recovery** | Leader election | Dual mapping |
| **False Positives** | Network delays | None (topological property) |

### Key Benefits

1. **Instant Detection**: β₀ calculation is O(v), no network round-trips
2. **No False Positives**: Topological property, not timeout-based
3. **Semantic Preservation**: Duality maintains consensus meaning
4. **Automatic Degradation**: Dimensional reduction provides graceful degradation
5. **Mathematical Guarantees**: Formal proofs of correctness

## Security Considerations

### Partition Attack Resistance

**Attack**: Malicious actor forces network partition to reduce consensus threshold.

**Mitigation**: 
- Decomposition **increases** threshold (never decreases)
- Partition = degradation to unanimity (harder to achieve consensus)
- Duality mapping verified cryptographically

### False Partition Claims

**Attack**: Node falsely claims partition to operate independently.

**Mitigation**:
- β₀ calculated from actual connectivity, not node claims
- Cryptographic signatures on partition certificates
- Dual recovery requires proof from all partitions

## Learn More

- [Detailed Partition Handling](concepts/network-partitions.md) - Complete technical specification
- [Geometric Consensus](GEOMETRIC_CONSENSUS.md) - Overview of geometric consensus
- [Architecture: Consensus Mechanisms](architecture/consensus-mechanisms.md) - Implementation details

## References

For the complete specification, see the [research documentation](../dev-docs/research/dev_docs/network-partition.md).

