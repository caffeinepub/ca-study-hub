import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BookOpen,
  Crown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CA_Level, ExternalBlob, type PDFMetadata } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddOrUpdatePDFMetadata,
  usePDFMetadata,
  useRemovePDFMetadata,
} from "../hooks/useQueries";
import { nanoid } from "../utils/nanoid";

const FILE_LIMIT = 500;

const LEVEL_LABELS: Record<CA_Level, string> = {
  [CA_Level.foundation]: "CA Foundation",
  [CA_Level.intermediate]: "CA Intermediate",
  [CA_Level.final_]: "CA Final",
};

const LEVEL_KEYS: CA_Level[] = [
  CA_Level.foundation,
  CA_Level.intermediate,
  CA_Level.final_,
];

// ─── File type helpers ─────────────────────────────────────────────────────────

type FileType = "pdf" | "excel" | "word" | "other";

function getFileType(filename: string): FileType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "xlsx" || ext === "xls") return "excel";
  if (ext === "docx" || ext === "doc") return "word";
  return "other";
}

function FileTypeIcon({
  filename,
  className,
}: { filename: string; className?: string }) {
  const type = getFileType(filename);
  if (type === "excel") {
    return (
      <FileSpreadsheet
        className={className}
        style={{ color: "oklch(0.6 0.18 145)" }}
      />
    );
  }
  if (type === "word") {
    return (
      <FileText
        className={className}
        style={{ color: "oklch(0.55 0.18 240)" }}
      />
    );
  }
  // pdf or other
  return (
    <FileText className={className} style={{ color: "oklch(0.6 0.2 25)" }} />
  );
}

function FileTypeBadge({ filename }: { filename: string }) {
  const type = getFileType(filename);
  const config = {
    pdf: {
      label: "PDF",
      bg: "oklch(0.6 0.2 25 / 0.1)",
      color: "oklch(0.6 0.2 25)",
      border: "oklch(0.6 0.2 25 / 0.25)",
    },
    excel: {
      label: "Excel",
      bg: "oklch(0.6 0.18 145 / 0.1)",
      color: "oklch(0.6 0.18 145)",
      border: "oklch(0.6 0.18 145 / 0.25)",
    },
    word: {
      label: "Word",
      bg: "oklch(0.55 0.18 240 / 0.1)",
      color: "oklch(0.55 0.18 240)",
      border: "oklch(0.55 0.18 240 / 0.25)",
    },
    other: {
      label: "File",
      bg: "oklch(var(--primary) / 0.08)",
      color: "oklch(var(--primary))",
      border: "oklch(var(--primary) / 0.2)",
    },
  }[type];

  return (
    <Badge
      className="text-xs font-heading"
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </Badge>
  );
}

// ─── Guest Lock Screen ─────────────────────────────────────────────────────────

function GuestLockScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: "oklch(var(--primary) / 0.1)",
          border: "1px solid oklch(var(--primary) / 0.25)",
        }}
      >
        <Crown
          className="w-10 h-10"
          style={{ color: "oklch(var(--primary))" }}
        />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">
        Personal Library
      </h2>
      <p className="text-base text-muted-foreground font-heading max-w-sm mb-8">
        Sign in to upload and manage your personal study files (PDF, Excel,
        Word), organised by CA level and subject.
      </p>
      <Button
        onClick={onSignIn}
        className="font-heading font-semibold gap-2 px-6"
        style={{
          background: "oklch(var(--primary))",
          color: "oklch(var(--primary-foreground))",
          boxShadow: "0 4px 18px oklch(var(--primary) / 0.35)",
        }}
        data-ocid="library.signin.button"
      >
        <Crown className="w-4 h-4" />
        Sign In to Access Library
      </Button>
    </motion.div>
  );
}

// ─── Upload Form ───────────────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".docx", ".doc"];

function isAcceptedFile(file: File): boolean {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  return (
    ACCEPTED_MIME_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)
  );
}

function UploadForm({
  onUploaded,
  totalFiles,
  atLimit,
}: {
  onUploaded: () => void;
  totalFiles: number;
  atLimit: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [caLevel, setCaLevel] = useState<CA_Level | "">("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMeta = useAddOrUpdatePDFMetadata();

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    if (!name) {
      // Strip known extensions for display name
      const stripped = selectedFile.name.replace(
        /\.(pdf|xlsx|xls|docx|doc)$/i,
        "",
      );
      setName(stripped);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && isAcceptedFile(dropped)) {
      handleFileChange(dropped);
    } else {
      toast.error("Please drop a PDF, Excel, or Word file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (atLimit) {
      toast.error(
        `Library limit reached (${FILE_LIMIT} files). Delete some files to upload more.`,
      );
      return;
    }

    if (!file || !name.trim() || !subject.trim() || !caLevel) {
      toast.error("Please fill in all fields and select a file");
      return;
    }
    if (uploadProgress !== null || addMeta.isPending) return;

    try {
      setUploadProgress(0);

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const rawBlob = ExternalBlob.fromBytes(bytes);
      const blob = rawBlob.withUploadProgress((pct) => setUploadProgress(pct));

      // Store the original filename (with extension) in the name so we can detect file type later
      const storedName = name.trim().includes(".")
        ? name.trim()
        : `${name.trim()}.${file.name.split(".").pop() ?? ""}`;

      const meta: PDFMetadata = {
        pdfId: nanoid(),
        name: storedName,
        subject: subject.trim(),
        caLevel: caLevel as CA_Level,
        blobKey: blob,
      };

      await addMeta.mutateAsync(meta);

      toast.success("File uploaded successfully!");
      setFile(null);
      setName("");
      setSubject("");
      setCaLevel("");
      onUploaded();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Not connected")) {
        toast.error(
          "Not connected to backend. Please refresh the page and try again.",
        );
      } else if (msg.includes("limit")) {
        toast.error("Storage limit reached.");
      } else if (
        msg.includes("Unauthorized") ||
        msg.includes("Only users") ||
        msg.includes("permission")
      ) {
        toast.error("Permission denied. Please sign out and sign in again.");
      } else {
        toast.error(`Upload failed: ${msg.slice(0, 100)}`);
      }
    } finally {
      setUploadProgress(null);
    }
  };

  const isPending = addMeta.isPending || uploadProgress !== null;

  const usagePct = Math.min((totalFiles / FILE_LIMIT) * 100, 100);
  const isWarning = totalFiles >= Math.floor(FILE_LIMIT * 0.8);
  const counterColor = atLimit
    ? "oklch(var(--destructive))"
    : isWarning
      ? "oklch(0.75 0.18 65)"
      : "oklch(var(--muted-foreground))";

  const fileIcon = file ? getFileType(file.name) : null;

  return (
    <Card
      style={{
        background: "oklch(var(--card))",
        border: "1px solid oklch(var(--border))",
      }}
    >
      <CardContent className="pt-5 pb-5">
        {/* Header row with counter */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "oklch(var(--primary) / 0.1)",
                border: "1px solid oklch(var(--primary) / 0.2)",
              }}
            >
              <Upload
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <h3 className="font-heading font-semibold text-foreground text-sm">
              Upload File
            </h3>
          </div>

          {/* File count pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-heading font-semibold"
            style={{
              background: atLimit
                ? "oklch(var(--destructive) / 0.08)"
                : isWarning
                  ? "oklch(0.75 0.18 65 / 0.1)"
                  : "oklch(var(--muted) / 0.6)",
              border: `1px solid ${
                atLimit
                  ? "oklch(var(--destructive) / 0.25)"
                  : isWarning
                    ? "oklch(0.75 0.18 65 / 0.3)"
                    : "oklch(var(--border))"
              }`,
              color: counterColor,
            }}
          >
            {atLimit && <AlertTriangle className="w-3 h-3" />}
            {totalFiles} / {FILE_LIMIT} Files
          </div>
        </div>

        {/* Capacity progress bar */}
        <div
          className="h-1 rounded-full overflow-hidden mb-4"
          style={{ background: "oklch(var(--muted))" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: atLimit
                ? "oklch(var(--destructive))"
                : isWarning
                  ? "oklch(0.75 0.18 65)"
                  : "oklch(var(--primary))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${usagePct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* At-limit warning banner */}
        {atLimit && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-sm font-heading"
            style={{
              background: "oklch(var(--destructive) / 0.08)",
              border: "1px solid oklch(var(--destructive) / 0.2)",
              color: "oklch(var(--destructive))",
            }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              You've reached the {FILE_LIMIT}-file limit. Delete some files
              below to free up space before uploading new ones.
            </span>
          </motion.div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !atLimit && fileInputRef.current?.click()}
            className={`relative rounded-xl p-6 flex flex-col items-center gap-2 transition-all ${
              atLimit ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            style={{
              border: `2px dashed ${
                atLimit
                  ? "oklch(var(--border))"
                  : isDragging
                    ? "oklch(var(--primary))"
                    : file
                      ? "oklch(var(--primary) / 0.5)"
                      : "oklch(var(--border))"
              }`,
              background: atLimit
                ? "oklch(var(--muted) / 0.2)"
                : isDragging
                  ? "oklch(var(--primary) / 0.05)"
                  : file
                    ? "oklch(var(--primary) / 0.03)"
                    : "oklch(var(--muted) / 0.3)",
            }}
            data-ocid="library.upload.dropzone"
            onKeyDown={(e) => {
              if (!atLimit && (e.key === "Enter" || e.key === " ")) {
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={[
                "application/pdf",
                ".pdf",
                ".xlsx",
                ".xls",
                ".docx",
                ".doc",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
              ].join(",")}
              className="hidden"
              disabled={atLimit}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                {fileIcon === "excel" ? (
                  <FileSpreadsheet
                    className="w-8 h-8"
                    style={{ color: "oklch(0.6 0.18 145)" }}
                  />
                ) : fileIcon === "word" ? (
                  <FileText
                    className="w-8 h-8"
                    style={{ color: "oklch(0.55 0.18 240)" }}
                  />
                ) : (
                  <FileText
                    className="w-8 h-8"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                )}
                <p className="text-sm font-heading font-medium text-foreground text-center truncate max-w-full px-4">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground font-heading">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                </p>
              </>
            ) : (
              <>
                <Upload
                  className="w-8 h-8"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                />
                <p className="text-sm font-heading font-medium text-foreground">
                  {atLimit
                    ? "Upload limit reached"
                    : "Drop file here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground font-heading">
                  {atLimit
                    ? "Delete files to upload more"
                    : "PDF, Excel, Word files"}
                </p>
              </>
            )}
          </div>

          {/* Upload progress */}
          {uploadProgress !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading text-muted-foreground">
                  Uploading…
                </span>
                <span
                  className="text-xs font-heading font-semibold"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "oklch(var(--muted))" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "oklch(var(--primary))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="file-name"
                className="text-xs font-heading text-muted-foreground"
              >
                Display Name
              </Label>
              <Input
                id="file-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Financial Reporting Notes"
                className="h-9 text-sm font-heading"
                disabled={atLimit}
                data-ocid="library.upload.input"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label
                htmlFor="file-subject"
                className="text-xs font-heading text-muted-foreground"
              >
                Subject
              </Label>
              <Input
                id="file-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Financial Reporting"
                className="h-9 text-sm font-heading"
                disabled={atLimit}
              />
            </div>
          </div>

          {/* CA Level */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              CA Level
            </Label>
            <Select
              value={caLevel}
              onValueChange={(v) => setCaLevel(v as CA_Level)}
              disabled={atLimit}
            >
              <SelectTrigger
                className="h-9 text-sm font-heading"
                data-ocid="library.upload.select"
              >
                <SelectValue placeholder="Select CA level" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_KEYS.map((lvl) => (
                  <SelectItem
                    key={lvl}
                    value={lvl}
                    className="font-heading text-sm"
                  >
                    {LEVEL_LABELS[lvl]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={
              atLimit ||
              isPending ||
              !file ||
              !name.trim() ||
              !subject.trim() ||
              !caLevel
            }
            className="w-full font-heading font-semibold gap-2"
            style={{
              background: atLimit
                ? "oklch(var(--muted))"
                : "oklch(var(--primary))",
              color: atLimit
                ? "oklch(var(--muted-foreground))"
                : "oklch(var(--primary-foreground))",
            }}
            data-ocid="library.upload.submit_button"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress !== null && uploadProgress < 100
                  ? `Uploading… ${Math.round(uploadProgress)}%`
                  : "Processing…"}
              </>
            ) : atLimit ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Library Full ({FILE_LIMIT}/{FILE_LIMIT})
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload File
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Edit File Dialog ──────────────────────────────────────────────────────────

interface EditFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdf: PDFMetadata;
  index: number;
}

function EditFileDialog({
  open,
  onOpenChange,
  pdf,
  index,
}: EditFileDialogProps) {
  const [editName, setEditName] = useState(pdf.name);
  const [editSubject, setEditSubject] = useState(pdf.subject);
  const [editLevel, setEditLevel] = useState<CA_Level>(pdf.caLevel);
  const updateMeta = useAddOrUpdatePDFMetadata();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setEditName(pdf.name);
      setEditSubject(pdf.subject);
      setEditLevel(pdf.caLevel);
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!editName.trim() || !editSubject.trim()) {
      toast.error("Name and subject cannot be empty");
      return;
    }
    try {
      await updateMeta.mutateAsync({
        pdfId: pdf.pdfId,
        blobKey: pdf.blobKey,
        name: editName.trim(),
        subject: editSubject.trim(),
        caLevel: editLevel,
      });
      toast.success("File updated successfully!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update file. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
        data-ocid="library.edit.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                background: "oklch(var(--primary) / 0.1)",
                border: "1px solid oklch(var(--primary) / 0.2)",
              }}
            >
              <Pencil
                className="w-3.5 h-3.5"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            Edit File
          </DialogTitle>
          <DialogDescription className="font-heading text-sm text-muted-foreground">
            Rename or re-organise this file by updating its name, subject, or CA
            level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor={`edit-name-${index}`}
              className="text-xs font-heading text-muted-foreground"
            >
              Display Name
            </Label>
            <Input
              id={`edit-name-${index}`}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Financial Reporting Notes"
              className="h-9 text-sm font-heading"
              data-ocid="library.edit.input"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label
              htmlFor={`edit-subject-${index}`}
              className="text-xs font-heading text-muted-foreground"
            >
              Subject / Folder
            </Label>
            <Input
              id={`edit-subject-${index}`}
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              placeholder="e.g. Financial Reporting"
              className="h-9 text-sm font-heading"
            />
          </div>

          {/* CA Level */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              CA Level
            </Label>
            <Select
              value={editLevel}
              onValueChange={(v) => setEditLevel(v as CA_Level)}
            >
              <SelectTrigger
                className="h-9 text-sm font-heading"
                data-ocid="library.edit.select"
              >
                <SelectValue placeholder="Select CA level" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_KEYS.map((lvl) => (
                  <SelectItem
                    key={lvl}
                    value={lvl}
                    className="font-heading text-sm"
                  >
                    {LEVEL_LABELS[lvl]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMeta.isPending}
            className="font-heading font-medium"
            data-ocid="library.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={
              updateMeta.isPending || !editName.trim() || !editSubject.trim()
            }
            className="font-heading font-semibold gap-2"
            style={{
              background: "oklch(var(--primary))",
              color: "oklch(var(--primary-foreground))",
            }}
            data-ocid="library.edit.save_button"
          >
            {updateMeta.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── File Card ─────────────────────────────────────────────────────────────────

interface FileCardProps {
  pdf: PDFMetadata;
  index: number;
  onView: (url: string, name: string) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function FileCard({ pdf, index, onView, onDelete, isDeleting }: FileCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const fileType = getFileType(pdf.name);

  const handleAction = () => {
    const url = pdf.blobKey.getDirectURL();
    if (fileType === "pdf") {
      onView(url, pdf.name);
    } else {
      // Download Excel / Word via programmatic anchor click
      const a = document.createElement("a");
      a.href = url;
      a.download = pdf.name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading ${pdf.name}…`);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.04 }}
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
        data-ocid={`library.file.item.${index + 1}`}
      >
        {/* Icon + Info */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background:
                fileType === "excel"
                  ? "oklch(0.6 0.18 145 / 0.1)"
                  : fileType === "word"
                    ? "oklch(0.55 0.18 240 / 0.1)"
                    : "oklch(var(--primary) / 0.1)",
              border:
                fileType === "excel"
                  ? "1px solid oklch(0.6 0.18 145 / 0.25)"
                  : fileType === "word"
                    ? "1px solid oklch(0.55 0.18 240 / 0.25)"
                    : "1px solid oklch(var(--primary) / 0.2)",
            }}
          >
            <FileTypeIcon filename={pdf.name} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold text-foreground leading-snug truncate">
              {pdf.name}
            </p>
            <p className="text-xs text-muted-foreground font-heading mt-0.5 truncate">
              {pdf.subject}
            </p>
          </div>
        </div>

        {/* Badge */}
        <div>
          <FileTypeBadge filename={pdf.name} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAction}
            className="flex-1 h-8 text-xs font-heading gap-1.5"
            data-ocid={`library.file.button.${index + 1}`}
          >
            {fileType === "pdf" ? (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                View
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Download
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="h-8 w-8 p-0"
            style={{
              color: "oklch(var(--primary))",
              borderColor: "oklch(var(--primary) / 0.3)",
            }}
            title="Edit / Rename file"
            data-ocid={`library.file.edit_button.${index + 1}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            disabled={isDeleting}
            className="h-8 w-8 p-0"
            style={{
              color: "oklch(var(--destructive))",
              borderColor: "oklch(var(--destructive) / 0.3)",
            }}
            title="Delete file"
            data-ocid={`library.file.delete_button.${index + 1}`}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </motion.div>

      <EditFileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        pdf={pdf}
        index={index}
      />
    </>
  );
}

// ─── Level Tab Content ─────────────────────────────────────────────────────────

function LevelFiles({
  level,
  pdfs,
  onView,
  deletingId,
  onDelete,
  searchQuery,
}: {
  level: CA_Level;
  pdfs: PDFMetadata[];
  onView: (url: string, name: string) => void;
  deletingId: string | null;
  onDelete: (pdfId: string) => void;
  searchQuery: string;
}) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = pdfs.filter(
    (p) =>
      p.caLevel === level &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q)),
  );

  if (filtered.length === 0) {
    return (
      <div
        className="text-center py-14 rounded-xl"
        style={{
          background: "oklch(var(--card))",
          border: "1px dashed oklch(var(--border))",
        }}
        data-ocid="library.file.empty_state"
      >
        <BookOpen
          className="w-12 h-12 mx-auto mb-3"
          style={{ color: "oklch(var(--muted-foreground))" }}
        />
        <p className="text-base font-heading font-semibold text-foreground">
          {q ? "No files match your search" : "No files uploaded yet"}
        </p>
        <p className="text-sm text-muted-foreground font-heading mt-1">
          {q
            ? "Try a different name or subject"
            : `Upload a file for ${LEVEL_LABELS[level]} above to get started`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {filtered.map((pdf, i) => (
        <FileCard
          key={pdf.pdfId}
          pdf={pdf}
          index={i}
          onView={onView}
          onDelete={() => onDelete(pdf.pdfId)}
          isDeleting={deletingId === pdf.pdfId}
        />
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LibraryPage() {
  const { identity, login } = useInternetIdentity();
  const { data: pdfs = [], isLoading } = usePDFMetadata();
  const removeMeta = useRemovePDFMetadata();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const totalFiles = pdfs.length;
  const atLimit = totalFiles >= FILE_LIMIT;

  // Guest state
  if (!identity) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <GuestLockScreen onSignIn={() => void login()} />
      </div>
    );
  }

  const handleDelete = async (pdfId: string) => {
    setDeletingId(pdfId);
    try {
      await removeMeta.mutateAsync(pdfId);
      toast.success("File removed");
    } catch {
      toast.error("Failed to remove file");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (url: string, title: string) => {
    setViewerUrl(url);
    setViewerTitle(title);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(var(--primary) / 0.1)",
              border: "1px solid oklch(var(--primary) / 0.25)",
            }}
          >
            <BookOpen
              className="w-5 h-5"
              style={{ color: "oklch(var(--primary))" }}
            />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Personal Library
            </h2>
            <p className="text-sm text-muted-foreground font-heading mt-0.5">
              Upload and organise your personal study files (PDF, Excel, Word) ·{" "}
              {totalFiles} / {FILE_LIMIT} used
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <UploadForm
          onUploaded={() => {}}
          totalFiles={totalFiles}
          atLimit={atLimit}
        />

        {/* File Grid by Level */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="font-heading font-semibold text-foreground">
              Your Files
            </h3>
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or subject…"
                className="pl-9 h-9 text-sm font-heading"
                data-ocid="library.search.input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                  data-ocid="library.search.secondary_button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              data-ocid="library.file.loading_state"
            >
              {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
                <Skeleton key={k} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue={CA_Level.foundation} className="w-full">
              <TabsList className="font-heading" data-ocid="library.level.tab">
                {LEVEL_KEYS.map((lvl) => (
                  <TabsTrigger
                    key={lvl}
                    value={lvl}
                    className="text-xs sm:text-sm"
                  >
                    {LEVEL_LABELS[lvl]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {LEVEL_KEYS.map((lvl) => (
                <TabsContent key={lvl} value={lvl} className="mt-5">
                  <LevelFiles
                    level={lvl}
                    pdfs={pdfs}
                    onView={handleView}
                    deletingId={deletingId}
                    onDelete={(id) => void handleDelete(id)}
                    searchQuery={searchQuery}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </motion.div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "oklch(0 0 0 / 0.88)" }}
            data-ocid="library.viewer.modal"
          >
            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: "oklch(var(--card))",
                borderBottom: "1px solid oklch(var(--border))",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "oklch(var(--primary))" }}
                />
                <h3 className="font-heading font-semibold text-foreground truncate max-w-xs md:max-w-lg">
                  {viewerTitle}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewerUrl(null)}
                className="w-9 h-9 flex-shrink-0"
                data-ocid="library.viewer.close_button"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                key={viewerUrl}
                src={viewerUrl}
                title={viewerTitle}
                className="w-full h-full border-0"
                style={{ background: "white" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
