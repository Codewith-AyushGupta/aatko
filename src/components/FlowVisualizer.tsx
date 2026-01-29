'use client';

import { useEffect, useRef, useState } from 'react';

interface FlowVariable {
  name: string;
  dataType: string;
  isInput: boolean;
  isOutput: boolean;
  isCollection: boolean;
  defaultValue?: string;
}

interface FlowFormula {
  name: string;
  dataType: string;
  expression: string;
}

interface AssignmentItem {
  field: string;
  operator: string;
  value: string;
}

interface FilterItem {
  field: string;
  operator: string;
  value: string;
}

interface FlowElement {
  name: string;
  label: string;
  type: string;
  x: number;
  y: number;
  connectors: { target: string; label?: string; isDefault?: boolean }[];
  details: {
    object?: string;
    filters?: FilterItem[];
    assignments?: AssignmentItem[];
    inputAssignments?: AssignmentItem[];
    outputAssignments?: AssignmentItem[];
    conditions?: { field: string; operator: string; value: string }[];
    description?: string;
    actionName?: string;
    actionType?: string;
    screenFields?: string[];
    subflowName?: string;
    collectionReference?: string;
  };
}

interface FlowData {
  label: string;
  processType: string;
  status: string;
  apiVersion: string;
  triggerObject?: string;
  triggerType?: string;
  recordTriggerType?: string;
  elements: FlowElement[];
  variables: FlowVariable[];
  formulas: FlowFormula[];
  constants: { name: string; value: string; dataType: string }[];
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  start: { bg: '#22c55e', border: '#16a34a', icon: '▶' },
  decisions: { bg: '#f59e0b', border: '#d97706', icon: '◆' },
  assignments: { bg: '#8b5cf6', border: '#7c3aed', icon: '=' },
  recordLookups: { bg: '#3b82f6', border: '#2563eb', icon: '🔍' },
  recordCreates: { bg: '#10b981', border: '#059669', icon: '+' },
  recordUpdates: { bg: '#f97316', border: '#ea580c', icon: '✎' },
  recordDeletes: { bg: '#ef4444', border: '#dc2626', icon: '✕' },
  screens: { bg: '#06b6d4', border: '#0891b2', icon: '📺' },
  subflows: { bg: '#ec4899', border: '#db2777', icon: '↪' },
  loops: { bg: '#84cc16', border: '#65a30d', icon: '🔄' },
  actionCalls: { bg: '#6366f1', border: '#4f46e5', icon: '⚡' },
  collectionProcessors: { bg: '#14b8a6', border: '#0d9488', icon: '📦' },
  waits: { bg: '#78716c', border: '#57534e', icon: '⏳' },
  end: { bg: '#6b7280', border: '#4b5563', icon: '⏹' },
  default: { bg: '#9ca3af', border: '#6b7280', icon: '?' },
};

const ELEMENT_WIDTH = 200;
const ELEMENT_HEIGHT = 70;
const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 250;

export default function FlowVisualizer({ flowXml }: { flowXml: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 50, y: 30 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<FlowElement | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'fields' | 'variables'>('info');

  useEffect(() => {
    if (flowXml) {
      const parsed = parseFlowXml(flowXml);
      setFlowData(parsed);
    }
  }, [flowXml]);

  useEffect(() => {
    if (flowData && canvasRef.current) {
      drawFlow();
    }
  }, [flowData, scale, offset, selectedElement]);

  const parseFlowXml = (xml: string): FlowData => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const elements: FlowElement[] = [];
    const elementMap = new Map<string, FlowElement>();

    // Get flow metadata
    const label = doc.querySelector('label')?.textContent || 'Unnamed Flow';
    const processType = doc.querySelector('processType')?.textContent || 'Unknown';
    const status = doc.querySelector('status')?.textContent || 'Unknown';
    const apiVersion = doc.querySelector('apiVersion')?.textContent || '';

    // Parse variables
    const variables: FlowVariable[] = [];
    doc.querySelectorAll('variables').forEach((v) => {
      variables.push({
        name: v.querySelector('name')?.textContent || '',
        dataType: v.querySelector('dataType')?.textContent || 'String',
        isInput: v.querySelector('isInput')?.textContent === 'true',
        isOutput: v.querySelector('isOutput')?.textContent === 'true',
        isCollection: v.querySelector('isCollection')?.textContent === 'true',
        defaultValue: v.querySelector('value')?.textContent || undefined,
      });
    });

    // Parse formulas
    const formulas: FlowFormula[] = [];
    doc.querySelectorAll('formulas').forEach((f) => {
      formulas.push({
        name: f.querySelector('name')?.textContent || '',
        dataType: f.querySelector('dataType')?.textContent || 'String',
        expression: f.querySelector('expression')?.textContent || '',
      });
    });

    // Parse constants
    const constants: { name: string; value: string; dataType: string }[] = [];
    doc.querySelectorAll('constants').forEach((c) => {
      constants.push({
        name: c.querySelector('name')?.textContent || '',
        value: c.querySelector('value > stringValue')?.textContent ||
               c.querySelector('value > numberValue')?.textContent ||
               c.querySelector('value > booleanValue')?.textContent || '',
        dataType: c.querySelector('dataType')?.textContent || 'String',
      });
    });

    // Parse start element
    const startEl = doc.querySelector('start');
    let triggerObject = '';
    let triggerType = '';
    let recordTriggerType = '';

    if (startEl) {
      const x = parseInt(startEl.querySelector('locationX')?.textContent || '50');
      const y = parseInt(startEl.querySelector('locationY')?.textContent || '50');
      const connector = startEl.querySelector('connector > targetReference')?.textContent;
      triggerType = startEl.querySelector('triggerType')?.textContent || '';
      recordTriggerType = startEl.querySelector('recordTriggerType')?.textContent || '';
      triggerObject = startEl.querySelector('object')?.textContent || '';

      // Parse filters from start
      const filters: FilterItem[] = [];
      startEl.querySelectorAll('filters').forEach((f) => {
        filters.push({
          field: f.querySelector('field')?.textContent || '',
          operator: f.querySelector('operator')?.textContent || '',
          value: f.querySelector('value > stringValue')?.textContent ||
                 f.querySelector('value > booleanValue')?.textContent ||
                 f.querySelector('value > elementReference')?.textContent || '',
        });
      });

      const startElement: FlowElement = {
        name: '__start__',
        label: triggerType === 'RecordAfterSave' || triggerType === 'RecordBeforeSave'
          ? `${recordTriggerType || 'Trigger'} on ${triggerObject || 'Record'}`
          : 'Start',
        type: 'start',
        x,
        y,
        connectors: connector ? [{ target: connector }] : [],
        details: { object: triggerObject, filters },
      };
      elements.push(startElement);
      elementMap.set('__start__', startElement);
    }

    // Element types to parse
    const elementTypes = [
      'decisions', 'assignments', 'recordLookups', 'recordCreates',
      'recordUpdates', 'recordDeletes', 'screens', 'subflows',
      'loops', 'actionCalls', 'collectionProcessors', 'waits'
    ];

    for (const type of elementTypes) {
      const els = doc.querySelectorAll(type);
      els.forEach((el) => {
        const name = el.querySelector('name')?.textContent || '';
        const elLabel = el.querySelector('label')?.textContent || name;
        const x = parseInt(el.querySelector('locationX')?.textContent || '0');
        const y = parseInt(el.querySelector('locationY')?.textContent || '0');
        const description = el.querySelector('description')?.textContent || '';

        const connectors: FlowElement['connectors'] = [];

        // Default connector
        const defaultConnector = el.querySelector('defaultConnector > targetReference')?.textContent;
        const defaultLabel = el.querySelector('defaultConnectorLabel')?.textContent;
        if (defaultConnector) {
          connectors.push({ target: defaultConnector, label: defaultLabel, isDefault: true });
        }

        // Regular connector
        const connector = el.querySelector(':scope > connector > targetReference')?.textContent;
        if (connector) {
          connectors.push({ target: connector });
        }

        // Rule connectors (for decisions)
        if (type === 'decisions') {
          const rules = el.querySelectorAll('rules');
          rules.forEach((rule) => {
            const ruleConnector = rule.querySelector('connector > targetReference')?.textContent;
            const ruleLabel = rule.querySelector('label')?.textContent;
            if (ruleConnector) {
              connectors.push({ target: ruleConnector, label: ruleLabel });
            }
          });
        }

        // Fault connector
        const faultConnector = el.querySelector('faultConnector > targetReference')?.textContent;
        if (faultConnector) {
          connectors.push({ target: faultConnector, label: 'Fault' });
        }

        // Next value connector (for loops)
        const nextValueConnector = el.querySelector('nextValueConnector > targetReference')?.textContent;
        if (nextValueConnector) {
          connectors.push({ target: nextValueConnector, label: 'Next' });
        }

        // No more values connector (for loops)
        const noMoreValuesConnector = el.querySelector('noMoreValuesConnector > targetReference')?.textContent;
        if (noMoreValuesConnector) {
          connectors.push({ target: noMoreValuesConnector, label: 'End Loop' });
        }

        // Collect element details
        const details: FlowElement['details'] = { description };

        // Object for record operations
        details.object = el.querySelector('object')?.textContent || undefined;

        // Filters
        const filters: FilterItem[] = [];
        el.querySelectorAll('filters').forEach((f) => {
          filters.push({
            field: f.querySelector('field')?.textContent || '',
            operator: f.querySelector('operator')?.textContent || '',
            value: f.querySelector('value > stringValue')?.textContent ||
                   f.querySelector('value > booleanValue')?.textContent ||
                   f.querySelector('value > elementReference')?.textContent || '',
          });
        });
        if (filters.length > 0) details.filters = filters;

        // Assignments
        if (type === 'assignments') {
          const assignments: AssignmentItem[] = [];
          el.querySelectorAll('assignmentItems').forEach((a) => {
            assignments.push({
              field: a.querySelector('assignToReference')?.textContent || '',
              operator: a.querySelector('operator')?.textContent || 'Assign',
              value: a.querySelector('value > stringValue')?.textContent ||
                     a.querySelector('value > numberValue')?.textContent ||
                     a.querySelector('value > booleanValue')?.textContent ||
                     a.querySelector('value > elementReference')?.textContent || '',
            });
          });
          if (assignments.length > 0) details.assignments = assignments;
        }

        // Input assignments (for record creates/updates)
        const inputAssignments: AssignmentItem[] = [];
        el.querySelectorAll('inputAssignments').forEach((a) => {
          inputAssignments.push({
            field: a.querySelector('field')?.textContent || '',
            operator: 'Assign',
            value: a.querySelector('value > stringValue')?.textContent ||
                   a.querySelector('value > numberValue')?.textContent ||
                   a.querySelector('value > booleanValue')?.textContent ||
                   a.querySelector('value > elementReference')?.textContent || '',
          });
        });
        if (inputAssignments.length > 0) details.inputAssignments = inputAssignments;

        // Output assignments (for record lookups)
        const outputAssignments: AssignmentItem[] = [];
        el.querySelectorAll('outputAssignments').forEach((a) => {
          outputAssignments.push({
            field: a.querySelector('field')?.textContent || '',
            operator: 'AssignTo',
            value: a.querySelector('assignToReference')?.textContent || '',
          });
        });
        if (outputAssignments.length > 0) details.outputAssignments = outputAssignments;

        // Decision conditions
        if (type === 'decisions') {
          const conditions: { field: string; operator: string; value: string }[] = [];
          el.querySelectorAll('rules > conditions').forEach((c) => {
            conditions.push({
              field: c.querySelector('leftValueReference')?.textContent || '',
              operator: c.querySelector('operator')?.textContent || '',
              value: c.querySelector('rightValue > stringValue')?.textContent ||
                     c.querySelector('rightValue > booleanValue')?.textContent ||
                     c.querySelector('rightValue > numberValue')?.textContent ||
                     c.querySelector('rightValue > elementReference')?.textContent || '',
            });
          });
          if (conditions.length > 0) details.conditions = conditions;
        }

        // Action calls
        if (type === 'actionCalls') {
          details.actionName = el.querySelector('actionName')?.textContent || undefined;
          details.actionType = el.querySelector('actionType')?.textContent || undefined;
        }

        // Subflows
        if (type === 'subflows') {
          details.subflowName = el.querySelector('flowName')?.textContent || undefined;
        }

        // Loops
        if (type === 'loops') {
          details.collectionReference = el.querySelector('collectionReference')?.textContent || undefined;
        }

        // Screen fields
        if (type === 'screens') {
          const screenFields: string[] = [];
          el.querySelectorAll('fields').forEach((f) => {
            const fieldName = f.querySelector('name')?.textContent;
            if (fieldName) screenFields.push(fieldName);
          });
          if (screenFields.length > 0) details.screenFields = screenFields;
        }

        const flowElement: FlowElement = {
          name,
          label: elLabel,
          type,
          x,
          y,
          connectors,
          details,
        };

        elements.push(flowElement);
        elementMap.set(name, flowElement);
      });
    }

    // Auto-layout - improved algorithm
    autoLayout(elements, elementMap);

    return {
      label,
      processType,
      status,
      apiVersion,
      triggerObject,
      triggerType,
      recordTriggerType,
      elements,
      variables,
      formulas,
      constants,
    };
  };

  const autoLayout = (elements: FlowElement[], elementMap: Map<string, FlowElement>) => {
    if (elements.length === 0) return;

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    elements.forEach((el) => {
      adjacency.set(el.name, []);
      inDegree.set(el.name, 0);
    });

    elements.forEach((el) => {
      el.connectors.forEach((conn) => {
        const targets = adjacency.get(el.name) || [];
        targets.push(conn.target);
        adjacency.set(el.name, targets);
        inDegree.set(conn.target, (inDegree.get(conn.target) || 0) + 1);
      });
    });

    // Topological sort with BFS
    const levels: string[][] = [];
    const visited = new Set<string>();
    let currentLevel = elements
      .filter((el) => (inDegree.get(el.name) || 0) === 0)
      .map((el) => el.name);

    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      currentLevel.forEach((name) => visited.add(name));

      const nextLevel: string[] = [];
      currentLevel.forEach((name) => {
        const targets = adjacency.get(name) || [];
        targets.forEach((target) => {
          if (!visited.has(target) && !nextLevel.includes(target)) {
            // Check if all predecessors are visited
            const allPredsVisited = elements
              .filter((el) => el.connectors.some((c) => c.target === target))
              .every((el) => visited.has(el.name));
            if (allPredsVisited) {
              nextLevel.push(target);
            }
          }
        });
      });
      currentLevel = nextLevel;
    }

    // Add any unvisited elements
    elements.forEach((el) => {
      if (!visited.has(el.name)) {
        levels.push([el.name]);
        visited.add(el.name);
      }
    });

    // Assign positions
    levels.forEach((level, levelIdx) => {
      const levelWidth = level.length * HORIZONTAL_SPACING;
      const startX = (1600 - levelWidth) / 2;

      level.forEach((name, posIdx) => {
        const element = elementMap.get(name);
        if (element) {
          element.x = startX + posIdx * HORIZONTAL_SPACING;
          element.y = 30 + levelIdx * (ELEMENT_HEIGHT + VERTICAL_SPACING);
        }
      });
    });
  };

  const drawFlow = () => {
    const canvas = canvasRef.current;
    if (!canvas || !flowData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Create element map for drawing connections
    const elementMap = new Map<string, FlowElement>();
    flowData.elements.forEach((el) => elementMap.set(el.name, el));

    // Draw connections first
    flowData.elements.forEach((element) => {
      element.connectors.forEach((conn, idx) => {
        const targetEl = elementMap.get(conn.target);
        if (targetEl) {
          drawConnection(ctx, element, targetEl, conn.label, conn.isDefault, idx, element.connectors.length);
        }
      });
    });

    // Draw elements
    flowData.elements.forEach((element) => {
      drawElement(ctx, element);
    });

    ctx.restore();
  };

  const drawConnection = (
    ctx: CanvasRenderingContext2D,
    from: FlowElement,
    to: FlowElement,
    label?: string,
    isDefault?: boolean,
    index: number = 0,
    total: number = 1
  ) => {
    const fromCenterX = from.x + ELEMENT_WIDTH / 2;
    const fromBottom = from.y + ELEMENT_HEIGHT;
    const toCenterX = to.x + ELEMENT_WIDTH / 2;
    const toTop = to.y;

    // Calculate offset for multiple connectors
    const spreadWidth = Math.min(ELEMENT_WIDTH * 0.6, (total - 1) * 40);
    const offsetX = total > 1 ? -spreadWidth / 2 + (index * spreadWidth) / (total - 1) : 0;

    const startX = fromCenterX + offsetX;
    const endX = toCenterX;

    ctx.beginPath();
    ctx.strokeStyle = isDefault ? '#9ca3af' : '#374151';
    ctx.lineWidth = 2;

    // Draw curved path
    const controlY1 = fromBottom + (toTop - fromBottom) * 0.3;
    const controlY2 = fromBottom + (toTop - fromBottom) * 0.7;

    ctx.moveTo(startX, fromBottom);
    ctx.bezierCurveTo(startX, controlY1, endX, controlY2, endX, toTop);
    ctx.stroke();

    // Draw arrow
    const arrowSize = 8;
    ctx.beginPath();
    ctx.fillStyle = isDefault ? '#9ca3af' : '#374151';
    ctx.moveTo(endX, toTop);
    ctx.lineTo(endX - arrowSize, toTop - arrowSize * 1.5);
    ctx.lineTo(endX + arrowSize, toTop - arrowSize * 1.5);
    ctx.closePath();
    ctx.fill();

    // Draw label
    if (label) {
      const midY = (fromBottom + toTop) / 2;
      const midX = (startX + endX) / 2;

      ctx.font = '11px system-ui';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);

      ctx.fillStyle = '#4b5563';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, midX, midY);
    }
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: FlowElement) => {
    const colors = ELEMENT_COLORS[element.type] || ELEMENT_COLORS.default;
    const isSelected = selectedElement?.name === element.name;

    ctx.save();

    // Shadow for selected
    if (isSelected) {
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 12;
    }

    // Draw shape
    if (element.type === 'decisions') {
      // Diamond
      ctx.beginPath();
      const cx = element.x + ELEMENT_WIDTH / 2;
      const cy = element.y + ELEMENT_HEIGHT / 2;
      ctx.moveTo(cx, element.y);
      ctx.lineTo(element.x + ELEMENT_WIDTH, cy);
      ctx.lineTo(cx, element.y + ELEMENT_HEIGHT);
      ctx.lineTo(element.x, cy);
      ctx.closePath();
    } else if (element.type === 'start') {
      // Pill
      ctx.beginPath();
      ctx.roundRect(element.x, element.y, ELEMENT_WIDTH, ELEMENT_HEIGHT, ELEMENT_HEIGHT / 2);
    } else {
      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(element.x, element.y, ELEMENT_WIDTH, ELEMENT_HEIGHT, 8);
    }

    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#2563eb' : colors.border;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();

    ctx.restore();

    // Icon
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(colors.icon, element.x + 22, element.y + ELEMENT_HEIGHT / 2);

    // Label
    ctx.font = 'bold 12px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const maxWidth = ELEMENT_WIDTH - 50;
    const labelText = element.label.length > 22 ? element.label.substring(0, 20) + '...' : element.label;
    ctx.fillText(labelText, element.x + 38, element.y + ELEMENT_HEIGHT / 2 - 8);

    // Type label
    ctx.font = '10px system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const typeLabels: Record<string, string> = {
      start: 'Trigger',
      decisions: 'Decision',
      assignments: 'Assignment',
      recordLookups: 'Get Records',
      recordCreates: 'Create Record',
      recordUpdates: 'Update Records',
      recordDeletes: 'Delete Records',
      screens: 'Screen',
      subflows: 'Subflow',
      loops: 'Loop',
      actionCalls: 'Action',
      collectionProcessors: 'Collection',
      waits: 'Wait',
    };
    ctx.fillText(typeLabels[element.type] || element.type, element.x + 38, element.y + ELEMENT_HEIGHT / 2 + 6);

    // Object badge
    if (element.details.object) {
      ctx.font = '9px system-ui';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(element.details.object, element.x + 38, element.y + ELEMENT_HEIGHT / 2 + 18);
    }
  };

  const getElementAtPoint = (x: number, y: number): FlowElement | null => {
    if (!flowData) return null;

    const canvasX = (x - offset.x) / scale;
    const canvasY = (y - offset.y) / scale;

    for (const element of flowData.elements) {
      if (element.type === 'decisions') {
        const cx = element.x + ELEMENT_WIDTH / 2;
        const cy = element.y + ELEMENT_HEIGHT / 2;
        const dx = Math.abs(canvasX - cx) / (ELEMENT_WIDTH / 2);
        const dy = Math.abs(canvasY - cy) / (ELEMENT_HEIGHT / 2);
        if (dx + dy <= 1) return element;
      } else {
        if (canvasX >= element.x && canvasX <= element.x + ELEMENT_WIDTH &&
            canvasY >= element.y && canvasY <= element.y + ELEMENT_HEIGHT) {
          return element;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = getElementAtPoint(x, y);
    if (element) {
      setSelectedElement(element);
      setActiveDetailTab('info');
    } else {
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
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
    setScale(Math.max(0.3, Math.min(2, scale * delta)));
  };

  if (!flowData) {
    return <div className="p-8 text-center text-gray-500">Loading flow...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-xs rounded ${
            flowData.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {flowData.status}
          </span>
          <span className="text-sm text-gray-600">{flowData.processType}</span>
          {flowData.triggerObject && (
            <span className="text-sm text-gray-500">on {flowData.triggerObject}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{flowData.elements.length} elements</span>
          <button onClick={() => setScale(Math.max(0.3, scale * 0.8))} className="px-2 py-1 text-sm border rounded hover:bg-white">-</button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(2, scale * 1.2))} className="px-2 py-1 text-sm border rounded hover:bg-white">+</button>
          <button onClick={() => { setScale(0.8); setOffset({ x: 50, y: 30 }); }} className="px-2 py-1 text-sm border rounded hover:bg-white">Fit</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div
          className="flex-1 relative bg-gray-100 cursor-grab active:cursor-grabbing overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          <canvas
            ref={canvasRef}
            width={1600}
            height={1200}
            className="absolute"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Details Panel */}
        {selectedElement && (
          <div className="w-96 border-l bg-white flex flex-col overflow-hidden">
            {/* Element header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: ELEMENT_COLORS[selectedElement.type]?.bg || '#9ca3af' }}
                >
                  {ELEMENT_COLORS[selectedElement.type]?.icon || '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{selectedElement.label}</h3>
                  <p className="text-xs text-gray-500">{selectedElement.type}</p>
                </div>
                <button
                  onClick={() => setSelectedElement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Detail tabs */}
            <div className="flex border-b">
              {['info', 'fields', 'variables'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab as any)}
                  className={`flex-1 px-3 py-2 text-xs font-medium ${
                    activeDetailTab === tab
                      ? 'text-sf-blue border-b-2 border-sf-blue'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'info' ? 'Details' : tab === 'fields' ? 'Fields' : 'Variables'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeDetailTab === 'info' && (
                <>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">API Name</h4>
                    <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded break-all">{selectedElement.name}</p>
                  </div>

                  {selectedElement.details.description && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h4>
                      <p className="text-sm text-gray-700">{selectedElement.details.description}</p>
                    </div>
                  )}

                  {selectedElement.details.object && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Object</h4>
                      <p className="text-sm font-medium text-sf-blue">{selectedElement.details.object}</p>
                    </div>
                  )}

                  {selectedElement.details.subflowName && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Subflow</h4>
                      <p className="text-sm font-mono">{selectedElement.details.subflowName}</p>
                    </div>
                  )}

                  {selectedElement.details.actionName && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Action</h4>
                      <p className="text-sm font-mono">{selectedElement.details.actionName}</p>
                      {selectedElement.details.actionType && (
                        <p className="text-xs text-gray-500">{selectedElement.details.actionType}</p>
                      )}
                    </div>
                  )}

                  {selectedElement.details.conditions && selectedElement.details.conditions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Conditions</h4>
                      <ul className="space-y-1">
                        {selectedElement.details.conditions.map((cond, i) => (
                          <li key={i} className="text-xs bg-amber-50 p-2 rounded">
                            <span className="font-mono text-amber-700">{cond.field}</span>
                            <span className="text-gray-500"> {cond.operator} </span>
                            <span className="font-mono text-amber-700">{cond.value || 'null'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedElement.details.filters && selectedElement.details.filters.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Filters</h4>
                      <ul className="space-y-1">
                        {selectedElement.details.filters.map((filter, i) => (
                          <li key={i} className="text-xs bg-blue-50 p-2 rounded">
                            <span className="font-mono text-blue-700">{filter.field}</span>
                            <span className="text-gray-500"> {filter.operator} </span>
                            <span className="font-mono text-blue-700">{filter.value || 'null'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedElement.connectors.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Connections</h4>
                      <ul className="space-y-1">
                        {selectedElement.connectors.map((conn, i) => (
                          <li key={i} className="text-xs flex items-center gap-2">
                            <span className="text-gray-400">→</span>
                            <span className="text-gray-600">{conn.label || 'Next'}:</span>
                            <span className="font-mono text-gray-700">{conn.target}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {activeDetailTab === 'fields' && (
                <>
                  {selectedElement.details.assignments && selectedElement.details.assignments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Assignments ({selectedElement.details.assignments.length})</h4>
                      <ul className="space-y-2">
                        {selectedElement.details.assignments.map((item, i) => (
                          <li key={i} className="text-xs bg-purple-50 p-2 rounded">
                            <div className="font-mono text-purple-700">{item.field}</div>
                            <div className="text-gray-500 mt-1">
                              {item.operator} = <span className="font-mono text-purple-600">{item.value || 'null'}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedElement.details.inputAssignments && selectedElement.details.inputAssignments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Field Mappings ({selectedElement.details.inputAssignments.length})</h4>
                      <ul className="space-y-2">
                        {selectedElement.details.inputAssignments.map((item, i) => (
                          <li key={i} className="text-xs bg-green-50 p-2 rounded">
                            <div className="font-mono text-green-700">{item.field}</div>
                            <div className="text-gray-500 mt-1">
                              ← <span className="font-mono text-green-600">{item.value || 'null'}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedElement.details.outputAssignments && selectedElement.details.outputAssignments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Output Mappings ({selectedElement.details.outputAssignments.length})</h4>
                      <ul className="space-y-2">
                        {selectedElement.details.outputAssignments.map((item, i) => (
                          <li key={i} className="text-xs bg-blue-50 p-2 rounded">
                            <div className="font-mono text-blue-700">{item.field}</div>
                            <div className="text-gray-500 mt-1">
                              → <span className="font-mono text-blue-600">{item.value}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedElement.details.screenFields && selectedElement.details.screenFields.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Screen Fields</h4>
                      <ul className="space-y-1">
                        {selectedElement.details.screenFields.map((field, i) => (
                          <li key={i} className="text-xs bg-cyan-50 p-2 rounded font-mono text-cyan-700">
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!selectedElement.details.assignments?.length &&
                   !selectedElement.details.inputAssignments?.length &&
                   !selectedElement.details.outputAssignments?.length &&
                   !selectedElement.details.screenFields?.length && (
                    <p className="text-sm text-gray-500">No field mappings for this element.</p>
                  )}
                </>
              )}

              {activeDetailTab === 'variables' && flowData && (
                <>
                  {flowData.variables.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Flow Variables ({flowData.variables.length})</h4>
                      <ul className="space-y-2">
                        {flowData.variables.map((v, i) => (
                          <li key={i} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-gray-800">{v.name}</span>
                              <span className="text-gray-400">{v.dataType}</span>
                              {v.isCollection && <span className="px-1 bg-blue-100 text-blue-700 rounded">[]</span>}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {v.isInput && <span className="text-green-600 text-[10px]">Input</span>}
                              {v.isOutput && <span className="text-orange-600 text-[10px]">Output</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {flowData.formulas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Formulas ({flowData.formulas.length})</h4>
                      <ul className="space-y-2">
                        {flowData.formulas.map((f, i) => (
                          <li key={i} className="text-xs bg-amber-50 p-2 rounded">
                            <div className="font-mono font-medium text-amber-800">{f.name}</div>
                            <div className="text-gray-500">{f.dataType}</div>
                            <div className="font-mono text-[10px] text-amber-600 mt-1 break-all">{f.expression}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {flowData.constants.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Constants ({flowData.constants.length})</h4>
                      <ul className="space-y-1">
                        {flowData.constants.map((c, i) => (
                          <li key={i} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                            <span className="font-mono text-gray-700">{c.name}</span>
                            <span className="text-gray-500">{c.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {flowData.variables.length === 0 && flowData.formulas.length === 0 && flowData.constants.length === 0 && (
                    <p className="text-sm text-gray-500">No variables, formulas, or constants in this flow.</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t bg-gray-50 flex flex-wrap gap-3 text-xs">
        {Object.entries(ELEMENT_COLORS).filter(([key]) => key !== 'default' && key !== 'end').map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1">
            <span
              className="w-4 h-4 rounded flex items-center justify-center text-white text-[10px]"
              style={{ backgroundColor: colors.bg }}
            >
              {colors.icon}
            </span>
            <span className="text-gray-600">
              {{
                start: 'Start',
                decisions: 'Decision',
                assignments: 'Assignment',
                recordLookups: 'Get Records',
                recordCreates: 'Create',
                recordUpdates: 'Update',
                recordDeletes: 'Delete',
                screens: 'Screen',
                subflows: 'Subflow',
                loops: 'Loop',
                actionCalls: 'Action',
                collectionProcessors: 'Collection',
                waits: 'Wait',
              }[type] || type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
