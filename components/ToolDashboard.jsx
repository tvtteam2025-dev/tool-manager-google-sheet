"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FolderKanban,
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
import {
  createProject,
  createTool,
  deleteProject,
  deleteTool,
  getProjects,
  getTools,
  updateProject,
  updateTool,
} from "@/lib/api";
import { emptyProject, emptyTool, normalizeProject, normalizeTool, normalizeUrl, validateProject, validateTool } from "@/lib/utils";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProjectFormModal from "@/components/ProjectFormModal";
import ToolFormModal from "@/components/ToolFormModal";

const HIDDEN_PASSWORD = "**********";

export default function ToolDashboard() {
  const router = useRouter();
  const [tools, setTools] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [toolFormOpen, setToolFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [detailTool, setDetailTool] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const toolById = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);

  const filteredTools = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tools.filter((tool) => {
      if (projectFilter && !(tool.projectIds || []).includes(projectFilter)) {
        return false;
      }

      if (!keyword) return true;

      const projectNames = (tool.projectIds || []).map((id) => projectById.get(id)?.tenDuAn || "").join(" ");
      return [tool.id, tool.tenCongCu, tool.taiKhoan, tool.url, tool.moTa, tool.ghiChu, projectNames]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [projectById, projectFilter, search, tools]);

  const selectedTool = useMemo(() => {
    return tools.find((tool) => tool.id === selectedId) || filteredTools[0] || tools[0] || null;
  }, [filteredTools, selectedId, tools]);

  const stats = useMemo(
    () => ({
      totalTools: tools.length,
      totalProjects: projects.length,
      linkedTools: tools.filter((tool) => tool.projectIds?.length).length,
      linkedProjects: projects.filter((project) => project.toolIds?.length).length,
    }),
    [projects, tools]
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [toolsResult, projectsResult] = await Promise.all([
      getTools().catch(() => ({ success: false, message: "Không kết nối được API công cụ." })),
      getProjects().catch(() => ({ success: false, message: "Không kết nối được API dự án." })),
    ]);

    setLoading(false);

    if (toolsResult.message === "Unauthorized" || projectsResult.message === "Unauthorized") {
      router.replace("/login");
      return;
    }

    if (!toolsResult.success) {
      setError(toolsResult.message || "Không tải được danh sách công cụ.");
      return;
    }

    const normalizedTools = (toolsResult.data || []).map(normalizeTool);
    const normalizedProjects = projectsResult.success ? (projectsResult.data || []).map(normalizeProject) : [];
    const { nextTools, nextProjects } = mergeProjectLinks(normalizedTools, normalizedProjects);
    setTools(nextTools);
    setProjects(nextProjects);
    setSelectedId((current) => (nextTools.some((tool) => tool.id === current) ? current : nextTools[0]?.id || ""));

    if (!projectsResult.success) {
      const message =
        projectsResult.message === "Invalid action"
          ? "Google Apps Script chưa được cập nhật bản hỗ trợ Projects và ProjectTools. Hãy deploy lại Code.gs mới."
          : projectsResult.message || "Không tải được danh sách dự án.";
      setError(message);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function openCreateToolForm() {
    setEditingTool(null);
    setToolFormOpen(true);
  }

  function openEditToolForm(tool) {
    setEditingTool(tool);
    setToolFormOpen(true);
  }

  function openCreateProjectForm() {
    setEditingProject(null);
    setProjectFormOpen(true);
  }

  function openEditProjectForm(project) {
    setEditingProject(project);
    setProjectFormOpen(true);
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

    if (!result.success) {
      setSaving(false);
      setError(result.message || "Không lưu được công cụ.");
      return;
    }

    const toolId = result.data?.id || data.id;
    const relationResult = await syncToolProjectSelection(toolId, data.projectIds);
    setSaving(false);

    if (!relationResult.success) {
      setError(relationResult.message || "Đã lưu công cụ nhưng chưa gán được dự án.");
      return;
    }

    setToolFormOpen(false);
    setEditingTool(null);
    setSelectedId(toolId);
    setMessage(data.id ? "Đã cập nhật công cụ." : "Đã thêm công cụ.");
    await loadData();
  }

  async function syncToolProjectSelection(toolId, selectedProjectIds = []) {
    if (!toolId || !projects.length) {
      return { success: true };
    }

    const selectedIds = new Set(selectedProjectIds);
    const projectsToUpdate = projects.filter((project) => {
      const hasTool = (project.toolIds || []).includes(toolId);
      return selectedIds.has(project.id) !== hasTool;
    });

    for (const project of projectsToUpdate) {
      const nextToolIds = selectedIds.has(project.id)
        ? [...new Set([...(project.toolIds || []), toolId])]
        : (project.toolIds || []).filter((id) => id !== toolId);
      const result = await updateProject({ ...project, toolIds: nextToolIds });

      if (!result.success) {
        return {
          success: false,
          message: result.message || `Không cập nhật được liên kết dự án ${project.tenDuAn}.`,
        };
      }
    }

    return { success: true };
  }

  async function submitProject(formData) {
    const data = normalizeProject(formData);
    const validationError = validateProject(data, { requireId: Boolean(data.id) });

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    const result = data.id ? await updateProject(data) : await createProject(data);
    setSaving(false);

    if (!result.success) {
      setError(result.message || "Không lưu được dự án.");
      return;
    }

    setProjectFormOpen(false);
    setEditingProject(null);
    setMessage(data.id ? "Đã cập nhật dự án." : "Đã thêm dự án.");
    await loadData();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");
    const result =
      deleteTarget.type === "project" ? await deleteProject(deleteTarget.item.id) : await deleteTool(deleteTarget.item.id);
    setDeleting(false);

    if (!result.success) {
      setError(result.message || "Không xóa được dữ liệu.");
      return;
    }

    setDeleteTarget(null);
    setDetailTool(null);
    if (deleteTarget.type === "tool") setSelectedId("");
    setMessage(deleteTarget.type === "project" ? "Đã xóa dự án." : "Đã xóa công cụ.");
    await loadData();
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

  function getProjectNames(projectIds = []) {
    return projectIds.map((id) => projectById.get(id)?.tenDuAn).filter(Boolean);
  }

  function getToolNames(toolIds = []) {
    return toolIds.map((id) => toolById.get(id)?.tenCongCu).filter(Boolean);
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
              <p>Công cụ, dự án và liên kết nhiều-nhiều qua Google Sheet</p>
            </div>
          </div>
          <div className="topActions">
            <button className="btn secondary" type="button" onClick={loadData}>
              <RefreshCw size={17} />
              Tải lại
            </button>
            <button className="btn secondary" type="button" onClick={() => setShowPasswords((value) => !value)}>
              {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
              {showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            </button>
            <button className="btn secondary" type="button" onClick={openCreateProjectForm}>
              <FolderKanban size={17} />
              Thêm dự án
            </button>
            <button className="btn primary" type="button" onClick={openCreateToolForm}>
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
          <StatCard title="Tổng công cụ" value={stats.totalTools} note="Số dòng trong sheet Main." />
          <StatCard title="Tổng dự án" value={stats.totalProjects} note="Số dòng trong sheet Projects." />
          <StatCard title="Công cụ đã gán" value={stats.linkedTools} note="Công cụ đang thuộc ít nhất một dự án." />
          <StatCard title="Dự án có công cụ" value={stats.linkedProjects} note="Dự án có ít nhất một liên kết." />
        </section>

        <section className="contentGrid projectContentGrid">
          <section className="panel">
            <div className="panelHeader">
              <div>
                <h2>Danh sách công cụ</h2>
                <p>Tìm theo công cụ, tài khoản, URL, mô tả, ghi chú hoặc dự án.</p>
              </div>
              <div className="listFilters">
                <div className="searchBox">
                  <Search size={18} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm..." />
                </div>
                <select className="selectBox" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                  <option value="">Tất cả dự án</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.tenDuAn || "Chưa đặt tên"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Tên công cụ</th>
                    <th>Dự án</th>
                    <th>Tài khoản</th>
                    <th>Mật khẩu</th>
                    <th>URL</th>
                    <th>Mô tả</th>
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
                        <td>
                          <ChipList items={getProjectNames(tool.projectIds)} emptyText="Chưa gán" />
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
                                openEditToolForm(tool);
                              }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              className="iconBtn dangerIcon"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget({ type: "tool", item: tool });
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

          <section className="panel">
            <div className="panelHeader">
              <div>
                <h2>Dự án</h2>
                <p>Mỗi dự án có thể chọn nhiều công cụ.</p>
              </div>
            </div>
            <div className="projectList">
              {loading ? <p className="emptyDetail">Đang tải dự án...</p> : null}
              {!loading && projects.length === 0 ? <p className="emptyDetail">Chưa có dự án.</p> : null}
              {!loading &&
                projects.map((project) => (
                  <article className="projectItem" key={project.id}>
                    <div className="projectItemTop">
                      <div>
                        <h3>{project.tenDuAn || "Chưa đặt tên"}</h3>
                        <p>{project.moTa || "Chưa có mô tả"}</p>
                      </div>
                      <div className="inlineActions">
                        <button className="iconBtn" type="button" onClick={() => openEditProjectForm(project)}>
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="iconBtn dangerIcon"
                          type="button"
                          onClick={() => setDeleteTarget({ type: "project", item: project })}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <ChipList items={getToolNames(project.toolIds)} emptyText="Chưa gán công cụ" />
                  </article>
                ))}
            </div>
          </section>
        </section>
      </main>

      <ToolFormModal
        open={toolFormOpen}
        initialTool={editingTool || emptyTool}
        projects={projects}
        loading={saving}
        onClose={() => setToolFormOpen(false)}
        onSubmit={submitTool}
      />
      <ProjectFormModal
        open={projectFormOpen}
        initialProject={editingProject || emptyProject}
        tools={tools}
        loading={saving}
        onClose={() => setProjectFormOpen(false)}
        onSubmit={submitProject}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === "project" ? "Xóa dự án" : "Xóa công cụ"}
        message={`Bạn có chắc muốn xóa "${deleteTarget?.item?.tenDuAn || deleteTarget?.item?.tenCongCu || ""}" khỏi Google Sheet?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <ToolDetailModal
        open={Boolean(detailTool)}
        tool={detailTool}
        projectNames={getProjectNames(detailTool?.projectIds)}
        showPasswords={showPasswords}
        onClose={() => setDetailTool(null)}
        onCopy={copyText}
        onOpenUrl={openUrl}
        onEdit={(tool) => {
          setDetailTool(null);
          openEditToolForm(tool);
        }}
        onDelete={(tool) => {
          setDetailTool(null);
          setDeleteTarget({ type: "tool", item: tool });
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

function mergeProjectLinks(tools, projects) {
  const toolIdsByProject = new Map(projects.map((project) => [project.id, new Set(project.toolIds || [])]));
  const projectIdsByTool = new Map(tools.map((tool) => [tool.id, new Set(tool.projectIds || [])]));

  tools.forEach((tool) => {
    (tool.projectIds || []).forEach((projectId) => {
      if (!toolIdsByProject.has(projectId)) {
        toolIdsByProject.set(projectId, new Set());
      }
      toolIdsByProject.get(projectId).add(tool.id);
    });
  });

  projects.forEach((project) => {
    (project.toolIds || []).forEach((toolId) => {
      if (!projectIdsByTool.has(toolId)) {
        projectIdsByTool.set(toolId, new Set());
      }
      projectIdsByTool.get(toolId).add(project.id);
    });
  });

  return {
    nextTools: tools.map((tool) => ({
      ...tool,
      projectIds: [...(projectIdsByTool.get(tool.id) || [])],
    })),
    nextProjects: projects.map((project) => ({
      ...project,
      toolIds: [...(toolIdsByProject.get(project.id) || [])],
    })),
  };
}

function ChipList({ items, emptyText }) {
  if (!items.length) {
    return <span className="muted">{emptyText}</span>;
  }

  return (
    <div className="chipList">
      {items.map((item) => (
        <span className="badge" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function ToolDetailModal({ open, tool, projectNames, showPasswords, onClose, onCopy, onOpenUrl, onEdit, onDelete }) {
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
          <DetailRow label="duAn" value={projectNames.length ? projectNames.join(", ") : "Chưa gán dự án"} />
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
          <span>Mật khẩu được che mặc định. Frontend chỉ gọi API nội bộ; secret nằm trong biến môi trường server.</span>
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
