import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Download,
  FileSpreadsheet,
  FileUp,
  MessageSquare,
  Plus,
  RotateCcw,
  ScrollText,
  Trash2,
} from 'lucide-react';
import {
  BillCategory,
  BillTwittlyReaction,
  CharacteristicKey,
  NationCharacteristics,
  PolicyBill,
  ReactionMood,
  SignedBillRecord,
  VetoedBillRecord,
} from '../types/engine';
import {
  CHARACTERISTIC_META,
  REACTION_MOODS,
  createDefaultThreeReactions,
  ensureBillThreeReactions,
} from '../data/defaultBills';
import {
  BILL_CSV_HEADERS,
  generateBillsCsvTemplate,
  parseBillsFromCsv,
  serializeBillsToCsv,
} from '../utils/billsCsv';
import { DevCharacteristicsPanel } from './DevCharacteristicsPanel';

interface BillsAndStatsInspectorProps {
  characteristics: NationCharacteristics;
  onChangeCharacteristic: (key: CharacteristicKey, value: number) => void;
  onResetCharacteristics: () => void;
  bills: PolicyBill[];
  signedBills: Record<string, SignedBillRecord>;
  vetoedBills?: Record<string, VetoedBillRecord>;
  onChangeBills: (next: PolicyBill[]) => void;
  onResetDefaultBills: () => void;
  onClearSignedBills: () => void;
}

const RIBBON_SWATCHES = ['#D97706', '#16A34A', '#DC2626', '#2563EB', '#9333EA'];

export const BillsAndStatsInspector: React.FC<BillsAndStatsInspectorProps> = ({
  characteristics,
  onChangeCharacteristic,
  onResetCharacteristics,
  bills,
  signedBills,
  vetoedBills = {},
  onChangeBills,
  onResetDefaultBills,
  onClearSignedBills,
}) => {
  const [selectedBillId, setSelectedBillId] = useState<string>(bills[0]?.id || '');
  const [csvImportMode, setCsvImportMode] = useState<'append' | 'replace'>('append');
  const [showCsvPastePanel, setShowCsvPastePanel] = useState(false);
  const [csvPasteText, setCsvPasteText] = useState('');
  const [csvStatus, setCsvStatus] = useState<{
    type: 'ok' | 'err';
    message: string;
  } | null>(null);

  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedBill = bills.find((b) => b.id === selectedBillId) || bills[0] || null;
  const signedCount = Object.keys(signedBills).length;
  const vetoedCount = Object.keys(vetoedBills).length;
  const handledCount = signedCount + vetoedCount;

  const updateSelectedBill = (updater: (bill: PolicyBill) => PolicyBill) => {
    if (!selectedBill) return;
    onChangeBills(bills.map((b) => (b.id === selectedBill.id ? updater(b) : b)));
  };

  const updateSelectedBillReaction = (
    reactionIndex: number,
    patch: Partial<BillTwittlyReaction>
  ) => {
    if (!selectedBill) return;
    updateSelectedBill((bill) => {
      const currentList = ensureBillThreeReactions(bill);
      const nextList = currentList.map((rx, idx) =>
        idx === reactionIndex ? { ...rx, ...patch } : rx
      );
      return {
        ...bill,
        twittlyReactions: nextList,
      };
    });
  };

  const handleAddBill = () => {
    const num = bills.length + 1;
    const code = `E.O. ${100 + num}`;
    const title = `Executive Policy #${num}`;
    const newBill: PolicyBill = {
      id: `bill-custom-${Date.now()}`,
      code,
      title,
      category: 'EXECUTIVE ORDER',
      summary: 'Custom executive policy directive authored in Dev Mode.',
      clauses: [
        'Sec. 1. Enact primary cabinet provisions immediately upon signature.',
        'Sec. 2. Direct federal agencies to adjust operations accordingly.',
      ],
      ribbonColor: RIBBON_SWATCHES[(num - 1) % RIBBON_SWATCHES.length],
      effects: {
        approval: 5,
        economy: -5,
      },
      twittlyReactions: createDefaultThreeReactions(code, title),
      activeOnDesk: true,
    };
    onChangeBills([...bills, newBill]);
    setSelectedBillId(newBill.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedBill || bills.length <= 1) return;
    const remaining = bills.filter((b) => b.id !== selectedBill.id);
    onChangeBills(remaining);
    setSelectedBillId(remaining[0]?.id || '');
  };

  const triggerCsvDownload = (filename: string, csvContent: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplateCsv = () => {
    const csv = generateBillsCsvTemplate();
    triggerCsvDownload('bills_template_all_fields.csv', csv);
    setCsvStatus({
      type: 'ok',
      message: 'Downloaded bills_template_all_fields.csv (25 columns).',
    });
  };

  const handleExportCurrentBillsCsv = () => {
    const csv = serializeBillsToCsv(bills);
    triggerCsvDownload('desk_bills_export.csv', csv);
    setCsvStatus({
      type: 'ok',
      message: `Exported ${bills.length} bill(s) to desk_bills_export.csv.`,
    });
  };

  const handleCopyTemplateToClipboard = async () => {
    const csv = generateBillsCsvTemplate();
    setCsvPasteText(csv);
    setShowCsvPastePanel(true);
    try {
      await navigator.clipboard.writeText(csv);
      setCsvStatus({
        type: 'ok',
        message: 'Copied CSV template to clipboard & loaded into editor box.',
      });
    } catch {
      setCsvStatus({
        type: 'ok',
        message: 'Loaded CSV template into the paste box below.',
      });
    }
  };

  const applyImportedBills = (imported: PolicyBill[], sourceLabel: string) => {
    if (imported.length === 0) {
      setCsvStatus({
        type: 'err',
        message: `No valid bills found in ${sourceLabel}.`,
      });
      return;
    }

    if (csvImportMode === 'replace') {
      onChangeBills(imported);
      setSelectedBillId(imported[0].id);
      setCsvStatus({
        type: 'ok',
        message: `Replaced desk queue with ${imported.length} bill(s) from ${sourceLabel}.`,
      });
    } else {
      const next = [...bills, ...imported];
      onChangeBills(next);
      setSelectedBillId(imported[0].id);
      setCsvStatus({
        type: 'ok',
        message: `Added ${imported.length} bill(s) from ${sourceLabel} (Total: ${next.length}).`,
      });
    }
  };

  const handleUploadCsvFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    const allImported: PolicyBill[] = [];
    let runningIndex = bills.length + 1;

    for (const file of files) {
      try {
        const text = await file.text();
        const { bills: parsed } = parseBillsFromCsv(text, runningIndex);
        allImported.push(...parsed);
        runningIndex += parsed.length;
      } catch {
        // Ignore broken file and continue
      }
    }

    e.target.value = '';
    const label =
      files.length === 1 ? `"${files[0].name}"` : `${files.length} CSV files`;
    applyImportedBills(allImported, label);
  };

  const handleImportFromPasteBox = () => {
    if (!csvPasteText.trim()) {
      setCsvStatus({
        type: 'err',
        message: 'Paste CSV rows first before importing.',
      });
      return;
    }
    const { bills: parsed, errors } = parseBillsFromCsv(
      csvPasteText,
      bills.length + 1
    );
    if (parsed.length === 0) {
      setCsvStatus({
        type: 'err',
        message: errors[0] || 'Could not parse any bills from pasted CSV.',
      });
      return;
    }
    applyImportedBills(parsed, 'pasted CSV');
  };

  const activeReactions = selectedBill ? ensureBillThreeReactions(selectedBill) : [];

  return (
    <div className="space-y-5">
      {/* Section 1: Stored Characteristics (Set Exact Levels, Sliders & DEFCON Level) */}
      <div className="border-b border-slate-800 pb-4">
        <DevCharacteristicsPanel
          characteristics={characteristics}
          onChangeCharacteristic={onChangeCharacteristic}
          onResetCharacteristics={onResetCharacteristics}
          title="Characteristics Storage"
          subtitle="Set Economy, Approval, Security, Diplomacy & Media Trust directly or via bills."
        />
      </div>

      {/* Section 2: CSV Bulk Template & Multi-Bill Importer */}
      <div className="space-y-2.5 border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                CSV Bulk Bills Template &amp; Import
              </h2>
              <p className="text-[10px] text-slate-400">
                All 25 fields: Code, Title, Summary, Clauses, 5 Effects &amp; 3 Twittly Reactions
              </p>
            </div>
          </div>
        </div>

        {/* Hidden multi-file CSV input */}
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={handleUploadCsvFiles}
          className="hidden"
        />

        {/* Template & Export Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleDownloadTemplateCsv}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-md cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>CSV Template</span>
          </button>

          <button
            type="button"
            onClick={handleExportCurrentBillsCsv}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-md cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Export Bills ({bills.length})</span>
          </button>
        </div>

        {/* Import Mode Toggle (Append vs Replace) */}
        <div className="flex items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-md px-2.5 py-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Import Mode:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCsvImportMode('append')}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border cursor-pointer ${
                csvImportMode === 'append'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              + Append Bills
            </button>
            <button
              type="button"
              onClick={() => setCsvImportMode('replace')}
              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border cursor-pointer ${
                csvImportMode === 'replace'
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Replace All
            </button>
          </div>
        </div>

        {/* Upload CSV File(s) & Paste CSV Toggle */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => csvFileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md cursor-pointer transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 shrink-0" />
            <span>Import CSV File(s)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCsvPastePanel((v) => !v)}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-md border cursor-pointer transition-colors ${
              showCsvPastePanel
                ? 'bg-sky-500/20 text-sky-200 border-sky-400'
                : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{showCsvPastePanel ? 'Hide Paste Box' : 'Paste CSV / Columns'}</span>
          </button>
        </div>

        {/* Expandable Paste Box & All 25 Column Headers Reference */}
        {showCsvPastePanel && (
          <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold text-sky-300 uppercase">
                All 25 CSV Template Columns (Comma or `;` separated)
              </span>
              <button
                type="button"
                onClick={handleCopyTemplateToClipboard}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded cursor-pointer"
              >
                <Copy className="w-2.5 h-2.5" />
                Load &amp; Copy Sample
              </button>
            </div>

            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-300 break-all leading-relaxed select-all">
              {BILL_CSV_HEADERS.join(', ')}
            </div>

            <textarea
              rows={5}
              value={csvPasteText}
              onChange={(e) => setCsvPasteText(e.target.value)}
              placeholder="Paste CSV lines here (with or without header row) to bulk-import many bills at once..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 rounded p-2 text-[10px] font-mono text-slate-100 outline-none resize-y"
            />

            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setCsvPasteText('')}
                className="px-2 py-1 text-[10px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleImportFromPasteBox}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded cursor-pointer"
              >
                <FileUp className="w-3 h-3" />
                Import Pasted CSV Rows
              </button>
            </div>
          </div>
        )}

        {/* Status Toast Banner */}
        {csvStatus && (
          <div
            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-[11px] ${
              csvStatus.type === 'ok'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{csvStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setCsvStatus(null)}
              className="text-[10px] font-mono opacity-75 hover:opacity-100 cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Bills & Policy Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-amber-400" />
            Desk Bills ({bills.length})
          </h2>
          <div className="flex items-center gap-1.5">
            {handledCount > 0 && (
              <button
                type="button"
                onClick={onClearSignedBills}
                className="px-2 py-1 text-[11px] font-medium text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 rounded-md cursor-pointer"
              >
                Reset Status ({handledCount})
              </button>
            )}
            <button
              type="button"
              onClick={handleAddBill}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              New Bill
            </button>
          </div>
        </div>

        {/* Bills Selector List */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {bills.map((bill) => {
            const isSelected = selectedBill?.id === bill.id;
            const isSigned = Boolean(signedBills[bill.id]);
            const isVetoed = Boolean(vetoedBills[bill.id]);
            return (
              <div
                key={bill.id}
                onClick={() => setSelectedBillId(bill.id)}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span
                    className="w-2 h-2 shrink-0 border border-black"
                    style={{ backgroundColor: bill.ribbonColor }}
                  />
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {bill.code}
                  </span>
                  <span className="font-medium truncate">{bill.title}</span>
                </div>
                <span
                  className={`text-[10px] font-mono shrink-0 ${
                    isVetoed ? 'text-red-400' : isSigned ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {isSigned
                    ? 'SIGNED'
                    : isVetoed
                      ? 'VETOED'
                      : bill.activeOnDesk === false
                        ? 'HIDDEN'
                        : 'ON DESK'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Bill Details & Characteristic Delta Editor */}
        {selectedBill && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Bill Code</span>
                <input
                  type="text"
                  value={selectedBill.code}
                  onChange={(e) =>
                    updateSelectedBill((b) => ({ ...b, code: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-100 outline-none"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Category</span>
                <select
                  value={selectedBill.category}
                  onChange={(e) =>
                    updateSelectedBill((b) => ({
                      ...b,
                      category: e.target.value as BillCategory,
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2 py-1.5 text-xs text-slate-100 outline-none cursor-pointer"
                >
                  <option value="EXECUTIVE ORDER">EXECUTIVE ORDER</option>
                  <option value="POLICY BILL">POLICY BILL</option>
                  <option value="STATE DIRECTIVE">STATE DIRECTIVE</option>
                </select>
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="text-[11px] font-medium text-slate-400">Bill Title</span>
              <input
                type="text"
                value={selectedBill.title}
                onChange={(e) =>
                  updateSelectedBill((b) => ({ ...b, title: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-[11px] font-medium text-slate-400">Summary Text</span>
              <textarea
                rows={2}
                value={selectedBill.summary}
                onChange={(e) =>
                  updateSelectedBill((b) => ({ ...b, summary: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1.5 text-xs text-slate-100 outline-none resize-none"
              />
            </label>

            {/* Clauses 1 & 2 */}
            <div className="grid grid-cols-1 gap-2">
              <label className="space-y-1 block">
                <span className="text-[11px] font-medium text-slate-400">
                  Clause 1 (`clause_1`)
                </span>
                <input
                  type="text"
                  value={selectedBill.clauses?.[0] ?? ''}
                  onChange={(e) =>
                    updateSelectedBill((b) => ({
                      ...b,
                      clauses: [
                        e.target.value,
                        b.clauses?.[1] ??
                          'Sec. 2. Direct federal agencies to adjust operations accordingly.',
                      ],
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1 text-[11px] text-slate-100 outline-none"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-medium text-slate-400">
                  Clause 2 (`clause_2`)
                </span>
                <input
                  type="text"
                  value={selectedBill.clauses?.[1] ?? ''}
                  onChange={(e) =>
                    updateSelectedBill((b) => ({
                      ...b,
                      clauses: [
                        b.clauses?.[0] ??
                          'Sec. 1. Enact primary cabinet provisions immediately upon signature.',
                        e.target.value,
                      ],
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-md px-2.5 py-1 text-[11px] text-slate-100 outline-none"
                />
              </label>
            </div>

            {/* Ribbon & On-Desk Toggle */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Tab:</span>
                {RIBBON_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => updateSelectedBill((b) => ({ ...b, ribbonColor: swatch }))}
                    className={`w-4 h-4 border cursor-pointer ${
                      selectedBill.ribbonColor === swatch
                        ? 'border-white scale-110'
                        : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: swatch }}
                    aria-label={`Set ribbon color ${swatch}`}
                  />
                ))}
              </div>

              <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBill.activeOnDesk !== false}
                  onChange={(e) =>
                    updateSelectedBill((b) => ({ ...b, activeOnDesk: e.target.checked }))
                  }
                  className="rounded border-slate-700 bg-slate-950 text-amber-400"
                />
                Show on Desk
              </label>
            </div>

            {/* Characteristic Rise & Fall Deltas */}
            <div className="space-y-2 bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold text-slate-300">
                Characteristics Effect When Signed (-25 to +25)
              </div>
              {CHARACTERISTIC_META.map((meta) => {
                const delta = selectedBill.effects[meta.key] ?? 0;
                return (
                  <label key={meta.key} className="block space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-300">{meta.label}</span>
                      <span
                        className={
                          delta > 0
                            ? 'text-emerald-400 font-bold'
                            : delta < 0
                              ? 'text-rose-400 font-bold'
                              : 'text-slate-500'
                        }
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-25}
                      max={25}
                      step={1}
                      value={delta}
                      onChange={(e) => {
                        const nextVal = +e.target.value;
                        updateSelectedBill((b) => ({
                          ...b,
                          effects: {
                            ...b.effects,
                            [meta.key]: nextVal,
                          },
                        }));
                      }}
                      className="w-full accent-amber-400"
                    />
                  </label>
                );
              })}
            </div>

            {/* 3 Twittly Public Reaction Messages Editor */}
            <div className="space-y-2.5 bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>Twittly Reactions After Signing (3 Messages)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Posts to Phone</span>
              </div>

              <div className="space-y-2.5">
                {activeReactions.map((rx, idx) => {
                  return (
                    <div
                      key={rx.id || idx}
                      className="p-2 rounded-md bg-slate-900/90 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-amber-300">
                          MESSAGE #{idx + 1}
                        </span>

                        {/* Mood Picker */}
                        <div className="flex flex-wrap items-center gap-1">
                          {REACTION_MOODS.map((m) => {
                            const active = rx.mood === m.mood;
                            return (
                              <button
                                key={m.mood}
                                type="button"
                                onClick={() =>
                                  updateSelectedBillReaction(idx, {
                                    mood: m.mood as ReactionMood,
                                  })
                                }
                                className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border cursor-pointer transition-colors ${
                                  active
                                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Person Name & Handle */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={rx.author}
                          onChange={(e) =>
                            updateSelectedBillReaction(idx, { author: e.target.value })
                          }
                          placeholder="Person Name"
                          aria-label={`Reaction ${idx + 1} Author`}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-400 rounded px-2 py-1 text-[11px] text-slate-100 outline-none"
                        />
                        <input
                          type="text"
                          value={rx.handle}
                          onChange={(e) =>
                            updateSelectedBillReaction(idx, { handle: e.target.value })
                          }
                          placeholder="@handle"
                          aria-label={`Reaction ${idx + 1} Handle`}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-400 rounded px-2 py-1 text-[11px] font-mono text-sky-300 outline-none"
                        />
                      </div>

                      {/* What They Say on Twittly */}
                      <textarea
                        rows={2}
                        value={rx.content}
                        onChange={(e) =>
                          updateSelectedBillReaction(idx, { content: e.target.value })
                        }
                        placeholder="What people say on Twittly after signing this bill..."
                        aria-label={`Reaction ${idx + 1} Message`}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-400 rounded px-2 py-1 text-[11px] text-slate-100 outline-none resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={onResetDefaultBills}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset 3 Templates
              </button>

              {bills.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-800/70 border border-rose-500/40 rounded-md cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Bill
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
