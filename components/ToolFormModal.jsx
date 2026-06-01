"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Save, X } from "lucide-react";
import { emptyTool } from "@/lib/utils";

export default function ToolFormModal({ open, initialTool, projects = [], loading, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyTool);
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = Boolean(initialTool?.id);

  useEffect(() => {
    if (open) {
      setForm(initialTool || emptyTool);
      setShowPassword(false);
    }
  }, [initialTool, open]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleProject(projectId) {
    setForm((current) => {
      const projectIds = current.projectIds || [];
      return {
        ...current,
        projectIds: projectIds.includes(projectId) ? projectIds.filter((id) => id !== projectId) : [...projectIds, projectId],
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
            <h2>{isEdit ? "Sửa công cụ" : "Thêm công cụ"}</h2>
            <p>{isEdit ? `Giữ nguyên ID: ${initialTool.id}` : "ID sẽ được Google Apps Script tự sinh."}</p>
          </div>
          <button className="iconBtn" type="button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="modalBody">
          <div className="formGrid">
            <label className="field span2">
              <span>Tên công cụ *</span>
              <input value={form.tenCongCu} onChange={(event) => updateField("tenCongCu", event.target.value)} required />
            </label>
            <label className="field">
              <span>Tài khoản</span>
              <input value={form.taiKhoan} onChange={(event) => updateField("taiKhoan", event.target.value)} />
            </label>
            <label className="field">
              <span>Mật khẩu</span>
              <div className="passwordInputWrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.matKhau}
                  onChange={(event) => updateField("matKhau", event.target.value)}
                />
                <button
                  className="iconBtn"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="field span2">
              <span>URL</span>
              <input
                placeholder="https://example.com hoặc 192.168.1.10"
                value={form.url}
                onChange={(event) => updateField("url", event.target.value)}
              />
            </label>
            <label className="field span2">
              <span>Ngày hết hạn</span>
              <input type="date" value={form.ngayHetHan} onChange={(event) => updateField("ngayHetHan", event.target.value)} />
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
              <span>Dự án sử dụng công cụ này</span>
              <div className="checkList">
                {projects.length ? (
                  projects.map((project) => (
                    <label className="checkRow" key={project.id}>
                      <input
                        type="checkbox"
                        checked={(form.projectIds || []).includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                      />
                      <span>{project.tenDuAn || "Chưa đặt tên"}</span>
                    </label>
                  ))
                ) : (
                  <p className="muted compactText">Chưa có dự án để gán.</p>
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
