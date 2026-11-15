import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipForward, RotateCcw, Cpu, HardDrive, Zap,
  Activity, ArrowRight, Layers, FileCode, CheckCircle, Sliders, Info
} from 'lucide-react';

// Preset Assembly Programs reflecting the NutriVision AI & COA Pipeline
const PRESET_PROGRAMS = {
  macro_calc: {
    title: "1. Food Macro Calorie Scaling (IFCT/USDA)",
    description: "Calculates total calories: Protein (12g × 4kcal) + Carbs (25g × 4kcal) + Fat (8g × 9kcal).",
    initialRam: [
      { addr: "0x00", hex: "0x1010", label: "LOAD [10]", op: "LOAD", operand: "0x10", comment: "Load Protein grams (12)" },
      { addr: "0x01", hex: "0x3004", label: "MUL #4",     op: "MUL",  operand: "4",    comment: "Multiply by 4 kcal/g (48 kcal)" },
      { addr: "0x02", hex: "0x2014", label: "STORE [14]",op: "STORE",operand: "0x14", comment: "Store Protein cals in [14]" },
      { addr: "0x03", hex: "0x1011", label: "LOAD [11]", op: "LOAD", operand: "0x11", comment: "Load Carbs grams (25)" },
      { addr: "0x04", hex: "0x3004", label: "MUL #4",     op: "MUL",  operand: "4",    comment: "Multiply by 4 kcal/g (100 kcal)" },
      { addr: "0x05", hex: "0x4014", label: "ADD [14]",  op: "ADD",  operand: "0x14", comment: "Add Protein cals (148 kcal)" },
      { addr: "0x06", hex: "0x2014", label: "STORE [14]",op: "STORE",operand: "0x14", comment: "Update running subtotal" },
      { addr: "0x07", hex: "0x1012", label: "LOAD [12]", op: "LOAD", operand: "0x12", comment: "Load Fat grams (8)" },
      { addr: "0x08", hex: "0x3009", label: "MUL #9",     op: "MUL",  operand: "9",    comment: "Multiply by 9 kcal/g (72 kcal)" },
      { addr: "0x09", hex: "0x4014", label: "ADD [14]",  op: "ADD",  operand: "0x14", comment: "Add to subtotal (220 kcal)" },
      { addr: "0x0A", hex: "0x2013", label: "STORE [13]",op: "STORE",operand: "0x13", comment: "Store Final Calories in [13]" },
      { addr: "0x0B", hex: "0xFFFF", label: "HALT",      op: "HALT", operand: "",     comment: "End of execution" },
      { addr: "0x0C", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0D", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0E", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0F", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      // Data segment
      { addr: "0x10", hex: "0x000C", label: "DATA 12",   op: "DATA", operand: "12",   comment: "Protein: 12g" },
      { addr: "0x11", hex: "0x0019", label: "DATA 25",   op: "DATA", operand: "25",   comment: "Carbohydrates: 25g" },
      { addr: "0x12", hex: "0x0008", label: "DATA 8",    op: "DATA", operand: "8",    comment: "Fats: 8g" },
      { addr: "0x13", hex: "0x0000", label: "DATA 0",    op: "DATA", operand: "0",    comment: "Result Total Kcal (0 -> 220)" },
      { addr: "0x14", hex: "0x0000", label: "DATA 0",    op: "DATA", operand: "0",    comment: "Intermediate Subtotal Buffer" },
    ]
  },
  conv_dot_product: {
    title: "2. MobileNetV3 3x3 Conv Dot-Product (MAC)",
    description: "Performs multiply-accumulate (MAC): ACC = Σ (Pixel_i × Kernel_Weight_i).",
    initialRam: [
      { addr: "0x00", hex: "0x1010", label: "LOAD [10]", op: "LOAD", operand: "0x10", comment: "Load Pixel X0 (20)" },
      { addr: "0x01", hex: "0x3012", label: "MUL [12]",  op: "MUL",  operand: "0x12", comment: "Multiply by Weight W0 (3)" },
      { addr: "0x02", hex: "0x2014", label: "STORE [14]",op: "STORE",operand: "0x14", comment: "Store partial dot product (60)" },
      { addr: "0x03", hex: "0x1011", label: "LOAD [11]", op: "LOAD", operand: "0x11", comment: "Load Pixel X1 (15)" },
      { addr: "0x04", hex: "0x3013", label: "MUL [13]",  op: "MUL",  operand: "0x13", comment: "Multiply by Weight W1 (2) -> 30" },
      { addr: "0x05", hex: "0x4014", label: "ADD [14]",  op: "ADD",  operand: "0x14", comment: "Accumulate: 30 + 60 = 90" },
      { addr: "0x06", hex: "0x2015", label: "STORE [15]",op: "STORE",operand: "0x15", comment: "Store Output Feature Map Value" },
      { addr: "0x07", hex: "0xFFFF", label: "HALT",      op: "HALT", operand: "",     comment: "Convolution Complete" },
      { addr: "0x08", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x09", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0A", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0B", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0C", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0D", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0E", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0F", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x10", hex: "0x0014", label: "DATA 20",   op: "DATA", operand: "20",   comment: "Normalized Pixel X0: 20" },
      { addr: "0x11", hex: "0x000F", label: "DATA 15",   op: "DATA", operand: "15",   comment: "Normalized Pixel X1: 15" },
      { addr: "0x12", hex: "0x0003", label: "DATA 3",    op: "DATA", operand: "3",    comment: "Trained Kernel Weight W0: 3" },
      { addr: "0x13", hex: "0x0002", label: "DATA 2",    op: "DATA", operand: "2",    comment: "Trained Kernel Weight W1: 2" },
      { addr: "0x14", hex: "0x0000", label: "DATA 0",    op: "DATA", operand: "0",    comment: "Partial Sum Register" },
      { addr: "0x15", hex: "0x0000", label: "DATA 0",    op: "DATA", operand: "0",    comment: "Output Activation (90)" },
    ]
  },
  lru_tag_check: {
    title: "3. Level 3 Software LRU Cache Tag Matching",
    description: "Compares food hash key with cache slot tag; branches on Zero Flag (Z).",
    initialRam: [
      { addr: "0x00", hex: "0x1010", label: "LOAD [10]", op: "LOAD", operand: "0x10", comment: "Load Query Hash: 0x4B ('biryani')" },
      { addr: "0x01", hex: "0x5011", label: "SUB [11]",  op: "SUB",  operand: "0x11", comment: "Compare with Cache Tag 0x4B" },
      { addr: "0x02", hex: "0x7005", label: "JZ 0x05",   op: "JZ",   operand: "0x05", comment: "If Z=1 (Cache Hit), jump to 0x05" },
      { addr: "0x03", hex: "0x6001", label: "SET_MISS",  op: "LOAD", operand: "0x13", comment: "Cache Miss: fetch secondary disk" },
      { addr: "0x04", hex: "0xFFFF", label: "HALT",      op: "HALT", operand: "",     comment: "Halt Miss Route" },
      { addr: "0x05", hex: "0x1012", label: "LOAD [12]", op: "LOAD", operand: "0x12", comment: "Cache Hit: Load fast pointer" },
      { addr: "0x06", hex: "0x2014", label: "STORE [14]",op: "STORE",operand: "0x14", comment: "Store RAM Resident Record" },
      { addr: "0x07", hex: "0xFFFF", label: "HALT",      op: "HALT", operand: "",     comment: "Halt Hit Route (O(1) in 3µs)" },
      { addr: "0x08", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x09", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0A", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0B", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0C", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0D", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0E", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x0F", hex: "0x0000", label: "NOP",       op: "NOP",  operand: "",     comment: "Reserved" },
      { addr: "0x10", hex: "0x004B", label: "DATA 75",   op: "DATA", operand: "75",   comment: "Query Hash Key (0x4B)" },
      { addr: "0x11", hex: "0x004B", label: "DATA 75",   op: "DATA", operand: "75",   comment: "Cache Slot 0 Tag (0x4B)" },
      { addr: "0x12", hex: "0x03E8", label: "DATA 1000", op: "DATA", operand: "1000", comment: "Pointer to Nutrition Record" },
      { addr: "0x13", hex: "0x0000", label: "DATA 0",    op: "DATA", operand: "0",    comment: "Disk Miss Flag" },
      { addr: "0x14", hex: "0x0000", label: "DATA 0",    op: "DATA", operand: "0",    comment: "Hit Output Destination" },
    ]
  }
};

const MICRO_STEPS = [
  { step: "T0", phase: "FETCH", desc: "MAR ← PC (Address placed on Address Bus)" },
  { step: "T1", phase: "FETCH", desc: "MDR ← M[MAR], PC ← PC + 1 (Instruction read via Data Bus, PC increments)" },
  { step: "T2", phase: "FETCH", desc: "IR ← MDR (Instruction loaded into Instruction Register)" },
  { step: "T3", phase: "DECODE", desc: "CU decodes Opcode & prepares ALU / Control Bus signals" },
  { step: "T4", phase: "EXECUTE", desc: "Execute ALU calculation or Memory Access via System Bus" },
  { step: "T5", phase: "WRITEBACK", desc: "Update Accumulator / Destination Register & Status Flags" }
];

export default function CpuArchitectureSimulator() {
  const [selectedPreset, setSelectedPreset] = useState('macro_calc');
  const [ram, setRam] = useState(PRESET_PROGRAMS.macro_calc.initialRam);
  
  // Registers State
  const [pc, setPc] = useState(0);
  const [mar, setMar] = useState("0x00");
  const [mdr, setMdr] = useState("0x0000");
  const [ir, setIr] = useState("NOP");
  const [acc, setAcc] = useState(0);
  const [r0, setR0] = useState(0);
  const [flags, setFlags] = useState({ Z: 0, N: 0, C: 0, V: 0 });

  // Execution & Step State
  const [microStepIdx, setMicroStepIdx] = useState(0);
  const [clockCycle, setClockCycle] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isHalted, setIsHalted] = useState(false);
  const [clockSpeedMs, setClockSpeedMs] = useState(800); // 800ms per step
  
  // Active Bus Signal Indicators
  const [activeBus, setActiveBus] = useState({
    address: false,
    data: false,
    control: false,
    direction: "idle" // "read", "write", "alu"
  });

  const [executionLog, setExecutionLog] = useState([
    "System Initialized. Von Neumann CPU Datapath Ready."
  ]);

  const timerRef = useRef(null);

  // Load a new preset program
  const loadPreset = (key) => {
    setIsRunning(false);
    setSelectedPreset(key);
    const prog = PRESET_PROGRAMS[key];
    setRam(JSON.parse(JSON.stringify(prog.initialRam)));
    setPc(0);
    setMar("0x00");
    setMdr("0x0000");
    setIr("NOP");
    setAcc(0);
    setR0(0);
    setFlags({ Z: 0, N: 0, C: 0, V: 0 });
    setMicroStepIdx(0);
    setClockCycle(0);
    setIsHalted(false);
    setActiveBus({ address: false, data: false, control: false, direction: "idle" });
    setExecutionLog([`Program Loaded: ${prog.title}`]);
  };

  const parseAddr = (addrStr) => {
    return parseInt(addrStr.replace("0x", ""), 16);
  };

  const formatHex = (num, digits = 4) => {
    return "0x" + (Number(num) >>> 0).toString(16).toUpperCase().padStart(digits, '0');
  };

  // Single Micro-Step Execution (T0 -> T1 -> T2 -> T3 -> T4 -> T5)
  const stepForward = () => {
    if (isHalted) return;

    const currentMicro = MICRO_STEPS[microStepIdx];
    const ramIndex = pc;
    const currentRamCell = ram[ramIndex] || { op: "HALT", operand: "", hex: "0xFFFF" };

    switch (microStepIdx) {
      case 0: // T0: MAR <- PC
        setMar(formatHex(pc, 2));
        setActiveBus({ address: true, data: false, control: true, direction: "read" });
        setExecutionLog(prev => [`[Cycle ${clockCycle+1}] T0: MAR ← PC (${formatHex(pc, 2)} placed on Address Bus)`, ...prev.slice(0, 24)]);
        setMicroStepIdx(1);
        break;

      case 1: // T1: MDR <- M[MAR], PC <- PC + 1
        setMdr(currentRamCell.hex);
        setPc(prev => prev + 1);
        setActiveBus({ address: false, data: true, control: true, direction: "read" });
        setExecutionLog(prev => [`[Cycle ${clockCycle+1}] T1: MDR ← M[${formatHex(pc, 2)}] (${currentRamCell.hex}), PC incremented to ${pc + 1}`, ...prev.slice(0, 24)]);
        setMicroStepIdx(2);
        break;

      case 2: // T2: IR <- MDR
        setIr(currentRamCell.label || currentRamCell.op);
        setActiveBus({ address: false, data: false, control: false, direction: "idle" });
        setExecutionLog(prev => [`[Cycle ${clockCycle+1}] T2: IR ← ${currentRamCell.label}`, ...prev.slice(0, 24)]);
        setMicroStepIdx(3);
        break;

      case 3: // T3: DECODE
        setActiveBus({ address: false, data: false, control: true, direction: "control" });
        setExecutionLog(prev => [`[Cycle ${clockCycle+1}] T3: Control Unit decoded Opcode [${currentRamCell.op}]. Preparing ALU & Datapath lines.`, ...prev.slice(0, 24)]);
        setMicroStepIdx(4);
        break;

      case 4: // T4: EXECUTE
        setActiveBus({ address: true, data: true, control: true, direction: "alu" });
        let nextAcc = acc;
        let nextR0 = r0;
        let nextPc = pc; // Note: PC was already incremented at T1
        let updatedRam = [...ram];
        let actionDesc = "";

        if (currentRamCell.op === "HALT") {
          setIsHalted(true);
          setIsRunning(false);
          actionDesc = "HALT instruction encountered. CPU entered idle state.";
        } else if (currentRamCell.op === "LOAD") {
          const targetAddr = currentRamCell.operand.startsWith("0x") ? parseAddr(currentRamCell.operand) : parseInt(currentRamCell.operand);
          const cell = ram[targetAddr];
          const val = cell ? (parseInt(cell.operand) || parseInt(cell.hex, 16) || 0) : 0;
          nextAcc = val;
          actionDesc = `LOAD: Read value ${val} from memory [${currentRamCell.operand}] into ACC`;
        } else if (currentRamCell.op === "STORE") {
          const targetAddr = currentRamCell.operand.startsWith("0x") ? parseAddr(currentRamCell.operand) : parseInt(currentRamCell.operand);
          if (targetAddr < updatedRam.length) {
            updatedRam[targetAddr] = {
              ...updatedRam[targetAddr],
              operand: String(acc),
              hex: formatHex(acc, 4),
              label: `DATA ${acc}`
            };
            setRam(updatedRam);
          }
          actionDesc = `STORE: Wrote ACC value (${acc}) to Memory [${currentRamCell.operand}] via Data Bus`;
        } else if (currentRamCell.op === "ADD") {
          const targetAddr = currentRamCell.operand.startsWith("0x") ? parseAddr(currentRamCell.operand) : parseInt(currentRamCell.operand);
          const cell = ram[targetAddr];
          const val = cell ? (parseInt(cell.operand) || parseInt(cell.hex, 16) || 0) : 0;
          nextAcc = acc + val;
          actionDesc = `ADD: ALU computed ${acc} + ${val} = ${nextAcc}`;
        } else if (currentRamCell.op === "SUB") {
          const targetAddr = currentRamCell.operand.startsWith("0x") ? parseAddr(currentRamCell.operand) : parseInt(currentRamCell.operand);
          const cell = ram[targetAddr];
          const val = cell ? (parseInt(cell.operand) || parseInt(cell.hex, 16) || 0) : 0;
          nextAcc = acc - val;
          actionDesc = `SUB: ALU computed ${acc} - ${val} = ${nextAcc}`;
        } else if (currentRamCell.op === "MUL") {
          const multiplier = currentRamCell.operand.startsWith("0x")
            ? (parseInt(ram[parseAddr(currentRamCell.operand)]?.operand) || 0)
            : parseInt(currentRamCell.operand.replace("#", ""));
          nextAcc = acc * multiplier;
          actionDesc = `MUL: ALU multiplier unit computed ${acc} × ${multiplier} = ${nextAcc}`;
        } else if (currentRamCell.op === "JZ") {
          const jumpAddr = parseAddr(currentRamCell.operand);
          if (flags.Z === 1) {
            nextPc = jumpAddr;
            actionDesc = `JZ: Zero flag is SET (Z=1). Branch taken! PC updated to ${jumpAddr}`;
          } else {
            actionDesc = `JZ: Zero flag is CLEAR (Z=0). Branch NOT taken. Continuing sequence.`;
          }
        }

        // Update Flags
        const newFlags = {
          Z: nextAcc === 0 ? 1 : 0,
          N: nextAcc < 0 ? 1 : 0,
          C: nextAcc > 65535 ? 1 : 0,
          V: nextAcc > 32767 || nextAcc < -32768 ? 1 : 0
        };

        setAcc(nextAcc);
        setFlags(newFlags);
        setPc(nextPc);
        setExecutionLog(prev => [`[Cycle ${clockCycle+1}] T4: ${actionDesc}`, ...prev.slice(0, 24)]);
        setMicroStepIdx(5);
        break;

      case 5: // T5: WRITEBACK / END OF CYCLE
        setActiveBus({ address: false, data: false, control: false, direction: "idle" });
        setClockCycle(prev => prev + 1);
        setMicroStepIdx(0);
        setExecutionLog(prev => [`Cycle ${clockCycle+1} Complete. Flags: Z=${flags.Z} N=${flags.N} C=${flags.C} V=${flags.V}`, ...prev.slice(0, 24)]);
        break;

      default:
        setMicroStepIdx(0);
    }
  };

  // Continuous execution timer
  useEffect(() => {
    if (isRunning && !isHalted) {
      timerRef.current = setTimeout(() => {
        stepForward();
      }, clockSpeedMs);
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, isHalted, microStepIdx, pc, acc, flags, clockSpeedMs]);

  const handleReset = () => {
    loadPreset(selectedPreset);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Classic Instrument Header */}
      <div style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
            }}>
              <Cpu style={{ width: '20px', height: '20px', color: '#ffffff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                CPU Architecture Internal Workflow Simulator
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                Interactive Von Neumann Datapath: Fetch-Decode-Execute Micro-Stepping, System Buses, and Register Transfers
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Architecture Workload:</span>
          <select
            value={selectedPreset}
            onChange={(e) => loadPreset(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="macro_calc">1. Food Macro Calorie Scaling (IFCT/USDA)</option>
            <option value="conv_dot_product">2. MobileNetV3 Conv Dot-Product (MAC)</option>
            <option value="lru_tag_check">3. Level 3 Software LRU Tag Match</option>
          </select>
        </div>
      </div>

      {/* Control Toolbar */}
      <div style={{
        background: '#0b1329',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            disabled={isHalted}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isRunning ? '#ef4444' : '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: isHalted ? 'not-allowed' : 'pointer',
              boxShadow: isRunning ? '0 0 10px rgba(239, 68, 68, 0.4)' : '0 0 10px rgba(16, 185, 129, 0.4)'
            }}
          >
            {isRunning ? <><Pause style={{ width: '15px', height: '15px' }} /> Pause</> : <><Play style={{ width: '15px', height: '15px' }} /> Run Clock</>}
          </button>

          <button
            onClick={stepForward}
            disabled={isRunning || isHalted}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: (isRunning || isHalted) ? 'not-allowed' : 'pointer',
              opacity: (isRunning || isHalted) ? 0.6 : 1
            }}
          >
            <SkipForward style={{ width: '15px', height: '15px' }} /> Step Micro-Op
          </button>

          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw style={{ width: '15px', height: '15px' }} /> Reset CPU
          </button>
        </div>

        {/* Status Indicators & Clock Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <span style={{ color: '#94a3b8' }}>Clock Speed:</span>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={clockSpeedMs}
              onChange={(e) => setClockSpeedMs(Number(e.target.value))}
              style={{ width: '90px', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 }}>
              {(1000 / clockSpeedMs).toFixed(1)} Hz
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Phase:</span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              backgroundColor: MICRO_STEPS[microStepIdx].phase === 'FETCH' ? 'rgba(59, 130, 246, 0.2)' :
                               MICRO_STEPS[microStepIdx].phase === 'DECODE' ? 'rgba(234, 179, 8, 0.2)' :
                               'rgba(16, 185, 129, 0.2)',
              color: MICRO_STEPS[microStepIdx].phase === 'FETCH' ? '#60a5fa' :
                     MICRO_STEPS[microStepIdx].phase === 'DECODE' ? '#facc15' :
                     '#34d399',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              {MICRO_STEPS[microStepIdx].step}: {MICRO_STEPS[microStepIdx].phase}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
            <span style={{ color: '#94a3b8' }}>Clock Cycles:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem' }}>{clockCycle}</span>
          </div>
        </div>
      </div>

      {/* Main Datapath Architecture Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
        
        {/* Left Column: Registers & Control Unit (4 cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Registers Box */}
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Internal CPU Registers
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Hardware Latency: ~0.5 ns</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* PC */}
              <div style={{ background: '#131e38', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>PC (Program Counter)</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, color: '#60a5fa' }}>
                  {formatHex(pc, 2)} <span style={{ fontSize: '0.72rem', color: '#64748b' }}>({pc})</span>
                </div>
              </div>

              {/* MAR */}
              <div style={{
                background: '#131e38',
                border: activeBus.address ? '1px solid #60a5fa' : '1px solid #1e293b',
                borderRadius: '6px',
                padding: '8px 10px',
                boxShadow: activeBus.address ? '0 0 10px rgba(96, 165, 250, 0.3)' : 'none'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>MAR (Memory Address)</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
                  {mar}
                </div>
              </div>

              {/* MDR */}
              <div style={{
                background: '#131e38',
                border: activeBus.data ? '1px solid #34d399' : '1px solid #1e293b',
                borderRadius: '6px',
                padding: '8px 10px',
                boxShadow: activeBus.data ? '0 0 10px rgba(52, 211, 153, 0.3)' : 'none'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>MDR (Memory Data)</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                  {mdr}
                </div>
              </div>

              {/* IR */}
              <div style={{ background: '#131e38', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>IR (Instruction Register)</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: '#facc15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ir}
                </div>
              </div>

              {/* Accumulator */}
              <div style={{
                gridColumn: 'span 2',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)',
                border: '1px solid #6366f1',
                borderRadius: '6px',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#c7d2fe', fontWeight: 700 }}>ACC (Accumulator)</span>
                  <span style={{ fontSize: '0.68rem', color: '#818cf8', fontFamily: 'monospace' }}>Primary ALU Register</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                    {acc}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#a5b4fc' }}>
                    ({formatHex(acc, 4)})
                  </span>
                </div>
              </div>
            </div>

            {/* Status Flags */}
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>ALU STATUS FLAGS (PSR)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                {Object.entries(flags).map(([k, v]) => (
                  <div key={k} style={{
                    background: v === 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    border: v === 1 ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    padding: '4px'
                  }}>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>{k}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: v === 1 ? '#34d399' : '#64748b' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Control Unit Box */}
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sliders style={{ width: '16px', height: '16px', color: '#facc15' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fde047', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Control Unit (CU) & Micro-Op Engine
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '10px' }}>
              Coordinates timing signals, instruction decoding, and datapath latch gating:
            </p>
            <div style={{
              background: '#0a0f1d',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '0.75rem',
              color: '#cbd5e1'
            }}>
              <span style={{ color: '#facc15', fontWeight: 700 }}>Current Micro-Op: </span>
              {MICRO_STEPS[microStepIdx].desc}
            </div>
          </div>

        </div>

        {/* Center Column: ALU & System Buses (4 cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* ALU (Arithmetic Logic Unit) Graphic Representation */}
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Arithmetic Logic Unit (ALU)
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Vector Math & MAC Engine</span>
            </div>

            {/* Classical Trapezoidal ALU Diagram */}
            <div style={{
              width: '100%',
              height: '140px',
              backgroundColor: '#111c35',
              clipPath: 'polygon(0% 0%, 40% 0%, 50% 30%, 60% 0%, 100% 0%, 80% 100%, 20% 100%)',
              borderTop: '2px solid #34d399',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Active Function</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>
                {ram[pc]?.op || "IDLE"}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#34d399', marginTop: '2px' }}>
                ACC IN: {acc} | BUS IN: {parseInt(mdr, 16) || 0}
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
              Executes fixed-point and floating-point multiplications, additions, and zero-flag comparisons.
            </div>
          </div>

          {/* Tri-State System Buses (Visual Highway) */}
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Buses (Communication Highways)
            </span>

            {/* Address Bus */}
            <div style={{
              background: activeBus.address ? 'rgba(59, 130, 246, 0.25)' : '#0f172a',
              border: activeBus.address ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '10px 12px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>Address Bus (16-bit Unidirectional)</span>
                <span style={{ fontSize: '0.68rem', color: activeBus.address ? '#93c5fd' : '#475569', fontWeight: 600 }}>
                  {activeBus.address ? `ACTIVE: ${mar}` : 'IDLE'}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Carries physical memory address from MAR directly to RAM decode lines.
              </div>
            </div>

            {/* Data Bus */}
            <div style={{
              background: activeBus.data ? 'rgba(16, 185, 129, 0.25)' : '#0f172a',
              border: activeBus.data ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '10px 12px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>Data Bus (16-bit Bidirectional)</span>
                <span style={{ fontSize: '0.68rem', color: activeBus.data ? '#6ee7b7' : '#475569', fontWeight: 600 }}>
                  {activeBus.data ? `ACTIVE: ${mdr}` : 'IDLE'}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Transfers instructions and operands between MDR, ALU, and Memory cells.
              </div>
            </div>

            {/* Control Bus */}
            <div style={{
              background: activeBus.control ? 'rgba(234, 179, 8, 0.25)' : '#0f172a',
              border: activeBus.control ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '10px 12px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#facc15' }}>Control Bus (Command & Timing Lines)</span>
                <span style={{ fontSize: '0.68rem', color: activeBus.control ? '#fef08a' : '#475569', fontWeight: 600 }}>
                  {activeBus.control ? `SIGNAL: ${activeBus.direction.toUpperCase()}` : 'IDLE'}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Carries MEM_READ, MEM_WRITE, CLK, and INTERRUPT signals from Control Unit.
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: RAM Memory Grid (4 cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '480px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Primary Storage (RAM)
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>DRAM Latency: ~50-100 ns</span>
            </div>
            
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px' }}>
              Memory Address Space with instruction opcodes & operand data:
            </p>

            {/* RAM Table */}
            <div style={{
              overflowY: 'auto',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#090e1a'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#111a2e', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                    <th style={{ padding: '6px 8px' }}>Addr</th>
                    <th style={{ padding: '6px 8px' }}>Hex</th>
                    <th style={{ padding: '6px 8px' }}>Instruction / Data</th>
                  </tr>
                </thead>
                <tbody>
                  {ram.map((cell, idx) => {
                    const isPcHere = pc === idx;
                    const isMarHere = parseAddr(mar) === idx;
                    return (
                      <tr
                        key={cell.addr}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          backgroundColor: isPcHere
                            ? 'rgba(59, 130, 246, 0.2)'
                            : isMarHere
                            ? 'rgba(234, 179, 8, 0.15)'
                            : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: isPcHere ? '#60a5fa' : '#64748b', fontWeight: isPcHere ? 800 : 500 }}>
                          {cell.addr} {isPcHere ? '◄ PC' : ''}
                        </td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: '#38bdf8' }}>
                          {cell.hex}
                        </td>
                        <td style={{ padding: '5px 8px', color: cell.op === 'DATA' ? '#34d399' : '#f8fafc', fontWeight: 600 }}>
                          {cell.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Blue Highlight: Current PC</span>
              <span>Gold Highlight: Active MAR</span>
            </div>
          </div>

        </div>

      </div>

      {/* Execution Log & Register Transfer Language (RTL) Trace */}
      <div style={{
        background: '#090e1a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ width: '15px', height: '15px', color: '#60a5fa' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Micro-Operation Execution Trace (Register Transfer Language - RTL)
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Live Event Stream</span>
        </div>

        <div style={{
          maxHeight: '120px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.76rem',
          backgroundColor: '#040711',
          padding: '10px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {executionLog.map((log, i) => (
            <div key={i} style={{ color: i === 0 ? '#38bdf8' : '#64748b' }}>
              {i === 0 ? '▶ ' : '  '}{log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
