# 🔍 The Smurfing Hunter

**Advanced Blockchain AML Analysis Platform with AI-Powered Pattern Detection**

A cutting-edge graph-based visualization and analysis tool for detecting money laundering patterns (smurfing) in blockchain transactions. Built for hackathons and real-world AML compliance.

![Smurfing Hunter](https://img.shields.io/badge/Status-Active-green) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Key Features

### 1. Temporal Pattern-Aware Attention
- **Animated Transaction Flow**: Visual representation of transaction sequences over time
- **Timeline Slider**: Full-width scrubber with play/pause controls for temporal navigation
- **Temporal Heatmap**: 24x7 grid showing transaction density patterns
- **Attention Scoring**: Per-wallet temporal attention scores highlighting suspicious timing patterns
- **Pattern Detection**: Automatic detection of bursts, periodic patterns, and rapid sequences

### 2. Seed-Driven Subgraph Expansion ("Forensic Anchor")
- **Multi-Seed Management**: Add multiple wallets as investigation anchors
- **K-Hop Controls**: Expandable 1-5 hop distance with visual indicators
- **Directional Expansion**: Forward, Backward, or Bidirectional traversal
- **Advanced Filters**:
  - Minimum ETH value threshold
  - Entity type filtering
  - Time range constraints
- **Inverse Topology Mapping**: Interactive table showing all connected wallets sorted by suspicion score

### 3. Meta-Learning for Zero-Day Laundering ("Adaptive Guard")
- **Built-in Pattern Library**: 5 pre-trained laundering patterns:
  - Classic Fan-Out
  - Fan-In Aggregation
  - Peeling Chain
  - Rapid Layering
  - Classic Smurfing
- **Zero-Day Detection**: Identifies suspicious wallets that don't match known patterns
- **Few-Shot Learning**: Flag wallets to train new patterns with minimal examples
- **Confidence Scoring**: Pattern match confidence and overall risk assessment
- **Pattern Management**: Create, view, and manage custom patterns

## 🎯 Detection Patterns

| Pattern | Description | Indicators |
|---------|-------------|------------|
| Fan-Out | Single source → multiple recipients | High outgoing unique count |
| Fan-In | Multiple sources → single collector | High incoming unique count |
| Peeling Chain | Sequential decreasing transactions | Gradual value decrease |
| Rapid Burst | Multiple transactions in seconds | Time clustering |
| Periodic | Regular interval transactions | Low timing variance |

## 🖥️ UI Modes

### Overview Mode
- Full network visualization
- Temporal flow animation
- Heatmap overlay
- Top 10 suspicious wallets list

### Forensic Mode
- Seed-based subgraph isolation
- K-hop expansion controls
- Inverse topology table
- Path visualization

### Adaptive Guard Mode
- AI pattern matching results
- Zero-day candidate alerts
- Pattern library browser
- Wallet flagging system

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Visualization**: react-force-graph-2d (D3-based)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks
- **Build**: Vite

## 📦 Installation

```bash
# Clone the repository
git clone <repo-url>
cd smurf-detect-main

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📊 Data Format

The application expects CSV data with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| TxHash | string | Transaction hash |
| From | string | Sender address |
| To | string | Recipient address |
| Value_ETH | number | Transaction value in ETH |
| Age_seconds | number | Transaction age |
| From_entity_type | string | Sender entity classification |
| To_entity_type | string | Recipient entity classification |

## 🎮 Quick Start Guide

1. **Load Data**: Application auto-loads `dataset_small.csv`
2. **Explore**: Click nodes to see wallet details
3. **Temporal Analysis**: Use timeline slider to animate transaction flow
4. **Investigate**: Right-click suspicious wallets → "Set as Forensic Anchor"
5. **Expand**: In Forensic mode, configure K-hops and expand
6. **Flag**: Mark confirmed laundering to train the AI
7. **Detect**: Switch to Adaptive Guard to scan for zero-day patterns

## 🏆 Hackathon Highlights

### Novel Contributions
1. **Temporal Attention Mechanism**: First implementation of time-aware suspicion scoring
2. **Interactive Forensic Anchoring**: Patent-pending subgraph expansion UI
3. **Zero-Day Meta-Learning**: Few-shot learning for new laundering pattern detection

### Technical Innovations
- Real-time animated graph rendering
- Efficient K-hop BFS expansion
- Feature-based pattern similarity scoring
- Responsive canvas-based visualization

## 📄 License

MIT License - feel free to use for research and compliance purposes.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

---

**Built with ❤️ for blockchain transparency and AML compliance**
