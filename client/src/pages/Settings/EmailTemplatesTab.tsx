import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useEmailTemplates,
  useEmailTemplateMutations,
  applyTemplate,
  TEMPLATE_MERGE_FIELDS,
  TEMPLATE_TYPE_LABELS,
  type EmailTemplate,
} from "@/hooks/useEmailTemplates";

const TEMPLATE_TYPES = ["presentation", "quote", "sales_order", "purchase_order", "proof", "invoice", "shipping_notification"] as const;

const SAMPLE_DATA: Record<string, string> = {
  companyName: "Liquid Screen Design",
  senderName: "John Smith",
  recipientName: "Jane Doe",
  recipientFirstName: "Jane",
  orderNumber: "PRJ-1234",
  invoiceNumber: "INV-0056",
  totalAmount: "$2,450.00",
  dueDate: "May 15, 2026",
  vendorName: "SanMar",
  vendorContactName: "Bob Wilson",
  poNumber: "PO-0078",
  supplierInHandsDate: "May 10, 2026",
  artworkList: "  - T-Shirt Front (Screen Print)\n  - Hat Logo (Embroidery)",
  productNames: "Custom T-Shirts",
  carrier: "UPS",
  method: "Ground",
  trackingNumber: "1Z999AA10123456784",
  trackingUrl: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
  csrName: "Karen Woznak",
};

export function EmailTemplatesTab() {
  const { toast } = useToast();
  const { data: templates = [], isLoading } = useEmailTemplates();
  const { createMutation, updateMutation, deleteMutation, setDefaultMutation } = useEmailTemplateMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(TEMPLATE_TYPES));
  const [editForm, setEditForm] = useState<Partial<EmailTemplate> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const selected = selectedId ? templates.find((t) => t.id === selectedId) : null;

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const selectTemplate = (t: EmailTemplate) => {
    setSelectedId(t.id);
    setEditForm({ name: t.name, subject: t.subject, body: t.body, isDefault: t.isDefault, isActive: t.isActive });
    setIsNew(false);
    setShowPreview(false);
  };

  const startNew = (type: string) => {
    setSelectedId(null);
    setEditForm({ templateType: type, name: "", subject: "", body: "", isDefault: false, isActive: true });
    setIsNew(true);
    setShowPreview(false);
  };

  const insertMergeField = (key: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editForm?.body || "";
    const insertion = `{{${key}}}`;
    const newText = text.substring(0, start) + insertion + text.substring(end);
    setEditForm((prev) => prev ? { ...prev, body: newText } : prev);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };

  const handleSave = () => {
    if (!editForm?.name || !editForm?.subject || !editForm?.body) {
      toast({ title: "Missing fields", description: "Name, subject, and body are required.", variant: "destructive" });
      return;
    }

    if (isNew) {
      createMutation.mutate(editForm, {
        onSuccess: (created: EmailTemplate) => {
          toast({ title: "Template created" });
          setSelectedId(created.id);
          setIsNew(false);
          setEditForm({ name: created.name, subject: created.subject, body: created.body, isDefault: created.isDefault, isActive: created.isActive });
        },
      });
    } else if (selectedId) {
      updateMutation.mutate({ id: selectedId, ...editForm }, {
        onSuccess: () => toast({ title: "Template updated" }),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteMutation.mutate(deleteConfirm, {
      onSuccess: () => {
        toast({ title: "Template deleted" });
        if (selectedId === deleteConfirm) {
          setSelectedId(null);
          setEditForm(null);
        }
        setDeleteConfirm(null);
      },
    });
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Default template updated" });
        setEditForm((prev) => prev ? { ...prev, isDefault: true } : prev);
      },
    });
  };

  const currentType = isNew ? editForm?.templateType : selected?.templateType;
  const mergeFields = currentType ? TEMPLATE_MERGE_FIELDS[currentType] || [] : [];

  const preview = editForm ? applyTemplate(
    { subject: editForm.subject || "", body: editForm.body || "" },
    SAMPLE_DATA
  ) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Left sidebar — template list */}
      <div className="w-72 flex-shrink-0 border rounded-lg overflow-y-auto max-h-[700px]">
        <div className="p-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Email Templates</h3>
        </div>
        <div className="divide-y">
          {TEMPLATE_TYPES.map((type) => {
            const typeTemplates = templates.filter((t) => t.templateType === type);
            const isExpanded = expandedTypes.has(type);

            return (
              <div key={type}>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                  onClick={() => toggleType(type)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span className="text-sm font-medium">{TEMPLATE_TYPE_LABELS[type]}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{typeTemplates.length}</Badge>
                  </div>
                </button>
                {isExpanded && (
                  <div className="pl-4 pb-1">
                    {typeTemplates.map((t) => (
                      <button
                        key={t.id}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm rounded-md mx-1 ${selectedId === t.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        onClick={() => selectTemplate(t)}
                      >
                        {t.isDefault && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-blue-600 hover:bg-blue-50 rounded-md mx-1"
                      onClick={() => startNew(type)}
                    >
                      <Plus className="w-3 h-3" /> Add Template
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — edit form */}
      <div className="flex-1 min-w-0">
        {!editForm ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-sm">Select a template or create a new one</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{isNew ? "New Template" : "Edit Template"}</span>
                {currentType && (
                  <Badge variant="outline">{TEMPLATE_TYPE_LABELS[currentType]}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-name">Template Name</Label>
                  <Input
                    id="tpl-name"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                    placeholder="e.g. Standard Quote"
                  />
                </div>
                <div className="flex items-end gap-4">
                  {!isNew && selectedId && !editForm.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault(selectedId)}>
                      <Star className="w-3.5 h-3.5 mr-1.5" /> Set as Default
                    </Button>
                  )}
                  {editForm.isDefault && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 h-8 px-3">
                      <Star className="w-3 h-3 mr-1.5 fill-amber-500" /> Default
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-subject">Subject</Label>
                <Input
                  id="tpl-subject"
                  value={editForm.subject || ""}
                  onChange={(e) => setEditForm((prev) => prev ? { ...prev, subject: e.target.value } : prev)}
                  placeholder="e.g. Quote #{{orderNumber}} from {{companyName}}"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tpl-body">Body</Label>
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Edit" : "Preview"}
                  </button>
                </div>
                {showPreview ? (
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] whitespace-pre-wrap text-sm">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Subject: {preview?.subject}</p>
                    <hr className="mb-2" />
                    {preview?.body}
                  </div>
                ) : (
                  <Textarea
                    ref={bodyRef}
                    id="tpl-body"
                    value={editForm.body || ""}
                    onChange={(e) => setEditForm((prev) => prev ? { ...prev, body: e.target.value } : prev)}
                    rows={10}
                    placeholder="Hi {{recipientFirstName}},\n\nPlease find..."
                    className="text-sm"
                  />
                )}
              </div>

              {/* Merge field chips */}
              {mergeFields.length > 0 && !showPreview && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Insert merge field (click to add at cursor)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {mergeFields.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        onClick={() => insertMergeField(f.key)}
                      >
                        {`{{${f.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                Approval links, PDF attachments, and proof thumbnails are added automatically by each dialog.
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    size="sm"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1.5" />
                    )}
                    {isNew ? "Create" : "Save"}
                  </Button>
                  {!isNew && selectedId && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editForm.isActive !== false}
                        onCheckedChange={(checked) => setEditForm((prev) => prev ? { ...prev, isActive: checked } : prev)}
                        id="tpl-active"
                      />
                      <Label htmlFor="tpl-active" className="text-xs cursor-pointer">Active</Label>
                    </div>
                  )}
                </div>
                {!isNew && selectedId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteConfirm(selectedId)}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
