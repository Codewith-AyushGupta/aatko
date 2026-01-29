'use client';

import { useEffect, useRef, useState } from 'react';

interface ApexElement {
  id: string;
  type: 'class' | 'method' | 'if' | 'for' | 'while' | 'soql' | 'dml' | 'callout' | 'try' | 'return' | 'variable';
  label: string;
  details?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: ApexElement[];
  parent?: string;
}

interface ApexData {
  className: string;
  isTest: boolean;
  sharing: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
  innerClasses: string[];
}

interface MethodInfo {
  name: string;
  returnType: string;
  access: string;
  isStatic: boolean;
  parameters: string[];
  soqlCount: number;
  dmlCount: number;
  calloutCount: number;
  hasForLoop: boolean;
  hasWhileLoop: boolean;
  hasIfStatement: boolean;
  hasTryCatch: boolean;
  lineCount: number;
  complexity: 'low' | 'medium' | 'high';
}

interface PropertyInfo {
  name: string;
  type: string;
  access: string;
}

const COLORS = {
  class: { bg: '#4f46e5', border: '#3730a3', icon: 'C' },
  method: { bg: '#0891b2', border: '#0e7490', icon: 'M' },
  if: { bg: '#f59e0b', border: '#d97706', icon: '?' },
  for: { bg: '#84cc16', border: '#65a30d', icon: '↻' },
  while: { bg: '#84cc16', border: '#65a30d', icon: '↺' },
  soql: { bg: '#3b82f6', border: '#2563eb', icon: 'Q' },
  dml: { bg: '#ef4444', border: '#dc2626', icon: 'D' },
  callout: { bg: '#8b5cf6', border: '#7c3aed', icon: '⚡' },
  try: { bg: '#f97316', border: '#ea580c', icon: '!' },
  return: { bg: '#6b7280', border: '#4b5563', icon: '←' },
  variable: { bg: '#10b981', border: '#059669', icon: 'V' },
};

export default function ApexVisualizer({ apexCode }: { apexCode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [apexData, setApexData] = useState<ApexData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<MethodInfo | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (apexCode) {
      const parsed = parseApexCode(apexCode);
      setApexData(parsed);
    }
  }, [apexCode]);

  useEffect(() => {
    if (apexData && canvasRef.current) {
      drawDiagram();
    }
  }, [apexData, scale, offset, selectedMethod]);

  const parseApexCode = (code: string): ApexData => {
    // Extract class info
    const classMatch = code.match(/(?:public|private|global)\s+(with\s+sharing|without\s+sharing|inherited\s+sharing)?\s*(?:virtual|abstract)?\s*class\s+(\w+)/i);
    const className = classMatch ? classMatch[2] : 'Unknown';
    const sharing = classMatch?.[1] || 'implicit sharing';
    const isTest = /@isTest/i.test(code) || /testMethod/i.test(code);

    // Extract methods
    const methodRegex = /(?:@\w+(?:\([^)]*\))?\s*)*(public|private|protected|global)\s+(static\s+)?([\w<>,\s\[\]]+)\s+(\w+)\s*\(([^)]*)\)\s*\{/gi;
    const methods: MethodInfo[] = [];
    let match;

    while ((match = methodRegex.exec(code)) !== null) {
      const methodName = match[4];
      const methodStart = match.index;
      const methodBody = extractMethodBody(code, methodStart);

      methods.push({
        name: methodName,
        returnType: match[3].trim(),
        access: match[1],
        isStatic: !!match[2],
        parameters: match[5].split(',').map(p => p.trim()).filter(p => p),
        soqlCount: (methodBody.match(/\[\s*SELECT/gi) || []).length,
        dmlCount: (methodBody.match(/\b(insert|update|delete|upsert|undelete|merge)\b/gi) || []).length,
        calloutCount: (methodBody.match(/Http(?:Request|Response|Callout)|\.send\(|REST|SOAP/gi) || []).length,
        hasForLoop: /\bfor\s*\(/i.test(methodBody),
        hasWhileLoop: /\bwhile\s*\(/i.test(methodBody),
        hasIfStatement: /\bif\s*\(/i.test(methodBody),
        hasTryCatch: /\btry\s*\{/i.test(methodBody),
        lineCount: methodBody.split('\n').length,
        complexity: calculateComplexity(methodBody),
      });
    }

    // Extract properties
    const propertyRegex = /(?:public|private|protected|global)\s+(static\s+)?([\w<>,\s\[\]]+)\s+(\w+)\s*(?:=|;|\{)/gi;
    const properties: PropertyInfo[] = [];
    let propMatch: RegExpExecArray | null;

    while ((propMatch = propertyRegex.exec(code)) !== null) {
      // Skip if it's a method (has parentheses after name)
      const match = propMatch; // Copy for closure safety
      const afterMatch = code.substring(match.index + match[0].length);
      if (!afterMatch.trimStart().startsWith('(') && !methods.some(m => m.name === match[3])) {
        properties.push({
          name: match[3],
          type: match[2].trim(),
          access: code.substring(match.index).match(/^(public|private|protected|global)/i)?.[1] || 'private',
        });
      }
    }

    // Extract inner classes
    const innerClassRegex = /(?:public|private)\s+(?:virtual|abstract)?\s*class\s+(\w+)/gi;
    const innerClasses: string[] = [];
    let innerMatch;
    let skipFirst = true;

    while ((innerMatch = innerClassRegex.exec(code)) !== null) {
      if (skipFirst) {
        skipFirst = false;
        continue;
      }
      innerClasses.push(innerMatch[1]);
    }

    return {
      className,
      isTest,
      sharing,
      methods: methods.slice(0, 20), // Limit to 20 methods for display
      properties: properties.slice(0, 10),
      innerClasses,
    };
  };

  const extractMethodBody = (code: string, startIndex: number): string => {
    let braceCount = 0;
    let started = false;
    let endIndex = startIndex;

    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        started = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (started && braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    return code.substring(startIndex, endIndex + 1);
  };

  const calculateComplexity = (methodBody: string): 'low' | 'medium' | 'high' => {
    let score = 0;
    score += (methodBody.match(/\bif\s*\(/gi) || []).length * 2;
    score += (methodBody.match(/\bfor\s*\(/gi) || []).length * 3;
    score += (methodBody.match(/\bwhile\s*\(/gi) || []).length * 3;
    score += (methodBody.match(/\bswitch\s+on\b/gi) || []).length * 2;
    score += (methodBody.match(/\bcatch\s*\(/gi) || []).length;
    score += (methodBody.match(/\[\s*SELECT/gi) || []).length * 2;
    score += (methodBody.match(/\b(insert|update|delete|upsert)\b/gi) || []).length * 2;

    if (score <= 5) return 'low';
    if (score <= 15) return 'medium';
    return 'high';
  };

  const drawDiagram = () => {
    const canvas = canvasRef.current;
    if (!canvas || !apexData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw class header
    const classBoxWidth = 300;
    const classBoxHeight = 60;
    ctx.fillStyle = COLORS.class.bg;
    ctx.strokeStyle = COLORS.class.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 20, classBoxWidth, classBoxHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Class name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(apexData.className, 40, 50);

    // Class badges
    ctx.font = '11px system-ui';
    let badgeX = 40;
    if (apexData.isTest) {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(badgeX, 58, 35, 14);
      ctx.fillStyle = '#92400e';
      ctx.fillText('@Test', badgeX + 3, 69);
      badgeX += 40;
    }
    ctx.fillStyle = '#e0e7ff';
    ctx.fillRect(badgeX, 58, 80, 14);
    ctx.fillStyle = '#3730a3';
    ctx.fillText(apexData.sharing, badgeX + 3, 69);

    // Draw methods section
    let y = 100;
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 13px system-ui';
    ctx.fillText(`Methods (${apexData.methods.length})`, 20, y);
    y += 10;

    // Draw each method as a card
    apexData.methods.forEach((method, index) => {
      const methodX = 20 + (index % 3) * 220;
      const methodY = y + Math.floor(index / 3) * 130;

      drawMethodCard(ctx, method, methodX, methodY, selectedMethod?.name === method.name);
    });

    // Draw properties if space allows
    const propertiesY = y + Math.ceil(apexData.methods.length / 3) * 130 + 30;
    if (apexData.properties.length > 0) {
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 13px system-ui';
      ctx.fillText(`Properties (${apexData.properties.length})`, 20, propertiesY);

      apexData.properties.forEach((prop, index) => {
        const propX = 20 + (index % 4) * 160;
        const propY = propertiesY + 15 + Math.floor(index / 4) * 35;

        ctx.fillStyle = '#f3f4f6';
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(propX, propY, 150, 28, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#6b7280';
        ctx.font = '10px system-ui';
        ctx.fillText(prop.type, propX + 8, propY + 12);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(prop.name, propX + 8, propY + 23);
      });
    }

    ctx.restore();
  };

  const drawMethodCard = (
    ctx: CanvasRenderingContext2D,
    method: MethodInfo,
    x: number,
    y: number,
    isSelected: boolean
  ) => {
    const width = 200;
    const height = 110;

    // Card background
    ctx.fillStyle = isSelected ? '#eff6ff' : '#ffffff';
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#e5e7eb';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.stroke();

    // Method icon
    ctx.fillStyle = COLORS.method.bg;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, 24, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('M', x + 20, y + 25);

    // Method name
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'left';
    const displayName = method.name.length > 20 ? method.name.substring(0, 18) + '...' : method.name;
    ctx.fillText(displayName, x + 38, y + 22);

    // Return type
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px system-ui';
    ctx.fillText(method.returnType, x + 38, y + 34);

    // Access and static badges
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(x + 8, y + 42, 40, 14);
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px system-ui';
    ctx.fillText(method.access, x + 10, y + 52);

    if (method.isStatic) {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(x + 52, y + 42, 30, 14);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillText('static', x + 54, y + 52);
    }

    // Operation indicators
    let indicatorX = x + 8;
    const indicatorY = y + 65;

    if (method.soqlCount > 0) {
      drawIndicator(ctx, indicatorX, indicatorY, 'Q', method.soqlCount, '#3b82f6');
      indicatorX += 35;
    }
    if (method.dmlCount > 0) {
      drawIndicator(ctx, indicatorX, indicatorY, 'D', method.dmlCount, '#ef4444');
      indicatorX += 35;
    }
    if (method.calloutCount > 0) {
      drawIndicator(ctx, indicatorX, indicatorY, '⚡', method.calloutCount, '#8b5cf6');
      indicatorX += 35;
    }

    // Control flow indicators
    indicatorX = x + 8;
    const flowY = y + 88;

    if (method.hasForLoop) {
      drawMiniIcon(ctx, indicatorX, flowY, '↻', '#84cc16');
      indicatorX += 20;
    }
    if (method.hasWhileLoop) {
      drawMiniIcon(ctx, indicatorX, flowY, '↺', '#84cc16');
      indicatorX += 20;
    }
    if (method.hasIfStatement) {
      drawMiniIcon(ctx, indicatorX, flowY, '?', '#f59e0b');
      indicatorX += 20;
    }
    if (method.hasTryCatch) {
      drawMiniIcon(ctx, indicatorX, flowY, '!', '#f97316');
      indicatorX += 20;
    }

    // Complexity indicator
    const complexityColors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#ef4444',
    };
    ctx.fillStyle = complexityColors[method.complexity];
    ctx.beginPath();
    ctx.arc(x + width - 15, y + height - 15, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawIndicator = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    icon: string,
    count: number,
    color: string
  ) => {
    ctx.fillStyle = color + '20';
    ctx.beginPath();
    ctx.roundRect(x, y, 30, 18, 4);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${icon}${count}`, x + 15, y + 13);
  };

  const drawMiniIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    icon: string,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(icon, x + 6, y + 12);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !apexData) return;

    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Check if clicked on a method card
    const startY = 110;
    for (let i = 0; i < apexData.methods.length; i++) {
      const methodX = 20 + (i % 3) * 220;
      const methodY = startY + Math.floor(i / 3) * 130;

      if (x >= methodX && x <= methodX + 200 && y >= methodY && y <= methodY + 110) {
        setSelectedMethod(apexData.methods[i]);
        return;
      }
    }

    setSelectedMethod(null);
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(Math.max(0.5, Math.min(2, scale * delta)));
  };

  if (!apexData) {
    return <div className="p-8 text-center text-gray-500">Analyzing Apex code...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <span className="font-medium">{apexData.className}</span>
          <span className="text-sm text-gray-500">
            {apexData.methods.length} methods | {apexData.properties.length} properties
          </span>
          {apexData.isTest && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Test Class</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(Math.max(0.5, scale * 0.8))}
            className="px-2 py-1 text-sm border rounded hover:bg-white"
          >
            -
          </button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(Math.min(2, scale * 1.2))}
            className="px-2 py-1 text-sm border rounded hover:bg-white"
          >
            +
          </button>
          <button
            onClick={() => { setScale(1); setOffset({ x: 20, y: 20 }); }}
            className="px-2 py-1 text-sm border rounded hover:bg-white"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Canvas and details */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex-1 relative bg-gray-100 cursor-grab active:cursor-grabbing overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          <canvas
            ref={canvasRef}
            width={1400}
            height={1000}
            className="absolute"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Method details panel */}
        {selectedMethod && (
          <div className="w-80 border-l bg-white overflow-y-auto">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">{selectedMethod.name}</h3>
              <p className="text-sm text-gray-500">{selectedMethod.returnType}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Signature</h4>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {selectedMethod.access} {selectedMethod.isStatic ? 'static ' : ''}{selectedMethod.returnType} {selectedMethod.name}(
                  {selectedMethod.parameters.join(', ')})
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Metrics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">Lines:</span> {selectedMethod.lineCount}
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">SOQL:</span> {selectedMethod.soqlCount}
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">DML:</span> {selectedMethod.dmlCount}
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">Callouts:</span> {selectedMethod.calloutCount}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Complexity</h4>
                <span className={`px-2 py-1 text-xs rounded ${
                  selectedMethod.complexity === 'low' ? 'bg-green-100 text-green-700' :
                  selectedMethod.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedMethod.complexity.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Control Flow</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedMethod.hasIfStatement && <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">if/else</span>}
                  {selectedMethod.hasForLoop && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">for loop</span>}
                  {selectedMethod.hasWhileLoop && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">while loop</span>}
                  {selectedMethod.hasTryCatch && <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">try/catch</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-2 border-t bg-gray-50 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center text-white text-[10px]">Q</span>
          <span>SOQL Query</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-500 flex items-center justify-center text-white text-[10px]">D</span>
          <span>DML Operation</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center text-white text-[10px]">⚡</span>
          <span>Callout</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-500">↻</span>
          <span>For Loop</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-amber-500">?</span>
          <span>Conditional</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-orange-500">!</span>
          <span>Try/Catch</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span>Complexity:</span>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>Low
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>Medium
          <span className="w-3 h-3 rounded-full bg-red-500"></span>High
        </div>
      </div>
    </div>
  );
}
