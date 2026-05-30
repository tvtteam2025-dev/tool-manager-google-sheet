"use client";

import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({ open, title, message, loading, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="overlay">
      <section className="modal small">
        <header className="modalHeader">
          <div>
            <h2>{title}</h2>
            <p>Vui lòng kiểm tra trước khi tiếp tục.</p>
          </div>
          <button className="iconBtn" type="button" onClick={onCancel} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>
        <div className="modalBody">
          <div className="dangerNote">
            <AlertTriangle size={20} />
            <span>{message}</span>
          </div>
        </div>
        <footer className="modalFooter">
          <button className="btn secondary" type="button" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn danger" type="button" disabled={loading} onClick={onConfirm}>
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
        </footer>
      </section>
    </div>
  );
}
