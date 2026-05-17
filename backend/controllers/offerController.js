import Offer from "../models/Offer.js";

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return Boolean(value);
};

const normalizeOffer = (offer) => {
  if (!offer) return offer;

  const plain = typeof offer.toObject === "function" ? offer.toObject() : { ...offer };
  const isActive = normalizeBoolean(plain.isActive, plain.active !== undefined ? normalizeBoolean(plain.active, true) : true);

  return {
    ...plain,
    id: plain._id || plain.id,
    isActive,
    active: isActive,
    discountPercent: Number(plain.discount_percentage || 0),
    offerType: plain.offer_type || "banner",
    targetProduct: plain.linked_product_id || "",
    targetCategory: plain.linked_category_id || ""
  };
};

export const getOffers = async (_req, res, next) => {
  try {
    const offers = await Offer.find().sort({ priority: -1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      offers: offers.map(normalizeOffer)
    });
  } catch (error) {
    return next(error);
  }
};

export const createOffer = async (req, res, next) => {
  try {
    const {
      title,
      description = "",
      image = "",
      discount_percentage = 0,
      offer_type = "banner",
      linked_product_id = "",
      linked_category_id = "",
      priority = 0,
      isActive,
      active
    } = req.body || {};

    if (!String(title || "").trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const offer = await Offer.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      image: String(image || "").trim(),
      discount_percentage: Math.max(0, Math.min(100, Number(discount_percentage) || 0)),
      offer_type,
      linked_product_id: linked_product_id || "",
      linked_category_id: linked_category_id || "",
      priority: Number(priority || 0),
      isActive: normalizeBoolean(isActive, active !== undefined ? normalizeBoolean(active, true) : true)
    });

    console.log("[Offer] created", { offerId: offer._id?.toString(), isActive: offer.isActive });

    return res.status(201).json({
      success: true,
      offer: normalizeOffer(offer)
    });
  } catch (error) {
    return next(error);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Offer.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    const updates = {};
    const body = req.body || {};

    if (body.title !== undefined) updates.title = String(body.title || "").trim();
    if (body.description !== undefined) updates.description = String(body.description || "").trim();
    if (body.image !== undefined) updates.image = String(body.image || "").trim();
    if (body.discount_percentage !== undefined) updates.discount_percentage = Math.max(0, Math.min(100, Number(body.discount_percentage) || 0));
    if (body.offer_type !== undefined) updates.offer_type = body.offer_type;
    if (body.linked_product_id !== undefined) updates.linked_product_id = body.linked_product_id || "";
    if (body.linked_category_id !== undefined) updates.linked_category_id = body.linked_category_id || "";
    if (body.priority !== undefined) updates.priority = Number(body.priority || 0);
    if (body.isActive !== undefined || body.active !== undefined) {
      updates.isActive = normalizeBoolean(body.isActive, normalizeBoolean(body.active, existing.isActive));
    }

    console.log("[Offer] update request", { offerId: id, updates });

    const updated = await Offer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    console.log("[Offer] update result", { offerId: id, isActive: updated?.isActive });

    return res.status(200).json({
      success: true,
      offer: normalizeOffer(updated)
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Offer.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    return res.status(200).json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const toggleOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Offer.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    const nextActive = !normalizeBoolean(existing.isActive, true);
    console.log("[Offer] toggle click", { offerId: id, current: existing.isActive, nextActive });

    const updated = await Offer.findByIdAndUpdate(
      id,
      { isActive: nextActive },
      { new: true, runValidators: true }
    );

    console.log("[Offer] toggle result", { offerId: id, isActive: updated?.isActive });

    return res.status(200).json({
      success: true,
      offer: normalizeOffer(updated)
    });
  } catch (error) {
    return next(error);
  }
};