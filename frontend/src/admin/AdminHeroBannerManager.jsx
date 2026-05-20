import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2, UploadCloud, AlertCircle, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import api, { getHeroSlidesAdmin, deleteHeroSlide } from "../services/api";

const MAX_PREVIEW_COUNT = 10;

const AdminHeroBannerManager = () => {
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const previewItems = useMemo(
    () =>
      selectedFiles.slice(0, MAX_PREVIEW_COUNT).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previewItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewItems]);

  const fetchHeroImages = async () => {
    try {
      setLoading(true);
      const slides = await getHeroSlidesAdmin();
      const images = (Array.isArray(slides) ? slides : []).map((slide) => ({
        _id: slide._id,
        id: slide._id,
        url: slide.image,
        title: slide.title || "",
        order: Number(slide.order || 0)
      }));
      setImages(images);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to load hero images" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    setSelectedFiles(files);

    if (files.length === 0) {
      setStatus({ type: "error", message: "Please select valid image files." });
      return;
    }

    setStatus({ type: "", message: "" });
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      setStatus({ type: "error", message: "Select one or more images before uploading." });
      return;
    }

    try {
      setUploading(true);
      for (const file of selectedFiles) {
        const imageFormData = new FormData();
        imageFormData.append("image", file);
        await api.post("/api/hero-slides", imageFormData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      await fetchHeroImages();
      setSelectedFiles([]);
      setStatus({ type: "success", message: "Hero images uploaded successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to upload hero images" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      setDeletingId(imageId);
      await deleteHeroSlide(imageId);
      await fetchHeroImages();
      setStatus({ type: "success", message: "Hero image deleted." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to delete image" });
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-10 page-enter">
      {/* ── HEADER ── */}
      <div className="section-title">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-strong)] text-[var(--burgundy)] text-[10px] font-medium uppercase tracking-widest mb-3">
          <Sparkles size={12} /> Visual Experience
        </div>
        <h2 className="serif">Hero Banner Manager</h2>
        <p>Upload and manage homepage slider images to showcase Mithai World.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── UPLOAD BOX ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-[var(--surface-border)] p-6 shadow-sm">
            <label className="w-full cursor-pointer border-2 border-dashed border-[var(--surface-border)] hover:border-[var(--gold)] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-[var(--cream)]/30 transition-all group">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-[var(--surface-border)] group-hover:scale-110 transition-transform">
                <ImagePlus size={24} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--charcoal)]">Select Banner Images</p>
              <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">Multi-upload (max 10)</p>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
            </label>

            {previewItems.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-widest">Selected ({previewItems.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {previewItems.map((item, idx) => (
                    <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-[var(--surface-border)] bg-gray-50">
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="w-full btn-primary h-12"
              >
                {uploading ? <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</> : <><UploadCloud size={16} /> Upload Now</>}
              </button>

              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  disabled={uploading}
                  className="w-full btn-outline h-12"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {status.message && (
              <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                {status.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{status.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── LIVE PREVIEW GRID ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="serif text-xl font-medium text-[var(--charcoal)]">Current Slideshow</h3>
            <span className="text-[10px] font-medium text-[var(--muted)] bg-[var(--surface-strong)] px-3 py-1 rounded-full uppercase tracking-widest border border-[var(--surface-border)]">
              {images.length} Active Slides
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2].map(i => <div key={i} className="aspect-video bg-white rounded-3xl border border-[var(--surface-border)]" />)}
            </div>
          ) : images.length === 0 ? (
            <div className="py-20 text-center rounded-3xl border-2 border-dashed border-[var(--surface-border)] bg-white">
              <XCircle size={32} className="text-[var(--muted)] mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">No custom slides yet</p>
              <p className="text-xs text-[var(--muted)]/60 mt-1">Fallback system slides will be used on storefront.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {images.map((image) => {
                const imageId = image._id || image.id;
                return (
                  <div key={imageId} className="group relative aspect-video rounded-3xl border border-[var(--surface-border)] overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500">
                    <img src={image.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <button
                      type="button"
                      onClick={() => handleDelete(imageId)}
                      disabled={deletingId === imageId}
                      className="absolute bottom-4 right-4 h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md text-rose-600 flex items-center justify-center shadow-lg transform translate-y-12 group-hover:translate-y-0 transition-all duration-300 hover:bg-rose-600 hover:text-white"
                    >
                      {deletingId === imageId ? <div className="h-4 w-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={18} />}
                    </button>
                    
                    <div className="absolute top-4 left-4 h-6 px-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[9px] font-medium uppercase tracking-widest flex items-center">
                      Slide Order: {image.order}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHeroBannerManager;
