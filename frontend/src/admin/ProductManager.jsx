import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../services/api";

export default function ProductManager({ products, setProducts, initialLoading, setDashboardError, showAdminNotice }) {
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "", stock: "" });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");

  useEffect(() => {
    if (!productImageFile) {
      setProductImagePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(productImageFile);
    setProductImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [productImageFile]);

  const addProduct = async () => {
    const priceValue = Number(newProduct.price);
    const stockValue = newProduct.stock === "" ? 0 : Number(newProduct.stock);

    if (!newProduct.name || !newProduct.category || Number.isNaN(priceValue) || priceValue <= 0) {
      setDashboardError("Enter valid product name, category, and price before saving.");
      return;
    }

    try {
      setSavingProduct(true);
      setDashboardError("");
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("price", String(priceValue));
      formData.append("category", newProduct.category);
      formData.append("stock", String(Number.isNaN(stockValue) ? 0 : stockValue));
      if (productImageFile) {
        formData.append("image", productImageFile);
      }

      const response = await api.post("/products", formData);
      const created = response?.data?.product || response?.data;
      if (created) {
        setProducts((prev) => [...prev, created]);
      }
      showAdminNotice("Product saved successfully");
    } catch (error) {
      setDashboardError(getApiErrorMessage(error, "Failed to save product."));
    } finally {
      setSavingProduct(false);
      if (!showAddModal) {
        return;
      }
      setShowAddModal(false);
      setNewProduct({ name: "", price: "", category: "", stock: "" });
      setProductImageFile(null);
    }
  };

  const deleteProduct = async (id) => {
    if (deletingProductId) {
      return;
    }

    try {
      setDeletingProductId(id);
      setDashboardError("");
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((x) => x._id !== id));
      showAdminNotice("Product deleted");
    } catch (error) {
      setDashboardError(getApiErrorMessage(error, "Failed to delete product."));
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 className="serif" style={{ fontSize: 24, color: "white" }}>Product Management</h2>
        <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ fontSize: 11, padding: "10px 20px" }}>+ Add Product</button>
      </div>
      {showAddModal && (
        <div style={{ background: "rgba(244,160,36,0.06)", border: "1px solid rgba(244,160,36,0.2)", padding: 24, marginBottom: 20 }}>
          <h3 className="serif" style={{ color: "var(--saffron)", marginBottom: 16 }}>New Product</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {["name", "price", "category", "stock"].map((f) => (
              <div key={f}>
                <label style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f}</label>
                <input className="input-field" placeholder={f} value={newProduct[f]} onChange={(e) => setNewProduct({ ...newProduct, [f]: e.target.value })} style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(244,160,36,0.2)", color: "white" }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
              style={{ width: "100%", color: "white" }}
            />
          </div>
          {productImagePreview && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <img
                src={productImagePreview}
                alt="Selected product preview"
                style={{ width: 84, height: 84, objectFit: "cover", border: "1px solid rgba(244,160,36,0.2)" }}
              />
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>Image preview</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn-primary" disabled={savingProduct} onClick={addProduct}>{savingProduct ? "Saving..." : "Save"}</button>
            <button className="btn-outline" disabled={savingProduct} onClick={() => {
              setShowAddModal(false);
              setNewProduct({ name: "", price: "", category: "", stock: "" });
              setProductImageFile(null);
            }} style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", opacity: savingProduct ? 0.65 : 1, cursor: savingProduct ? "not-allowed" : "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      {initialLoading && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 12 }}>Loading products...</div>}
      <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "white", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(244,160,36,0.15)" }}>
              {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: 2, color: "var(--saffron)", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p._id}
                style={{ borderBottom: "1px solid rgba(244,160,36,0.07)", transition: "background 0.2s" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(244,160,36,0.04)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: "cover" }} />
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                </td>
                <td style={{ padding: "14px 16px" }}><span className="badge" style={{ background: "rgba(244,160,36,0.12)", color: "var(--saffron)" }}>{p.category}</span></td>
                <td style={{ padding: "14px 16px", fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "var(--saffron)" }}>₹{p.price}</td>
                <td style={{ padding: "14px 16px", color: p.stock < 15 ? "#F4A024" : "rgba(255,255,255,0.6)" }}>{p.stock}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span className="badge" style={{ background: p.stock > 0 ? "rgba(44,110,73,0.2)" : "rgba(139,26,26,0.2)", color: p.stock > 0 ? "#6ACEA0" : "#E87070" }}>
                    {p.stock > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button disabled={deletingProductId === p._id} onClick={() => deleteProduct(p._id)} style={{ background: "none", border: "1px solid rgba(232,112,112,0.3)", color: "#E87070", padding: "5px 14px", fontSize: 11, cursor: deletingProductId === p._id ? "not-allowed" : "pointer", opacity: deletingProductId === p._id ? 0.7 : 1, fontFamily: "DM Sans, sans-serif" }}>{deletingProductId === p._id ? "Deleting..." : "Delete"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
