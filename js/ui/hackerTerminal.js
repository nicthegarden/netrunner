// ==========================================
// Hacker Terminal — Auto-scrolling code effect
// Displays cyberpunk-themed code when hacking skills are active
// ==========================================

import { getGame } from '../main.js';

// Code snippets per hacking skill — rotated through as text streams
const CODE_SNIPPETS = {
  intrusion: [
    `// INTRUSION MODULE v7.3 — NetSec Bypass
function breachFirewall(target, port) {
  const payload = craftExploit('buffer_overflow', target.os);
  const tunnel = openTunnel(target.ip, port, { encrypted: true });
  
  if (tunnel.status === 'CONNECTED') {
    tunnel.inject(payload);
    const response = tunnel.waitForShell(TIMEOUT_MS);
    if (response.rootAccess) {
      log('[+] ROOT ACCESS OBTAINED');
      exfiltrate(target.dataVaults);
    }
  }
  return tunnel;
}`,
    `// Scanning subnet for vulnerable nodes...
const scanner = new SubnetScanner('10.77.0.0/16');
scanner.on('discovery', (node) => {
  const vulns = node.probe(['ssh', 'telnet', 'rdp', 'netrunner_api']);
  vulns.forEach(v => {
    if (v.severity >= CRITICAL) {
      exploitQueue.push({
        target: node.ip,
        vector: v.cve,
        payload: getExploit(v.cve),
        priority: v.severity
      });
    }
  });
});
scanner.start({ stealth: true, delay: randomBetween(50, 200) });`,
    `// Privilege escalation sequence
async function escalatePrivileges(session) {
  const kernel = await session.getKernelVersion();
  const exploits = vulnDB.query({ kernel, type: 'local_priv_esc' });
  
  for (const exploit of exploits) {
    log(\`[*] Trying \${exploit.name}...\`);
    const result = await session.execute(exploit.payload);
    if (result.uid === 0) {
      log('[+] ESCALATION SUCCESSFUL — UID 0');
      await installBackdoor(session, { persistent: true });
      return true;
    }
    log(\`[-] \${exploit.name} failed: \${result.error}\`);
  }
  return false;
}`,
    `// Corporate mainframe lateral movement
const pivotChain = [];
let currentNode = entryPoint;

while (currentNode.depth < MAX_DEPTH) {
  const neighbors = currentNode.arpScan();
  const highValue = neighbors.filter(n => 
    n.services.includes('database') || 
    n.services.includes('vault') ||
    n.hostname.match(/exec|ceo|finance/i)
  );
  
  if (highValue.length > 0) {
    const next = highValue[0];
    const creds = currentNode.dumpCredentials();
    const jumped = next.authenticate(creds);
    if (jumped) {
      pivotChain.push(next);
      currentNode = next;
      log(\`[+] Pivoted to \${next.hostname} (\${next.ip})\`);
    }
  }
}`,
    `// Deploying ICE bypass micro-agent
const agent = new MicroAgent({
  type: 'polymorphic',
  target: gateway.iceLayer,
  evasion: ['timing_jitter', 'packet_fragmentation', 'ssl_mimicry'],
  onDetection: () => agent.morph()
});

agent.infiltrate().then(shell => {
  shell.exec('cat /vault/credentials.db | encrypt > /tmp/.cache');
  shell.exec('scp /tmp/.cache runner@exit-node:/loot/');
  shell.exec('rm -rf /var/log/auth* /tmp/.cache');
  shell.disconnect({ wipe_traces: true });
});`,
  ],

  decryption: [
    `// DECRYPTION ENGINE v4.1 — Quantum-Resistant Cracker
class CipherCracker {
  constructor(ciphertext, algorithm) {
    this.data = Buffer.from(ciphertext, 'hex');
    this.algo = algorithm;
    this.keyspace = this._estimateKeyspace();
  }

  async crack() {
    log(\`[*] Cipher: \${this.algo} | Keyspace: 2^\${this.keyspace}\`);
    
    if (this.algo === 'AES-256-GCM') {
      return this._sidechannelAttack();
    } else if (this.algo === 'RSA-4096') {
      return this._quantumFactorize();
    }
    return this._bruteForce();
  }
  
  _sidechannelAttack() {
    const timings = collectCacheTimings(this.data, 10000);
    const keyBits = extractKeyFromTimings(timings);
    return decrypt(this.data, reconstructKey(keyBits));
  }
}`,
    `// Decrypting intercepted corporate comms
const encryptedStream = intercept.capture('arasaka.internal', 443);
const analyzer = new CryptoAnalyzer(encryptedStream);

analyzer.on('pattern_found', (pattern) => {
  log(\`[*] Detected pattern: \${pattern.type}\`);
  log(\`    Entropy: \${pattern.entropy.toFixed(4)}\`);
  log(\`    Confidence: \${(pattern.confidence * 100).toFixed(1)}%\`);
  
  if (pattern.confidence > 0.85) {
    const key = deriveKeyFromPattern(pattern);
    const plaintext = aesDecrypt(encryptedStream.buffer, key);
    vault.store('arasaka_comms_' + Date.now(), plaintext);
    log('[+] DECRYPTION COMPLETE — Data stored in vault');
  }
});

analyzer.run({ mode: 'frequency_analysis', depth: 'deep' });`,
    `// Rainbow table generation for password hashes
const hashType = identifyHash(targetHash);
log(\`[*] Hash type: \${hashType}\`);
log(\`[*] Building rainbow chain...\`);

const chain = new RainbowChain({
  charset: 'alphanumeric_special',
  minLen: 8,
  maxLen: 16,
  reductionFunctions: 4096,
  chainLength: 10000
});

chain.on('progress', (p) => {
  process.stdout.write(\`\\r[*] Chain progress: \${p.percent}% | ETA: \${p.eta}s\`);
});

const result = await chain.lookup(targetHash);
if (result) {
  log(\`\\n[+] CRACKED: \${result.plaintext}\`);
} else {
  log('\\n[-] Not found — expanding keyspace...');
}`,
    `// Quantum key distribution intercept
function interceptQKD(fiberTap) {
  const photonStream = fiberTap.capturePhotons();
  const basisGuess = [];
  
  photonStream.forEach((photon, i) => {
    const measurement = measurePhoton(photon, randomBasis());
    basisGuess.push({
      index: i,
      basis: measurement.basis,
      bit: measurement.result
    });
  });
  
  // Correlate with public basis announcement
  const sharedBits = correlateWithPublicBasis(basisGuess);
  log(\`[+] Extracted \${sharedBits.length} key bits from QKD channel\`);
  return reconstructSessionKey(sharedBits);
}`,
  ],

  ice_breaking: [
    `// ICE BREAKER v9.0 — Countermeasure Neutralizer
class ICEBreaker {
  constructor(iceType, strength) {
    this.type = iceType;
    this.strength = strength;
    this.tools = loadBreakingTools(iceType);
  }

  async neutralize() {
    log(\`[*] ICE Type: \${this.type} | Strength: \${this.strength}\`);
    log('[*] Deploying countermeasures...');
    
    switch (this.type) {
      case 'BLACK_ICE':
        return this._handleBlackICE();
      case 'TRACE_ICE':
        await this._spoofLocation();
        return this._overloadTracer();
      case 'BARRIER_ICE':
        return this._dissolveBarrier();
      case 'TAR_ICE':
        return this._cleanConnection();
    }
  }

  _handleBlackICE() {
    const shield = activateNeuralShield();
    const virus = craftCounterVirus(this.strength * 1.5);
    return { shield, virus, neutralized: true };
  }
}`,
    `// Real-time ICE detection and classification
const netMonitor = new ICEDetector(connectionPool);

netMonitor.on('ice_detected', (ice) => {
  console.warn(\`[!] ICE DETECTED on \${ice.node}\`);
  console.warn(\`    Type: \${ice.classification}\`);
  console.warn(\`    Threat Level: \${ice.threatLevel}/10\`);
  console.warn(\`    Neural Damage: \${ice.neuralDamage}v\`);
  
  const response = selectCountermeasure(ice);
  log(\`[*] Deploying: \${response.name}\`);
  
  response.execute().then(result => {
    if (result.success) {
      log(\`[+] ICE neutralized in \${result.elapsed}ms\`);
      log(\`[+] Path cleared to \${ice.node}\`);
    } else {
      log(\`[!] COUNTERMEASURE FAILED — JACKING OUT\`);
      emergencyDisconnect();
    }
  });
});`,
    `// Firewall dissolution algorithm
async function dissolveFirewall(fw) {
  const layers = fw.getLayers();
  log(\`[*] Firewall has \${layers.length} layers\`);
  
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    log(\`[*] Layer \${i+1}: \${layer.type} (\${layer.bitWidth}-bit)\`);
    
    const solver = new ConstraintSolver(layer.rules);
    const hole = await solver.findViolation({
      timeout: 5000,
      threads: navigator.hardwareConcurrency
    });
    
    if (hole) {
      log(\`[+] Found violation at rule \${hole.ruleIndex}\`);
      await layer.exploit(hole);
      log(\`[+] Layer \${i+1} dissolved\`);
    } else {
      log(\`[-] Layer \${i+1} is solid — brute-forcing...\`);
      await bruteForceLayer(layer);
    }
  }
  log('[+] ALL LAYERS DISSOLVED — Firewall down');
}`,
    `// Deploying neural feedback loop against hostile ICE
const blackIce = scan.identifyHostileICE();
log(\`[!] Hostile ICE: \${blackIce.name}\`);
log(\`[!] Attack Pattern: \${blackIce.attackType}\`);

const feedbackLoop = new NeuralFeedback({
  frequency: blackIce.resonanceFreq * 1.618,
  amplitude: blackIce.signalStrength + 20,
  pattern: 'fibonacci_spiral'
});

feedbackLoop.on('cycle', (n) => {
  const integrity = blackIce.checkIntegrity();
  log(\`[*] Cycle \${n}: ICE integrity at \${integrity}%\`);
  if (integrity < 15) {
    feedbackLoop.stop();
    log('[+] ICE SHATTERED — Safe to proceed');
  }
});

feedbackLoop.start();`,
  ],

  daemon_coding: [
    `// DAEMON COMPILER v3.7 — Autonomous Agent Builder
class Daemon {
  constructor(config) {
    this.name = config.name;
    this.type = config.type;
    this.persistence = config.persistence || 'volatile';
    this.modules = [];
    this.state = 'INITIALIZING';
  }

  addModule(mod) {
    this.modules.push(mod);
    log(\`[+] Module loaded: \${mod.name} (\${mod.size}kb)\`);
  }

  compile() {
    log(\`[*] Compiling daemon: \${this.name}\`);
    const bytecode = this.modules.map(m => m.compile()).join('');
    const optimized = optimize(bytecode, { level: 3 });
    this.binary = pack(optimized);
    this.state = 'COMPILED';
    log(\`[+] Daemon compiled: \${this.binary.length} bytes\`);
    return this;
  }

  deploy(target) {
    log(\`[*] Deploying \${this.name} to \${target.hostname}\`);
    target.inject(this.binary, { stealth: true });
    this.state = 'RUNNING';
  }
}`,
    `// Crafting a data exfiltration daemon
const exfilDaemon = new Daemon({
  name: 'SHADOW_SIPHON',
  type: 'exfiltration',
  persistence: 'firmware_level'
});

exfilDaemon.addModule(new Module('stealth_comms', {
  protocol: 'dns_tunnel',
  encryption: 'chacha20',
  beaconInterval: randomBetween(30, 120) * 1000
}));

exfilDaemon.addModule(new Module('data_harvester', {
  targets: ['*.db', '*.vault', '*.key', '*.wallet'],
  maxFileSize: '100MB',
  compression: 'lz4'
}));

exfilDaemon.addModule(new Module('self_destruct', {
  trigger: 'detection',
  method: 'secure_wipe',
  decoyPayload: generateDecoy()
}));

exfilDaemon.compile();
log('[+] SHADOW_SIPHON ready for deployment');`,
    `// Neural network training for adaptive daemons
const brain = new NeuralNet({
  layers: [128, 256, 256, 128, 64],
  activation: 'leaky_relu',
  optimizer: 'adam'
});

const trainingData = loadTrainingSet('ice_patterns_2077');
log(\`[*] Training on \${trainingData.length} ICE samples\`);

for (let epoch = 0; epoch < 1000; epoch++) {
  const loss = brain.train(trainingData.batch(64));
  if (epoch % 100 === 0) {
    log(\`[*] Epoch \${epoch}: loss=\${loss.toFixed(6)}\`);
  }
}

const adaptiveDaemon = new Daemon({
  name: 'GHOST_PROTOCOL',
  type: 'adaptive_infiltrator',
  brain: brain.export()
});

log('[+] Adaptive daemon trained — accuracy: 97.3%');`,
    `// Daemon swarm coordination protocol
const swarm = new DaemonSwarm({
  count: 16,
  template: 'micro_probe',
  coordination: 'mesh_network',
  objective: 'map_network_topology'
});

swarm.on('report', (probe, data) => {
  topology.merge(data.discoveredNodes);
  log(\`[*] Probe \${probe.id}: found \${data.discoveredNodes.length} nodes\`);
  log(\`    Total mapped: \${topology.nodeCount} nodes, \${topology.edgeCount} links\`);
});

swarm.on('probe_lost', (probe) => {
  log(\`[!] Probe \${probe.id} lost — possible ICE encounter at \${probe.lastPosition}\`);
  swarm.avoid(probe.lastPosition, { radius: 3 });
  swarm.spawn(1); // Replace lost probe
});

swarm.deploy();
log(\`[*] Swarm deployed — \${swarm.count} probes active\`);`,
  ],
};

// Thematic prefixes that get prepended as "status lines" between code blocks
const STATUS_LINES = {
  intrusion: [
    '> Scanning port range 1-65535...',
    '> Vulnerability found: CVE-2077-41337',
    '> Injecting shellcode payload...',
    '> Establishing reverse tunnel...',
    '> Bypassing authentication layer...',
    '> Extracting credential database...',
    '> Spoofing MAC address...',
    '> Pivoting to internal network...',
    '> Root shell obtained.',
    '> Downloading vault contents...',
    '> Wiping access logs...',
    '> Connection anonymized via 7 proxies.',
  ],
  decryption: [
    '> Analyzing cipher: AES-256-GCM...',
    '> Running frequency analysis...',
    '> Key fragment recovered: 0x4F7A...',
    '> Entropy check: 7.93 bits/byte',
    '> Attempting side-channel extraction...',
    '> Pattern matched — confidence 91.2%',
    '> Decryption key derived.',
    '> Plaintext extraction in progress...',
    '> Hash collision found at offset 0x7F3A',
    '> Quantum factorization: 23% complete...',
    '> Block cipher mode detected: CBC',
    '> Padding oracle response confirmed.',
  ],
  ice_breaking: [
    '> ICE signature detected: BLACK_ICE_v4',
    '> Deploying neural shield...',
    '> Countermeasure loaded: ICEBREAKER.exe',
    '> Firewall layer 1/4 dissolved.',
    '> Hostile trace detected — evading...',
    '> Barrier integrity: 34% remaining',
    '> Feedback loop frequency locked.',
    '> ICE attack pattern: NEURAL_SPIKE',
    '> Counter-virus injected.',
    '> Firewall rule violation found.',
    '> ICE shattered. Path clear.',
    '> Emergency shields holding at 67%.',
  ],
  daemon_coding: [
    '> Compiling daemon: SHADOW_SIPHON...',
    '> Module loaded: stealth_comms (12kb)',
    '> Module loaded: data_harvester (28kb)',
    '> Bytecode optimized: -34% size',
    '> Neural net training: epoch 500/1000',
    '> Daemon binary packed: 4,096 bytes',
    '> Deploying to target node...',
    '> Swarm probe #7 reporting...',
    '> Adaptive layer: accuracy 97.3%',
    '> Self-destruct module armed.',
    '> Daemon state: RUNNING',
    '> Mesh network established: 16 nodes.',
  ],
};

// How many characters to type per update tick (called every ~80ms)
const BASE_CHARS_PER_TICK = 3;
const MAX_BUFFER_LINES = 200; // Trim buffer to prevent DOM bloat

export class HackerTerminal {
  constructor() {
    this.outputEl = null;
    this.bodyEl = null;
    this.containerEl = null;
    this.skillLabelEl = null;
    this.toggleBtn = null;

    this.isActive = false;
    this.isMinimized = false;
    this.isHidden = false;
    this.currentSkillId = null;
    this.buffer = '';       // Full accumulated text in the terminal
    this.queue = '';        // Text waiting to be typed out
    this.snippetIndex = {}; // Per-skill index tracking which snippet is next
    this.statusIndex = {};  // Per-skill status line index
    this._typingInterval = null;
    this._lineCount = 0;
  }

  init() {
    this.containerEl = document.getElementById('hacker-terminal');
    this.outputEl = document.getElementById('hacker-terminal-output');
    this.bodyEl = document.getElementById('hacker-terminal-body');
    this.skillLabelEl = document.getElementById('hacker-terminal-skill');
    this.toggleBtn = document.getElementById('hacker-terminal-toggle');

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleVisibility());
    }

    if (this.containerEl) {
      this.containerEl.style.display = '';
    }
    this._renderIdleState();
  }

  /**
   * Called from the 500ms UI polling loop.
   * Checks if any hacking skill is active and starts/stops the terminal accordingly.
   */
  update() {
    const game = getGame();
    if (!game) return;

    // Find any active hacking skill (primary or background)
    const hackingSkillIds = ['intrusion', 'decryption', 'ice_breaking', 'daemon_coding'];
    let activeHack = null;

    for (const sid of hackingSkillIds) {
      const skill = game.skillManager.getSkill(sid);
      if (skill && skill.isActive && skill.activeAction) {
        // Prefer showing primary hack over background hack
        if (!skill._isBackgroundHack) {
          activeHack = { skillId: sid, skill, isBg: false };
          break;
        }
        if (!activeHack) {
          activeHack = { skillId: sid, skill, isBg: true };
        }
      }
    }

    if (activeHack) {
      if (!this.isActive || this.currentSkillId !== activeHack.skillId) {
        this.start(activeHack.skillId, activeHack.skill, activeHack.isBg);
      }
    } else {
      if (this.isActive) {
        this.stop();
      } else {
        this._renderIdleState();
      }
    }
  }

  start(skillId, skill, isBg) {
    if (!this.containerEl) return;

    this.isActive = true;
    this.currentSkillId = skillId;

    this._applyVisibility();

    // Update skill label
    if (this.skillLabelEl) {
      const bgTag = isBg ? ' [BG]' : '';
      this.skillLabelEl.textContent = `${skill.icon} ${skill.name}${bgTag}`;
    }

    // If switching skills, clear output
    this.buffer = '';
    this.queue = '';
    this._lineCount = 0;
    if (this.outputEl) this.outputEl.textContent = '';

    // Initialize snippet indices if needed
    if (this.snippetIndex[skillId] === undefined) {
      this.snippetIndex[skillId] = 0;
      this.statusIndex[skillId] = 0;
    }

    // Enqueue first chunk
    this._enqueueNext();

    // Start the typing interval (fast — 60ms between bursts)
    if (this._typingInterval) clearInterval(this._typingInterval);
    this._typingInterval = setInterval(() => this._typeChunk(), 60);
  }

  stop() {
    this.isActive = false;
    this.currentSkillId = null;

    if (this._typingInterval) {
      clearInterval(this._typingInterval);
      this._typingInterval = null;
    }

    this.buffer = '';
    this.queue = '';
    this._lineCount = 0;
    this._renderIdleState();
  }

  toggleVisibility() {
    this.isHidden = !this.isHidden;
    this.isMinimized = this.isHidden;
    this._applyVisibility();
  }

  _applyVisibility() {
    if (!this.containerEl || !this.bodyEl) return;

    this.containerEl.classList.toggle('is-hidden', this.isHidden);
    this.bodyEl.style.display = this.isHidden ? 'none' : '';
    if (this.bodyEl) {
      this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    }
    if (this.toggleBtn) {
      this.toggleBtn.textContent = this.isHidden ? 'Show' : 'Hide';
      this.toggleBtn.title = this.isHidden ? 'Show terminal' : 'Hide terminal';
    }
  }

  _renderIdleState() {
    if (!this.outputEl || !this.skillLabelEl) return;

    this.skillLabelEl.textContent = this.isActive ? this.skillLabelEl.textContent : 'Idle';
    if (!this.isActive && this.buffer.length === 0) {
      this.outputEl.textContent = '> Terminal docked. Start a hacking activity to stream live code here.\n> Use Hide to collapse the dock until you need it again.';
    }
    this._applyVisibility();
  }

  writeNotification(message, type = 'info') {
    if (!this.outputEl) return false;

    const prefixMap = {
      info: '[INFO]',
      warning: '[WARN]',
      error: '[ALERT]',
      success: '[OK]',
      victory: '[WIN]',
      levelup: '[LVL]'
    };

    const prefix = prefixMap[type] || '[SYS]';
    const existing = this.outputEl.textContent || '';
    const entry = `${prefix} ${message}`;
    const next = `${existing ? `${existing}\n` : ''}${entry}`;
    const lines = next.split('\n').slice(-18);
    this.outputEl.textContent = lines.join('\n');
    this._applyVisibility();
    return true;
  }

  /**
   * Enqueue the next code snippet + status line for the current skill.
   */
  _enqueueNext() {
    const sid = this.currentSkillId;
    if (!sid) return;

    const snippets = CODE_SNIPPETS[sid];
    const statuses = STATUS_LINES[sid];
    if (!snippets || !statuses) return;

    // Add a status line
    const sIdx = this.statusIndex[sid] % statuses.length;
    this.queue += '\n' + statuses[sIdx] + '\n';
    this.statusIndex[sid] = sIdx + 1;

    // Add a code snippet
    const cIdx = this.snippetIndex[sid] % snippets.length;
    this.queue += '\n' + snippets[cIdx] + '\n';
    this.snippetIndex[sid] = cIdx + 1;
  }

  /**
   * Type a small chunk of characters from the queue into the buffer.
   * Called by setInterval at ~60ms.
   */
  _typeChunk() {
    if (!this.isActive || !this.outputEl) return;

    // If queue is running low, enqueue more
    if (this.queue.length < 100) {
      this._enqueueNext();
    }

    // Type a burst of characters
    const charsToType = BASE_CHARS_PER_TICK + Math.floor(Math.random() * 3);
    const chunk = this.queue.slice(0, charsToType);
    this.queue = this.queue.slice(charsToType);

    this.buffer += chunk;

    // Count newlines for trimming
    for (const ch of chunk) {
      if (ch === '\n') this._lineCount++;
    }

    // Trim old lines if buffer is too long
    if (this._lineCount > MAX_BUFFER_LINES) {
      const lines = this.buffer.split('\n');
      const trimmed = lines.slice(lines.length - MAX_BUFFER_LINES);
      this.buffer = trimmed.join('\n');
      this._lineCount = MAX_BUFFER_LINES;
    }

    // Update DOM
    this.outputEl.textContent = this.buffer;

    // Auto-scroll to bottom
    if (this.bodyEl && !this.isMinimized) {
      this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    }
  }

  /**
   * Cleanup on game shutdown/reset.
   */
  destroy() {
    this.stop();
    this.buffer = '';
    this.queue = '';
    this.snippetIndex = {};
    this.statusIndex = {};
    if (this.outputEl) this.outputEl.textContent = '';
    this._renderIdleState();
  }
}
