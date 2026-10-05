import { useEffect, useState } from 'react';
import {
  Upload, Eye, Download, Trash2, Lock, FileText, Image as ImageIcon, FolderOpen, History, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentService } from '../../services/documentService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const emptyForm = { title: '', docType: '', relatedLabel: '', notes: '' };

const formatSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Documents() {
  const { user } = useAuth();
  const [types, setTypes] = useState([]);
  const [canDelete, setCanDelete] = useState(false);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // { doc, url }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [accessLog, setAccessLog] = useState(null); // { doc, logs }

  const canSeeAccessLog = ['hotel_manager', 'super_admin'].includes(user?.role);
  const typeLabel = (key) => types.find((t) => t.key === key)?.label || key;

  const load = (q = search) => {
    setLoading(true);
    documentService.list({ docType: filterType || undefined, search: q || undefined })
      .then((res) => setDocs(res.data.data))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    documentService.getTypes().then((res) => {
      setTypes(res.data.data.types);
      setCanDelete(res.data.data.canDelete);
      setForm((f) => ({ ...f, docType: res.data.data.types[0]?.key || '' }));
    });
  }, []);

  useEffect(load, [filterType]);

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { toast.error('Only JPG, PNG, WEBP or PDF files are allowed'); e.target.value = ''; return; }
    if (f.size > MAX_SIZE) { toast.error('File is too large (max 5 MB)'); e.target.value = ''; return; }
    setFile(f);
    if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a file first');
    setUploading(true);
    try {
      const fd = new FormData();
      // Text fields first, file last
      fd.append('title', form.title);
      fd.append('docType', form.docType);
      if (form.relatedLabel) fd.append('relatedLabel', form.relatedLabel);
      if (form.notes) fd.append('notes', form.notes);
      fd.append('file', file);

      await documentService.upload(fd);
      toast.success('Document uploaded');
      setShowUpload(false);
      setFile(null);
      setForm({ ...emptyForm, docType: types[0]?.key || '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (doc) => {
    try {
      const res = await documentService.getFile(doc._id, false);
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
      setPreview({ doc, url });
    } catch {
      toast.error('You do not have permission to open this document');
    }
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const handleDownload = async (doc) => {
    try {
      const res = await documentService.getFile(doc._id, true);
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async () => {
    try {
      await documentService.remove(deleteTarget);
      toast.success('Document deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openAccessLog = async (doc) => {
    try {
      const res = await documentService.getAccessLog(doc._id);
      setAccessLog({ doc, logs: res.data.data });
    } catch {
      toast.error('Failed to load access history');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1 flex items-center gap-2"><FolderOpen className="text-gold" size={24} /> Documents</h1>
          <p className="text-text-secondary text-sm">Secure storage. Identity documents are restricted and every access is logged.</p>
        </div>
        <Button variant="gold" onClick={() => setShowUpload(true)} className="flex items-center gap-2 shrink-0"><Upload size={18} /> Upload Document</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5 md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterType ? 'bg-navy text-white' : 'bg-black/5 dark:bg-white/5'}`}>All</button>
          {types.map((t) => (
            <button key={t.key} onClick={() => setFilterType(t.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${filterType === t.key ? 'bg-navy text-white' : 'bg-black/5 dark:bg-white/5'}`}>
              {t.sensitive && <Lock size={11} />} {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="w-full md:w-72">
          <Input placeholder="Search title or name..." icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents found" message="Upload a document to get started." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d, i) => (
            <div
              key={d._id}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className="group bg-white dark:bg-darkCard border border-border dark:border-darkBorder rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold to-goldLight flex items-center justify-center text-navy shrink-0">
                  {d.mimeType === 'application/pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{d.title}</p>
                  <p className="text-xs text-text-secondary truncate">{d.fileName}</p>
                </div>
                {d.isSensitive && (
                  <span title="Restricted: all access is logged" className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-danger/10 text-danger font-medium shrink-0">
                    <Lock size={10} /> Restricted
                  </span>
                )}
              </div>

              <div className="text-xs text-text-secondary space-y-0.5 mb-4">
                <p><span className="font-medium text-navy dark:text-white">{typeLabel(d.docType)}</span>{d.relatedLabel ? ` · ${d.relatedLabel}` : ''}</p>
                <p>Uploaded {new Date(d.createdAt).toLocaleDateString()} by {d.uploadedBy?.firstName} {d.uploadedBy?.lastName}</p>
                <p>{formatSize(d.size)}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="!px-3 !py-1.5 text-xs flex items-center gap-1 flex-1 justify-center" onClick={() => openPreview(d)}><Eye size={14} /> Preview</Button>
                <button onClick={() => handleDownload(d)} className="p-2 rounded-lg border border-border dark:border-darkBorder hover:border-gold transition" title="Download"><Download size={15} /></button>
                {canSeeAccessLog && d.isSensitive && (
                  <button onClick={() => openAccessLog(d)} className="p-2 rounded-lg border border-border dark:border-darkBorder hover:border-gold transition" title="Access history"><History size={15} /></button>
                )}
                {canDelete && (
                  <button onClick={() => setDeleteTarget(d._id)} className="p-2 rounded-lg border border-border dark:border-darkBorder text-danger hover:bg-danger/10 transition" title="Delete"><Trash2 size={15} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
        <form onSubmit={handleUpload} className="space-y-3">
          <select value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            {types.map((t) => <option key={t.key} value={t.key}>{t.label}{t.sensitive ? ' (restricted)' : ''}</option>)}
          </select>
          <Input placeholder="Document title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input placeholder="Related to (e.g. Guest: Priya Sharma, Supplier: FreshFarm)" value={form.relatedLabel} onChange={(e) => setForm({ ...form, relatedLabel: e.target.value })} />
          <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <label className="block border-2 border-dashed border-border dark:border-darkBorder hover:border-gold rounded-xl p-6 text-center cursor-pointer transition">
            <Upload className="mx-auto text-gold mb-2" size={22} />
            <p className="text-sm font-medium">{file ? file.name : 'Click to choose a file'}</p>
            <p className="text-xs text-text-secondary mt-1">JPG, PNG, WEBP or PDF · max 5 MB</p>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={pickFile} className="hidden" />
          </label>

          {types.find((t) => t.key === form.docType)?.sensitive && (
            <p className="text-xs text-danger flex items-center gap-1"><Lock size={12} /> This is a restricted document type. Access will be limited and logged.</p>
          )}

          <Button variant="gold" className="w-full" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
        </form>
      </Modal>

      <Modal open={!!preview} onClose={closePreview} title={preview?.doc.title || 'Preview'} size="lg">
        {preview && (
          preview.doc.mimeType === 'application/pdf' ? (
            <iframe src={preview.url} title={preview.doc.title} className="w-full h-[65vh] rounded-lg border border-border dark:border-darkBorder" />
          ) : (
            <img src={preview.url} alt={preview.doc.title} className="max-h-[65vh] mx-auto rounded-lg" />
          )
        )}
      </Modal>

      <Modal open={!!accessLog} onClose={() => setAccessLog(null)} title={`Access History: ${accessLog?.doc.title || ''}`} size="lg">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {accessLog?.logs.length === 0 && <p className="text-sm text-text-secondary">No access recorded yet.</p>}
          {accessLog?.logs.map((l) => (
            <div key={l._id} className="flex justify-between gap-3 text-sm border-b border-border dark:border-darkBorder pb-2">
              <div>
                <p className="font-medium">{l.userName} <span className="text-xs text-text-secondary capitalize">({l.userRole?.replace(/_/g, ' ')})</span></p>
                <p className="text-xs text-text-secondary">{l.action.replace(/_/g, ' ')} · IP {l.ipAddress || '—'}</p>
              </div>
              <span className="text-xs text-text-secondary shrink-0">{new Date(l.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this document?"
        message="The file will be permanently removed. This deletion is recorded in the audit log."
      />
    </div>
  );
}
