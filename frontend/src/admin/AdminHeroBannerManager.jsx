import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2, UploadCloud, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../utils/api";

const MAX_PREVIEW_COUNT = 10;

const AdminHeroBannerManager = () => {
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const token = localStorage.getItem("token");

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
      const data = await api.get("/api/hero");
      setImages(Array.isArray(data.images) ? data.images : []);
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

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("images", file));

    try {
      setUploading(true);
      const data = await api.upload("/api/hero/add", formData, token);
      setImages(Array.isArray(data.images) ? data.images : []);
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
      const data = await api.delete(`/api/hero/${imageId}`, token);
      setImages(Array.isArray(data.images) ? data.images : []);
      setStatus({ type: "success", message: "Hero image deleted." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to delete image" });
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2d1b14] tracking-tight">Hero Banner Manager</h2>
        <p className="text-sm font-medium text-[#6d4c41] mt-1">
          Upload and manage homepage slider images.
        </p>
      </div>

      <div className="bg-[#fff8ec] rounded-3xl border border-[#e0c3a3] shadow-sm p-5 sm:p-6">
        <label className="w-full cursor-pointer border-2 border-dashed border-[#e0c3a3] hover:border-[#e8883a] rounded-2xl p-7 flex flex-col items-center justify-center gap-2 bg-[#fff8ec] transition-colors">
          <ImagePlus className="w-6 h-6 text-[#6d4c41]" />
          <p className="text-sm font-bold text-[#2d1b14]">Select Hero Banner Images</p>
          <p className="text-xs font-medium text-[#6d4c41]">You can upload multiple files at once (max 10).</p>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>

        {previewItems.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-bold text-[#2d1b14] mb-3">Preview ({previewItems.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {previewItems.map((item) => (
                <div key={`${item.name}-${item.url}`} className="rounded-xl overflow-hidden border border-[#e0c3a3] bg-[#fff8ec]">
                  <img src={item.url} alt={item.name} className="w-full h-28 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#e8883a] text-white hover:bg-[#d97706] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Selected Images"}
          </button>

          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl text-sm font-bold border border-[#e0c3a3] text-[#6d4c41] hover:bg-[#fff8ec] transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>

        {status.message && (
          <div
            className={`mt-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{status.message}</span>
          </div>
        )}
      </div>

      <div className="bg-[#fff8ec] rounded-3xl border border-[#e0c3a3] shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-[#2d1b14]">Uploaded Hero Images</h3>
          <span className="text-xs font-bold text-[#6d4c41] bg-[#fff8ec] px-2.5 py-1 rounded-full border border-[#e0c3a3]">
            {images.length} total
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-[#6d4c41]">Loading hero images...</p>
        ) : images.length === 0 ? (
          <div className="text-sm text-[#6d4c41] border border-dashed border-[#e0c3a3] rounded-xl p-5 flex items-center gap-2 bg-[#fff8ec]">
            <XCircle className="w-4 h-4" />
            No hero images uploaded yet. Slider fallback will be used on homepage.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => {
              const imageId = image._id || image.id;
              return (
                <div key={imageId} className="rounded-2xl border border-[#e0c3a3] overflow-hidden bg-[#fff8ec]">
                  <img src={image.url} alt="Hero banner" className="w-full h-44 object-cover" />
                  <div className="p-3 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(imageId)}
                      disabled={deletingId === imageId}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === imageId ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeroBannerManager;



