import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useCreateDonor } from '../hooks/useQueries';
import { parseCSVFile, parseAndValidateCSV, downloadCSVTemplate, type ParsedDonorRow } from '../utils/csvImport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ImportSummary {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; reason: string }>;
}

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CSVImportModal({ open, onClose }: CSVImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDonor = useCreateDonor();

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a .csv file');
      return;
    }
    setSelectedFile(file);
    setSummary(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setSummary(null);

    try {
      const csvText = await parseCSVFile(selectedFile);
      const { validRows, errors, totalRows } = parseAndValidateCSV(csvText);

      if (errors.length > 0 && errors[0].row === 0) {
        // Header/structural error
        toast.error(errors[0].reason);
        setIsImporting(false);
        return;
      }

      let importedCount = 0;
      const importErrors: Array<{ row: number; reason: string }> = [...errors];

      // Import valid rows one by one
      for (const row of validRows) {
        try {
          const donationType =
            row.donationType === 'money'
              ? ({ __kind__: 'money', money: row.moneyAmount } as const)
              : ({
                  __kind__: 'groceries',
                  groceries: row.groceryItems
                    .split(';')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((name) => ({ name, quantity: undefined })),
                } as const);

          await createDonor.mutateAsync({
            name: row.name,
            address: row.address,
            addressNumber: row.addressNumber,
            place: row.place,
            donationType,
            notes: row.notes,
            mapLink: row.mapsLink || null,
          });
          importedCount++;
        } catch (err: any) {
          const rowIndex = validRows.indexOf(row) + 2 + errors.filter((e) => e.row < validRows.indexOf(row) + 2).length;
          importErrors.push({
            row: rowIndex,
            reason: err?.message || 'Failed to create donor',
          });
        }
      }

      setSummary({
        totalRows,
        importedCount,
        failedCount: totalRows - importedCount,
        errors: importErrors,
      });

      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} donor${importedCount !== 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to parse CSV file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSummary(null);
    setIsDragging(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Upload className="w-5 h-5 text-primary" />
            Import Donors from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import donors. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSVTemplate}
            className="w-full min-h-[44px]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          {/* File drop zone */}
          {!summary && (
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                  ? 'border-success bg-success/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-success" />
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="font-medium text-sm">Drop your CSV file here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
              )}
            </div>
          )}

          {/* Import summary */}
          {summary && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-heading">{summary.totalRows}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Rows</p>
                </div>
                <div className="bg-success/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-heading text-success">{summary.importedCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Imported</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${summary.failedCount > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <p className={`text-2xl font-bold font-heading ${summary.failedCount > 0 ? 'text-destructive' : ''}`}>
                    {summary.failedCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Failed</p>
                </div>
              </div>

              {summary.importedCount === summary.totalRows && summary.failedCount === 0 && (
                <div className="flex items-center gap-2 text-success bg-success/10 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm font-medium">All donors imported successfully!</p>
                </div>
              )}

              {summary.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <XCircle className="w-4 h-4" />
                    {summary.errors.length} row{summary.errors.length !== 1 ? 's' : ''} with errors
                  </div>
                  <ScrollArea className="h-36 rounded-lg border border-border">
                    <div className="p-2 space-y-1.5">
                      {summary.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs bg-destructive/5 rounded px-2 py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>
                            <Badge variant="outline" className="text-xs mr-1.5 py-0">Row {err.row}</Badge>
                            {err.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setSelectedFile(null); setSummary(null); }}
              >
                Import Another File
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="min-h-[44px]">
            {summary ? 'Close' : 'Cancel'}
          </Button>
          {!summary && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="min-h-[44px]"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Donors
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
