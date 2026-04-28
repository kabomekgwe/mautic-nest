'use client';
import { useState, useEffect } from 'react';

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: 'H', defaultContent: '<h2 style=\"font-size:24px;color:#333;margin:10px 0\">Your Heading Here</h2>' },
  { type: 'text', label: 'Text', icon: 'T', defaultContent: '<p style=\"font-size:16px;color:#555;line-height:1.6;margin:10px 0\">Your text content goes here. You can edit this text directly.</p>' },
  { type: 'image', label: 'Image', icon: 'I', defaultContent: '<img src=\"https://placehold.co/600x300/1a1a2e/666?text=Your+Image\" style=\"max-width:100%;height:auto;margin:10px 0\" alt=\"Image\"/>' },
  { type: 'button', label: 'Button', icon: 'B', defaultContent: '<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:10px 0\"><tr><td style=\"padding:12px 24px;background-color:#2563eb;border-radius:6px\"><a href=\"#\" style=\"color:white;font-size:16px;text-decoration:none\">Call to Action</a></td></tr></table>' },
  { type: 'divider', label: 'Divider', icon: '-', defaultContent: '<hr style=\"border:none;border-top:1px solid #ddd;margin:20px 0\"/>' },
  { type: 'spacer', label: 'Spacer', icon: '+', defaultContent: '<div style=\"height:30px\"></div>' },
  { type: 'columns', label: 'Two Columns', icon: '||', defaultContent: '<table width=\"100%\" cellpadding=\"10\"><tr><td width=\"50%\" valign=\"top\" style=\"background:#f9f9f9\"><p style=\"font-size:14px\">Left column</p></td><td width=\"50%\" valign=\"top\" style=\"background:#f9f9f9\"><p style=\"font-size:14px\">Right column</p></td></tr></table>' },
  { type: 'footer', label: 'Footer', icon: 'F', defaultContent: '<div style=\"text-align:center;font-size:12px;color:#999;margin:20px 0\"><p>You received this email because you subscribed.</p><p><a href=\"{{unsubscribe_url}}\" style=\"color:#999\">Unsubscribe</a></p></div>' },
];

interface EmailBlock {
  id: string;
  type: string;
  content: string;
}

export default function EmailEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [emailId, setEmailId] = useState('');
  const [subject, setSubject] = useState('New Email Campaign');
  const [name, setName] = useState('New Email');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showHtml, setShowHtml] = useState(false);

  useEffect(() => { params.then(p => setEmailId(p.id)); }, [params]);

  const addBlock = (blockType: string) => {
    const bt = BLOCK_TYPES.find(b => b.type === blockType);
    setBlocks([...blocks, { id: crypto.randomUUID(), type: blockType, content: bt?.defaultContent ?? '' }]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlockContent = (id: string, content: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>
<body style=\"margin:0;padding:0;background-color:#f4f4f4\">
  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">
    <tr><td align=\"center\" style=\"padding:20px\">
      <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#ffffff;border-radius:8px;overflow:hidden\">
        <tr><td style=\"padding:20px;background:linear-gradient(135deg,#1a1a2e,#2563eb)\">
          <h1 style=\"color:white;margin:0;font-size:24px\">${subject}</h1>
        </td></tr>
        <tr><td style=\"padding:20px\">
          ${blocks.map(b => b.content).join('\n')}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Block Palette */}
      <div className="w-64 border-r bg-card p-4 overflow-y-auto space-y-2">
        <h2 className="font-semibold mb-4">Content Blocks</h2>
        {BLOCK_TYPES.map(bt => (
          <button key={bt.type} onClick={() => addBlock(bt.type)}
            className="w-full flex items-center gap-3 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-mono">{bt.icon}</span>
            {bt.label}
          </button>
        ))}
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 space-y-3">
          <input className="w-full rounded-md border border-input bg-background px-4 py-2 text-lg font-semibold"
            value={name} onChange={e => setName(e.target.value)} placeholder="Email Name" />
          <input className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm"
            value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject Line" />
        </div>

        <div className={`mx-auto ${mobilePreview ? 'w-[360px]' : 'max-w-[600px]'}`}>
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4 p-2 rounded-md bg-muted/50">
            <button onClick={() => setMobilePreview(!mobilePreview)} className={`px-3 py-1 rounded text-xs ${mobilePreview ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {mobilePreview ? 'Desktop' : 'Mobile'}
            </button>
            <button onClick={() => setShowHtml(!showHtml)} className="px-3 py-1 rounded text-xs text-muted-foreground hover:bg-muted">
              {showHtml ? 'Preview' : 'HTML'}
            </button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">{blocks.length} blocks</span>
          </div>

          {showHtml ? (
            <textarea className="w-full h-[600px] rounded-md border border-input bg-background p-4 text-xs font-mono"
              value={emailHtml} readOnly />
          ) : (
            <div className="rounded-lg border bg-white shadow-sm" style={{ color: '#333' }}>
              <div style={{ padding: '20px', background: 'linear-gradient(135deg,#1a1a2e,#2563eb)' }}>
                <h1 style={{ color: 'white', margin: 0, fontSize: 24 }}>{subject}</h1>
              </div>
              <div style={{ padding: 20 }}>
                {blocks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999', border: '2px dashed #ddd', borderRadius: 8 }}>
                    Click blocks from the palette to add content
                  </div>
                )}
                {blocks.map((block, index) => (
                  <div key={block.id}
                    onClick={() => setSelectedBlock(block.id)}
                    className={`relative group ${selectedBlock === block.id ? 'ring-2 ring-blue-500 rounded' : ''}`}
                  >
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col gap-1">
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }} className="w-6 h-5 rounded bg-muted text-xs hover:bg-muted/80">&uarr;</button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }} className="w-6 h-5 rounded bg-muted text-xs hover:bg-muted/80">&darr;</button>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: block.content }} />
                    {selectedBlock === block.id && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => removeBlock(block.id)} className="text-xs text-red-500 hover:text-red-400">Remove</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedBlock && (
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Block HTML</h2>
          <textarea className="w-full h-64 rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
            value={blocks.find(b => b.id === selectedBlock)?.content ?? ''}
            onChange={e => updateBlockContent(selectedBlock, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
