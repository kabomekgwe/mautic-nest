'use client';
import { useState, useCallback, useEffect, useRef } from 'react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: 'Aa' },
  { value: 'email', label: 'Email', icon: '@' },
  { value: 'tel', label: 'Phone', icon: '#' },
  { value: 'textarea', label: 'Text Area', icon: 'T' },
  { value: 'select', label: 'Dropdown', icon: 'V' },
  { value: 'multiselect', label: 'Multi Select', icon: 'M' },
  { value: 'checkbox', label: 'Checkbox', icon: 'C' },
  { value: 'radio', label: 'Radio Group', icon: 'R' },
  { value: 'date', label: 'Date', icon: 'D' },
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'file', label: 'File Upload', icon: 'F' },
  { value: 'hidden', label: 'Hidden', icon: 'H' },
];

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  alias: string;
  required: boolean;
  placeholder: string;
  options: string[];
  order: number;
}

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const [campaignId, setCampaignId] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => { params.then(p => setCampaignId(p.id)); }, [params]);

  const addField = (fieldType: string, label: string) => {
    const newField: FormField = {
      id: crypto.randomUUID(), label, fieldType,
      alias: label.toLowerCase().replace(/\s+/g, '_'),
      required: false, placeholder: '', options: [], order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const moveField = (from: number, to: number) => {
    const newFields = [...fields];
    const [moved] = newFields.splice(from, 1);
    newFields.splice(to, 0, moved);
    setFields(newFields.map((f, i) => ({ ...f, order: i })));
  };

  const onDragStart = (index: number) => setDragIndex(index);
  const onDragEnter = (index: number) => setDragOverIndex(index);
  const onDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      moveField(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const selectedFieldData = fields.find(f => f.id === selectedField);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Field Palette */}
      <div className="w-64 border-r bg-card p-4 overflow-y-auto space-y-2">
        <h2 className="font-semibold mb-4">Field Types</h2>
        {FIELD_TYPES.map(ft => (
          <button
            key={ft.value}
            onClick={() => addField(ft.value, ft.label)}
            className="w-full flex items-center gap-3 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-bold">{ft.icon}</span>
            {ft.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {fields.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-16 text-center">
              <p className="text-muted-foreground">Drag or click field types from the left palette to start building your form</p>
            </div>
          )}
          {fields.map((field, index) => (
            <div
              key={field.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragEnter={() => onDragEnter(index)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => setSelectedField(field.id)}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                selectedField === field.id ? 'border-blue-500 bg-blue-500/5' : 'border-input bg-card hover:border-muted-foreground'
              } ${dragOverIndex === index ? 'border-t-2 border-t-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground cursor-grab">::</span>
                  <div>
                    <div className="text-sm font-medium">{field.label}</div>
                    <div className="text-xs text-muted-foreground">{field.fieldType}{field.required ? ' *' : ''}</div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }} className="text-xs text-red-400 hover:text-red-300">&times;</button>
              </div>
              {/* Field preview */}
              <div className="mt-2">
                {field.fieldType === 'textarea' ? (
                  <textarea disabled className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm opacity-60" placeholder={field.placeholder || field.label} rows={3} />
                ) : field.fieldType === 'select' ? (
                  <select disabled className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm opacity-60">
                    <option>{field.placeholder || `Select ${field.label}`}</option>
                  </select>
                ) : field.fieldType === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled className="opacity-60" /> {field.placeholder || field.label}</label>
                ) : field.fieldType === 'radio' ? (
                  <div className="space-y-1"><label className="flex items-center gap-2 text-sm opacity-60"><input type="radio" disabled /> Option 1</label></div>
                ) : (
                  <input disabled className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm opacity-60" placeholder={field.placeholder || `Enter ${field.label}`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedFieldData && (
        <div className="w-80 border-l bg-card p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Field Properties</h2>
            <button onClick={() => setSelectedField(null)} className="text-xs text-muted-foreground">&times;</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Label</label>
            <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedFieldData.label}
              onChange={e => updateField(selectedFieldData.id, { label: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Alias</label>
            <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedFieldData.alias}
              onChange={e => updateField(selectedFieldData.id, { alias: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Placeholder</label>
            <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedFieldData.placeholder}
              onChange={e => updateField(selectedFieldData.id, { placeholder: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="required" checked={selectedFieldData.required}
              onChange={e => updateField(selectedFieldData.id, { required: e.target.checked })}
            />
            <label htmlFor="required" className="text-sm">Required field</label>
          </div>
          {(selectedFieldData.fieldType === 'select' || selectedFieldData.fieldType === 'multiselect' || selectedFieldData.fieldType === 'radio') && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Options (one per line)</label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={4}
                value={selectedFieldData.options.join('\n')}
                onChange={e => updateField(selectedFieldData.id, { options: e.target.value.split('\n').filter(s => s.trim()) })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
