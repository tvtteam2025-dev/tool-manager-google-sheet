export const emptyTool = {
  id: "",
  tenCongCu: "",
  taiKhoan: "",
  matKhau: "",
  url: "",
  moTa: "",
  ghiChu: "",
};

export function normalizeTool(data = {}) {
  return {
    id: String(data.id || "").trim(),
    tenCongCu: String(data.tenCongCu || "").trim(),
    taiKhoan: String(data.taiKhoan || "").trim(),
    matKhau: String(data.matKhau || "").trim(),
    url: normalizeUrl(String(data.url || "").trim()),
    moTa: String(data.moTa || "").trim(),
    ghiChu: String(data.ghiChu || "").trim(),
  };
}

export function normalizeUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(url)) {
    return url;
  }

  if (/^localhost(?::\d+)?(?:\/.*)?$/i.test(url) || /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/.*)?$/.test(url)) {
    return `http://${url}`;
  }

  return `https://${url}`;
}

export function validateTool(data, { requireId = false } = {}) {
  const tool = normalizeTool(data);

  if (requireId && !tool.id) {
    return "Thiếu id.";
  }

  if (!tool.tenCongCu) {
    return "Thiếu tên công cụ.";
  }

  if (tool.url) {
    try {
      new URL(tool.url);
    } catch {
      return "URL không hợp lệ.";
    }
  }

  return "";
}
