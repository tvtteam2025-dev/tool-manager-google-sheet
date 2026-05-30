"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { emptyProject } from "@/lib/utils";

export default function ProjectFormModal({ open, initialProject, tools, loading, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyProject);
  const isEdit = Boolean(initialProject?.id);

  useEffect(() => {
    if (open) {
      setForm(initialProject || emptyProject);
    }
  }, [initialProject, open]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleTool(toolId) {
    setForm((current) => {
      const toolIds = current.toolIds || [];
      return {
        ...current,
        toolIds: toolIds.includes(toolId) ? toolIds.filter((id) => id !== toolId) : [...toolIds, toolId],
      };
    });
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="overlay">
      <form className="modal" onSubmit={submit}>
        <header className="modalHeader">
          <div>
            <h2>{isEdit ? "Sửa dự án" : "Thêm dự án"}</h2>
            <p>{isEdit ? `Giữ nguyên ID: ${initialProject.id}` : "ID sẽ được Google Apps Script tự sinh."}</p>
          </div>
          <button className="iconBtn" type="button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="modalBody">
          <div className="formGrid">
            <label className="field span2">
              <span>Tên dự án *</span>
              <input value={form.tenDuAn} onChange={(event) => updateField("tenDuAn", event.target.value)} required />
            </label>
            <label className="field span2">
              <span>Mô tả</span>
              <textarea value={form.moTa} onChange={(event) => updateField("moTa", event.target.value)} />
            </label>
            <label className="field span2">
              <span>Ghi chú</span>
              <textarea value={form.ghiChu} onChange={(event) => updateField("ghiChu", event.target.value)} />
            </label>
            <div className="field span2">
              <span>Công cụ trong dự án</span>
              <div className="checkList">
                {tools.length ? (
                  tools.map((tool) => (
                    <label className="checkRow" key={tool.id}>
                      <input type="checkbox" checked={(form.toolIds || []).includes(tool.id)} onChange={() => toggleTool(tool.id)} />
                      <span>{tool.tenCongCu || "Chưa đặt tên"}</span>
                    </label>
                  ))
                ) : (
                  <p className="muted compactText">Chưa có công cụ để gán.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <footer className="modalFooter">
          <button className="btn secondary" type="button" onClick={onClose}>
            Hủy
          </button>
          <button className="btn primary" type="submit" disabled={loading}>
            <Save size={17} />
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </footer>
      </form>
    </div>
  );
}
