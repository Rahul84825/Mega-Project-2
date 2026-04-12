const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${BASE_URL}${path}`;
  }

  return `${BASE_URL}/${path}`;
};

const resolveToken = (tokenOverride) => {
  if (tokenOverride) {
    return tokenOverride;
  }

  const legacyToken = localStorage.getItem("token");
  if (legacyToken) {
    return legacyToken;
  }

  try {
    const auth = JSON.parse(localStorage.getItem("mithai-world-auth") || "null");
    return auth?.token || "";
  } catch (_error) {
    return "";
  }
};

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { message: text };
  }
};

const request = async (method, path, body, tokenOverride, extraHeaders = {}) => {
  const token = resolveToken(tokenOverride);
  const isFormData = body instanceof FormData;

  const headers = {
    ...extraHeaders
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const mapHeroSlidesToImages = (slides) =>
  (Array.isArray(slides) ? slides : [])
    .filter((slide) => Boolean(slide?.image))
    .map((slide) => ({
      _id: slide._id,
      id: slide._id,
      url: slide.image,
      title: slide.title || "",
      order: Number(slide.order || 0)
    }));

export const api = {
  get: async (path, token) => {
    if (path === "/api/hero") {
      const data = await request("GET", "/api/hero-slides/admin", undefined, token);
      return {
        images: mapHeroSlidesToImages(data?.slides)
      };
    }

    return request("GET", path, undefined, token);
  },

  post: (path, payload, token) => request("POST", path, payload, token),

  put: (path, payload, token) => request("PUT", path, payload, token),

  patch: (path, payload, token) => request("PATCH", path, payload, token),

  delete: async (path, token) => {
    if (path.startsWith("/api/hero/")) {
      const slideId = path.split("/").pop();
      await request("DELETE", `/api/hero-slides/${slideId}`, undefined, token);
      const data = await request("GET", "/api/hero-slides/admin", undefined, token);
      return {
        images: mapHeroSlidesToImages(data?.slides)
      };
    }

    return request("DELETE", path, undefined, token);
  },

  upload: async (path, formData, token) => {
    if (path === "/api/hero/add") {
      const imageFiles = formData.getAll("images");

      for (const imageFile of imageFiles) {
        const payload = new FormData();
        payload.append("image", imageFile);
        await request("POST", "/api/hero-slides", payload, token);
      }

      const data = await request("GET", "/api/hero-slides/admin", undefined, token);
      return {
        images: mapHeroSlidesToImages(data?.slides)
      };
    }

    return request("POST", path, formData, token);
  }
};
