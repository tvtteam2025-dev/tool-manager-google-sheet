export const emptyTool = {
  id: "",
  tenCongCu: "",
  taiKhoan: "",
  matKhau: "",
  url: "",
  moTa: "",
  ghiChu: "",
  ngayHetHan: "",
  projectIds: [],
};

export const emptyProject = {
  id: "",
  tenDuAn: "",
  moTa: "",
  ghiChu: "",
  toolIds: [],
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
    ngayHetHan: String(data.ngayHetHan || "").trim(),
    projectIds: normalizeIds(data.projectIds),
  };
}

export function normalizeProject(data = {}) {
  return {
    id: String(data.id || "").trim(),
    tenDuAn: String(data.tenDuAn || "").trim(),
    moTa: String(data.moTa || "").trim(),
    ghiChu: String(data.ghiChu || "").trim(),
    toolIds: normalizeIds(data.toolIds),
  };
}

export function normalizeIds(value = []) {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(list.map((item) => String(item || "").trim()).filter(Boolean))];
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

  if (tool.ngayHetHan && !/^\d{4}-\d{2}-\d{2}$/.test(tool.ngayHetHan)) {
    return "Ngày hết hạn phải theo định dạng YYYY-MM-DD.";
  }

  return "";
}

export function validateProject(data, { requireId = false } = {}) {
  const project = normalizeProject(data);

  if (requireId && !project.id) {
    return "Thiếu id.";
  }

  if (!project.tenDuAn) {
    return "Thiếu tên dự án.";
  }

  return "";
}
