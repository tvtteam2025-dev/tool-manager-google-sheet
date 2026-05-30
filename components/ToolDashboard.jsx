"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Link as LinkIcon,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { createTool, deleteTool, getTools, updateTool } from "@/lib/api";
import { emptyTool, normalizeTool, normalizeUrl, validateTool } from "@/lib/utils";
import ToolFormModal from "@/components/ToolFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";

const HIDDEN_PASSWORD = "**********";

export default function ToolDashboard() {
  const router = useRouter();
  const [tools, setTools] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [detailTool, setDetailTool] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredTools = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tools;

    return tools.filter((tool) =>
      [tool.id, tool.tenCongCu, tool.taiKhoan, tool.url, tool.moTa, tool.ghiChu].join(" ").toLowerCase().includes(keyword)
    );
  }, [search, tools]);

  const selectedTool = useMemo(() => {
    return tools.find((tool) => tool.id === selectedId) || filteredTools[0] || tools[0] || null;
  }, [filteredTools, selectedId, tools]);

  const stats = useMemo(
    () => ({
      total: tools.length,
      hasUrl: tools.filter((tool) => tool.url).length,
      hasNote: tools.filter((tool) => tool.ghiChu).length,
      hasPassword: tools.filter((tool) => tool.matKhau).length,
    }),
    [tools]
  );

  useEffect(() => {
    loadTools();
  }, []);

  async function loadTools() {
    setLoading(true);
    setError("");
    const result = await getTools().catch(() => ({ success: false, message: "Không kết nối được API." }));
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Không tải được dữ liệu từ Google Sheet.");
      if (result.message === "Unauthorized") router.replace("/login");
      return;
    }

    const nextTools = (result.data || []).map(normalizeTool);
    setTools(nextTools);
    setSelectedId((current) => (nextTools.some((tool) => tool.id === current) ? current : nextTools[0]?.id || ""));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function openCreateForm() {
    setEditingTool(null);
    setFormOpen(true);
  }

  function openEditForm(tool) {
    setEditingTool(tool);
    setFormOpen(true);
  }

  function openToolDetail(tool) {
    setSelectedId(tool.id);
    setDetailTool(tool);
  }

  async function submitTool(formData) {
    const data = normalizeTool(formData);
    const validationError = validateTool(data, { requireId: Boolean(data.id) });

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    const result = data.id ? await updateTool(data) : await createTool(data);
    setSaving(false);

    if (!result.success) {
      setError(result.message || "Không lưu được dữ liệu.");
      return;
    }

    setFormOpen(false);
    setEditingTool(null);
    setSelectedId(result.data?.id || data.id);
    setMessage(data.id ? "Đã cập nhật công cụ." : "Đã thêm công cụ.");
    await loadTools();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");
    const result = await deleteTool(deleteTarget.id);
    setDeleting(false);

    if (!result.success) {
      setError(result.message || "Không xóa được công cụ.");
      return;
    }

    setDeleteTarget(null);
    setDetailTool(null);
    setSelectedId("");
    setMessage("Đã xóa công cụ.");
    await loadTools();
  }

  async function copyText(value, label) {
    if (!value) {
      setError(`Không có ${label} để sao chép.`);
      return;
    }

    await navigator.clipboard.writeText(value);
    setMessage(`Đã sao chép ${label}.`);
  }

  function openUrl(url) {
    if (!url) return;
    window.open(normalizeUrl(url), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <div className="brandMark">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1>Work Tools Manager</h1>
              <p>Google Sheet database qua Apps Script API</p>
            </div>
          </div>
          <div className="topActions">
            <button className="btn secondary" type="button" onClick={loadTools}>
              <RefreshCw size={17} />
              Tải lại
            </button>
            <button className="btn secondary" type="button" onClick={() => setShowPasswords((value) => !value)}>
              {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
              {showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            </button>
            <button className="btn primary" type="button" onClick={openCreateForm}>
              <Plus size={17} />
              Thêm công cụ
            </button>
            <button className="btn danger" type="button" onClick={logout}>
              <LogOut size={17} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        {message ? <div className="alert success">{message}</div> : null}
        {error ? <div className="alert error">{error}</div> : null}

        <section className="statsGrid">
          <StatCard title="Tổng công cụ" value={stats.total} note="Tổng số dòng trong sheet Main." />
          <StatCard title="Có URL" value={stats.hasUrl} note="Có thể mở nhanh bằng tab mới." />
          <StatCard title="Có ghi chú" value={stats.hasNote} note="Có thông tin vận hành bổ sung." />
          <StatCard title="Có mật khẩu" value={stats.hasPassword} note="Luôn che mặc định trên giao diện." />
        </section>

        <section className="contentGrid singleContentGrid">
          <section className="panel">
            <div className="panelHeader">
              <div>
                <h2>Danh sách công cụ</h2>
                <p>Tìm theo id, tên công cụ, tài khoản, URL, mô tả hoặc ghi chú.</p>
              </div>
              <div className="searchBox">
                <Search size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm..." />
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Tên công cụ</th>
                    <th>Tài khoản</th>
                    <th>Mật khẩu</th>
                    <th>URL</th>
                    <th>Mô tả</th>
                    <th>Ghi chú</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="emptyCell">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : null}
                  {!loading && filteredTools.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="emptyCell">
                        Không có công cụ phù hợp.
                      </td>
                    </tr>
                  ) : null}
                  {!loading &&
                    filteredTools.map((tool) => (
                      <tr
                        key={tool.id}
                        className={`clickableRow ${selectedTool?.id === tool.id ? "active" : ""}`}
                        onClick={() => openToolDetail(tool)}
                      >
                        <td>
                          <button
                            className="nameButton"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openToolDetail(tool);
                            }}
                          >
                            <span className="toolInitial">{tool.tenCongCu?.[0]?.toUpperCase() || "?"}</span>
                            <span>{tool.tenCongCu || "Chưa đặt tên"}</span>
                          </button>
                        </td>
                        <td className="truncate">{tool.taiKhoan || "Chưa có"}</td>
                        <td>
                          <div className="inlineActions">
                            <span>{showPasswords ? tool.matKhau || "Chưa có" : tool.matKhau ? HIDDEN_PASSWORD : "Chưa có"}</span>
                            <button
                              className="iconBtn"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                copyText(tool.matKhau, "mật khẩu");
                              }}
                            >
                              <Copy size={15} />
                            </button>
                          </div>
                        </td>
                        <td>
                          {tool.url ? (
                            <button
                              className="iconBtn"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openUrl(tool.url);
                              }}
                            >
                              <ExternalLink size={16} />
                            </button>
                          ) : (
                            <span className="muted">Chưa có</span>
                          )}
                        </td>
                        <td className="truncate">{tool.moTa || "Chưa có mô tả"}</td>
                        <td className="truncate">{tool.ghiChu || "Chưa có ghi chú"}</td>
                        <td>
                          <div className="inlineActions">
                            <button
                              className="iconBtn"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openToolDetail(tool);
                              }}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="iconBtn"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditForm(tool);
                              }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              className="iconBtn dangerIcon"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget(tool);
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>

      <ToolFormModal
        open={formOpen}
        initialTool={editingTool || emptyTool}
        loading={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={submitTool}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa công cụ"
        message={`Bạn có chắc muốn xóa "${deleteTarget?.tenCongCu || ""}" khỏi Google Sheet?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <ToolDetailModal
        open={Boolean(detailTool)}
        tool={detailTool}
        showPasswords={showPasswords}
        onClose={() => setDetailTool(null)}
        onCopy={copyText}
        onOpenUrl={openUrl}
        onEdit={(tool) => {
          setDetailTool(null);
          openEditForm(tool);
        }}
        onDelete={(tool) => {
          setDetailTool(null);
          setDeleteTarget(tool);
        }}
      />
    </div>
  );
}

function StatCard({ title, value, note }) {
  return (
    <article className="statCard">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function ToolDetailModal({ open, tool, showPasswords, onClose, onCopy, onOpenUrl, onEdit, onDelete }) {
  if (!open || !tool) return null;

  const password = showPasswords ? tool.matKhau || "Chưa có" : tool.matKhau ? HIDDEN_PASSWORD : "Chưa có";

  return (
    <div className="detailOverlay" onClick={onClose}>
      <aside className="panel detailPanel detailModal" onClick={(event) => event.stopPropagation()}>
        <div className="detailTop">
          <div>
            <p>Chi tiết công cụ</p>
            <h2>{tool.tenCongCu || "Chưa đặt tên"}</h2>
          </div>
          <div className="inlineActions">
            <span className="badge">ID: {tool.id}</span>
            <button className="iconBtn" type="button" onClick={onClose} aria-label="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="detailRows">
          <DetailRow label="id" value={tool.id} copyValue={tool.id} onCopy={onCopy} />
          <DetailRow label="tenCongCu" value={tool.tenCongCu} />
          <DetailRow label="taiKhoan" value={tool.taiKhoan || "Chưa có"} copyValue={tool.taiKhoan} onCopy={onCopy} />
          <DetailRow label="matKhau" value={password} copyValue={tool.matKhau} onCopy={onCopy} />
          <DetailRow label="url" value={tool.url || "Chưa có"} copyValue={tool.url} onCopy={onCopy} />
          <DetailRow label="moTa" value={tool.moTa || "Chưa có mô tả"} />
          <DetailRow label="ghiChu" value={tool.ghiChu || "Chưa có ghi chú"} />
        </div>

        <div className="detailActions">
          <button className="btn secondary" type="button" onClick={() => onEdit(tool)}>
            <Edit3 size={17} />
            Sửa
          </button>
          <button className="btn danger" type="button" onClick={() => onDelete(tool)}>
            <Trash2 size={17} />
            Xóa
          </button>
        </div>
        <button className="btn primary full" type="button" disabled={!tool.url} onClick={() => onOpenUrl(tool.url)}>
          <ExternalLink size={17} />
          {tool.url ? "Mở đường dẫn" : "Chưa có đường dẫn"}
        </button>
        <div className="securityNote">
          <KeyRound size={18} />
          <span>Mật khẩu được che mặc định. Frontend chỉ gọi `/api/tools`; secret nằm trong biến môi trường server.</span>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, value, copyValue, onCopy }) {
  return (
    <div className="detailRow">
      <div>
        <label>{label}</label>
        <p>{value}</p>
      </div>
      {copyValue ? (
        <button className="iconBtn" type="button" onClick={() => onCopy(copyValue, label)}>
          <Copy size={15} />
        </button>
      ) : null}
      {label === "url" && copyValue ? <LinkIcon className="rowGhostIcon" size={17} /> : null}
    </div>
  );
}
