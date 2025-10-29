"use client"

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FlowchartNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  completed: boolean;
}

interface FlowchartEdge {
  from: string;
  to: string;
  animated: boolean;
}

export default function FlowchartBackground() {
  const [nodes, setNodes] = useState<FlowchartNode[]>([]);
  const [edges, setEdges] = useState<FlowchartEdge[]>([]);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Create a realistic flowchart layout with boxes
    const newNodes: FlowchartNode[] = [
      // Row 1
      { id: "start", x: 400, y: 100, width: 120, height: 50, label: "Start Service", color: "#3b82f6", completed: false },

      // Row 2
      { id: "inspect", x: 200, y: 200, width: 140, height: 50, label: "Initial Inspection", color: "#10b981", completed: false },
      { id: "safety", x: 400, y: 200, width: 120, height: 50, label: "Safety Check", color: "#f59e0b", completed: false },
      { id: "tools", x: 600, y: 200, width: 130, height: 50, label: "Tool Preparation", color: "#8b5cf6", completed: false },

      // Row 3
      { id: "mech1", x: 150, y: 320, width: 110, height: 50, label: "Mechanical", color: "#10b981", completed: false },
      { id: "elec1", x: 300, y: 320, width: 100, height: 50, label: "Electrical", color: "#3b82f6", completed: false },
      { id: "hyd1", x: 450, y: 320, width: 100, height: 50, label: "Hydraulic", color: "#f59e0b", completed: false },
      { id: "ctrl1", x: 600, y: 320, width: 100, height: 50, label: "Control", color: "#8b5cf6", completed: false },
      { id: "test1", x: 750, y: 320, width: 100, height: 50, label: "Testing", color: "#ef4444", completed: false },

      // Row 4
      { id: "cal1", x: 250, y: 420, width: 120, height: 50, label: "Calibration", color: "#10b981", completed: false },
      { id: "doc1", x: 430, y: 420, width: 140, height: 50, label: "Documentation", color: "#3b82f6", completed: false },
      { id: "verify", x: 620, y: 420, width: 110, height: 50, label: "Verification", color: "#f59e0b", completed: false },

      // Row 5
      { id: "review", x: 350, y: 520, width: 120, height: 50, label: "QA Review", color: "#8b5cf6", completed: false },
      { id: "approve", x: 530, y: 520, width: 120, height: 50, label: "Approval", color: "#10b981", completed: false },

      // Row 6
      { id: "complete", x: 440, y: 620, width: 120, height: 50, label: "Complete", color: "#10b981", completed: false },
    ];

    // Create edges between nodes
    const newEdges: FlowchartEdge[] = [
      // From start
      { from: "start", to: "inspect", animated: false },
      { from: "start", to: "safety", animated: false },
      { from: "start", to: "tools", animated: false },

      // To work items
      { from: "inspect", to: "mech1", animated: false },
      { from: "inspect", to: "elec1", animated: false },
      { from: "safety", to: "elec1", animated: false },
      { from: "safety", to: "hyd1", animated: false },
      { from: "safety", to: "ctrl1", animated: false },
      { from: "tools", to: "ctrl1", animated: false },
      { from: "tools", to: "test1", animated: false },

      // From work items to documentation
      { from: "mech1", to: "cal1", animated: false },
      { from: "elec1", to: "cal1", animated: false },
      { from: "hyd1", to: "doc1", animated: false },
      { from: "ctrl1", to: "doc1", animated: false },
      { from: "test1", to: "verify", animated: false },

      // To review
      { from: "cal1", to: "review", animated: false },
      { from: "doc1", to: "review", animated: false },
      { from: "verify", to: "approve", animated: false },

      // To complete
      { from: "review", to: "approve", animated: false },
      { from: "approve", to: "complete", animated: false },
    ];

    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  // Slow, subtle animation
  useEffect(() => {
    if (nodes.length === 0) return;

    let resetTimeout: NodeJS.Timeout;
    
    const animationTimer = setInterval(() => {
      setAnimationPhase((prev) => {
        if (prev >= nodes.length) {
          // Reset after a pause
          resetTimeout = setTimeout(() => {
            setAnimationPhase(0);
          }, 8000);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    return () => {
      clearInterval(animationTimer);
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
    };
  }, [nodes.length]);

  // Update completion status
  useEffect(() => {
    if (nodes.length === 0 || animationPhase === 0) return;

    setNodes((prevNodes) =>
      prevNodes.map((node, index) => ({
        ...node,
        completed: index < animationPhase,
      }))
    );
  }, [animationPhase, nodes.length]);

  // Update edges separately to avoid dependency issues
  useEffect(() => {
    if (nodes.length === 0) return;

    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        return {
          ...edge,
          animated: (fromNode?.completed && toNode?.completed) || false,
        };
      })
    );
  }, [nodes]);

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    };
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-gray-900/95 z-[1]" />

      {/* SVG Canvas for Flowchart */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.15]"
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient for edges */}
          <linearGradient id="edge-gradient-bg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>

          {/* Filter for blur effect */}
          <filter id="blur-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
          </filter>
        </defs>

        {/* Render Edges */}
        {edges.map((edge, index) => {
          const from = getNodeCenter(edge.from);
          const to = getNodeCenter(edge.to);

          return (
            <line
              key={index}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.animated ? "url(#edge-gradient-bg)" : "#334155"}
              strokeWidth="2"
              opacity={edge.animated ? 0.6 : 0.3}
              strokeDasharray={edge.animated ? "none" : "5,5"}
              className="transition-all duration-1000"
            />
          );
        })}

        {/* Render Nodes as boxes */}
        {nodes.map((node) => (
          <g key={node.id} filter="url(#blur-filter)">
            {/* Box background */}
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="8"
              fill={node.completed ? node.color : "#1e293b"}
              fillOpacity={node.completed ? 0.4 : 0.3}
              stroke={node.completed ? node.color : "#334155"}
              strokeWidth="2"
              strokeOpacity={0.5}
              className="transition-all duration-1000"
            />

            {/* Box label */}
            <text
              x={node.x + node.width / 2}
              y={node.y + node.height / 2 + 4}
              textAnchor="middle"
              className="fill-white/60 text-xs font-medium"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {node.label}
            </text>

          </g>
        ))}
      </svg>

      {/* Grid overlay - very subtle */}
      <div
        className="absolute inset-0 opacity-[0.02] z-[0]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
}