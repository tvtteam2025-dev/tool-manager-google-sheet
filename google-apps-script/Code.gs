const CONFIG = {
  SHEET_ID: "1CSDwsIpFi94nnC7C1dwTEvEwSamWuEKKOrI9g3QXbpc",
  API_SECRET: "your_private_api_secret",
  SHEETS: {
    TOOLS: {
      NAME: "Main",
      HEADERS: ["id", "tenCongCu", "taiKhoan", "matKhau", "url", "moTa", "ghiChu"],
    },
    PROJECTS: {
      NAME: "Projects",
      HEADERS: ["id", "tenDuAn", "moTa", "ghiChu"],
    },
    PROJECT_TOOLS: {
      NAME: "ProjectTools",
      HEADERS: ["projectId", "toolId"],
    },
  },
};

function doGet() {
  return jsonResponse({
    success: true,
    message: "Tool Manager API is running",
  });
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");

    if (body.secret !== CONFIG.API_SECRET) {
      return jsonResponse({
        success: false,
        message: "Unauthorized",
      });
    }

    if (body.action === "list") {
      return jsonResponse({
        success: true,
        data: listTools(),
      });
    }

    if (body.action === "create") {
      return jsonResponse(createTool(body.data || {}));
    }

    if (body.action === "update") {
      return jsonResponse(updateTool(body.data || {}));
    }

    if (body.action === "delete") {
      return jsonResponse(deleteTool(body.data || {}));
    }

    if (body.action === "listProjects") {
      return jsonResponse({
        success: true,
        data: listProjects(),
      });
    }

    if (body.action === "createProject") {
      return jsonResponse(createProject(body.data || {}));
    }

    if (body.action === "updateProject") {
      return jsonResponse(updateProject(body.data || {}));
    }

    if (body.action === "deleteProject") {
      return jsonResponse(deleteProject(body.data || {}));
    }

    return jsonResponse({
      success: false,
      message: "Invalid action",
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.toString(),
    });
  }
}

function getSheet(sheetConfig) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetConfig.NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetConfig.NAME);
  }

  ensureHeader(sheet, sheetConfig.HEADERS);
  return sheet;
}

function ensureHeader(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  const values = range.getValues()[0];
  const isEmpty = values.every((value) => !value);

  if (isEmpty) {
    range.setValues([headers]);
    return;
  }

  const isValid = headers.every((header, index) => String(values[index]) === header);
  if (!isValid) {
    range.setValues([headers]);
  }
}

function listTools() {
  const sheetConfig = CONFIG.SHEETS.TOOLS;
  const rows = listRows(sheetConfig);
  const relations = listProjectToolRelations();

  return rows.map((tool) => ({
    ...tool,
    projectIds: relations.filter((relation) => relation.toolId === tool.id).map((relation) => relation.projectId),
  }));
}

function createTool(data) {
  const rowObject = normalizeTool({
    ...data,
    id: data.id ? String(data.id) : Utilities.getUuid(),
  });

  if (!rowObject.tenCongCu) {
    return {
      success: false,
      message: "Missing tenCongCu",
    };
  }

  const sheet = getSheet(CONFIG.SHEETS.TOOLS);
  sheet.appendRow(objectToRow(rowObject, CONFIG.SHEETS.TOOLS.HEADERS));
  syncToolProjects(rowObject.id, normalizeIds(data.projectIds));

  return {
    success: true,
    message: "Created successfully",
    data: {
      ...rowObject,
      projectIds: normalizeIds(data.projectIds),
    },
  };
}

function updateTool(data) {
  const id = String(data.id || "").trim();

  if (!id) {
    return {
      success: false,
      message: "Missing id",
    };
  }

  const rowObject = normalizeTool(data);
  if (!rowObject.tenCongCu) {
    return {
      success: false,
      message: "Missing tenCongCu",
    };
  }

  const sheet = getSheet(CONFIG.SHEETS.TOOLS);
  const rowIndex = findRowIndexById(sheet, id);

  if (rowIndex === -1) {
    return {
      success: false,
      message: "Tool not found",
    };
  }

  sheet.getRange(rowIndex, 1, 1, CONFIG.SHEETS.TOOLS.HEADERS.length).setValues([objectToRow(rowObject, CONFIG.SHEETS.TOOLS.HEADERS)]);
  syncToolProjects(id, normalizeIds(data.projectIds));

  return {
    success: true,
    message: "Updated successfully",
    data: {
      ...rowObject,
      projectIds: normalizeIds(data.projectIds),
    },
  };
}

function deleteTool(data) {
  const id = String(data.id || "").trim();

  if (!id) {
    return {
      success: false,
      message: "Missing id",
    };
  }

  const sheet = getSheet(CONFIG.SHEETS.TOOLS);
  const rowIndex = findRowIndexById(sheet, id);

  if (rowIndex === -1) {
    return {
      success: false,
      message: "Tool not found",
    };
  }

  sheet.deleteRow(rowIndex);
  deleteProjectToolRows({ toolId: id });

  return {
    success: true,
    message: "Deleted successfully",
    id,
  };
}

function listProjects() {
  const projects = listRows(CONFIG.SHEETS.PROJECTS);
  const relations = listProjectToolRelations();

  return projects.map((project) => ({
    ...project,
    toolIds: relations.filter((relation) => relation.projectId === project.id).map((relation) => relation.toolId),
  }));
}

function createProject(data) {
  const rowObject = normalizeProject({
    ...data,
    id: data.id ? String(data.id) : Utilities.getUuid(),
  });

  if (!rowObject.tenDuAn) {
    return {
      success: false,
      message: "Missing tenDuAn",
    };
  }

  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  sheet.appendRow(objectToRow(rowObject, CONFIG.SHEETS.PROJECTS.HEADERS));
  syncProjectTools(rowObject.id, normalizeIds(data.toolIds));

  return {
    success: true,
    message: "Created successfully",
    data: {
      ...rowObject,
      toolIds: normalizeIds(data.toolIds),
    },
  };
}

function updateProject(data) {
  const id = String(data.id || "").trim();

  if (!id) {
    return {
      success: false,
      message: "Missing id",
    };
  }

  const rowObject = normalizeProject(data);
  if (!rowObject.tenDuAn) {
    return {
      success: false,
      message: "Missing tenDuAn",
    };
  }

  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const rowIndex = findRowIndexById(sheet, id);

  if (rowIndex === -1) {
    return {
      success: false,
      message: "Project not found",
    };
  }

  sheet.getRange(rowIndex, 1, 1, CONFIG.SHEETS.PROJECTS.HEADERS.length).setValues([objectToRow(rowObject, CONFIG.SHEETS.PROJECTS.HEADERS)]);
  syncProjectTools(id, normalizeIds(data.toolIds));

  return {
    success: true,
    message: "Updated successfully",
    data: {
      ...rowObject,
      toolIds: normalizeIds(data.toolIds),
    },
  };
}

function deleteProject(data) {
  const id = String(data.id || "").trim();

  if (!id) {
    return {
      success: false,
      message: "Missing id",
    };
  }

  const sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  const rowIndex = findRowIndexById(sheet, id);

  if (rowIndex === -1) {
    return {
      success: false,
      message: "Project not found",
    };
  }

  sheet.deleteRow(rowIndex);
  deleteProjectToolRows({ projectId: id });

  return {
    success: true,
    message: "Deleted successfully",
    id,
  };
}

function listRows(sheetConfig) {
  const sheet = getSheet(sheetConfig);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const range = sheet.getRange(2, 1, lastRow - 1, sheetConfig.HEADERS.length);
  const rows = range.getValues();
  const formulas = range.getFormulas();

  return rows
    .filter((row, rowIndex) => row.some((cell) => cell !== "") || formulas[rowIndex].some((formula) => formula !== ""))
    .map((row, rowIndex) => rowToObject(row, sheetConfig.HEADERS, formulas[rowIndex]));
}

function listProjectToolRelations() {
  return listRows(CONFIG.SHEETS.PROJECT_TOOLS).filter((relation) => relation.projectId && relation.toolId);
}

function syncProjectTools(projectId, toolIds) {
  deleteProjectToolRows({ projectId });

  if (!toolIds.length) {
    return;
  }

  const sheet = getSheet(CONFIG.SHEETS.PROJECT_TOOLS);
  const rows = normalizeIds(toolIds).map((toolId) => [projectId, toolId]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, CONFIG.SHEETS.PROJECT_TOOLS.HEADERS.length).setValues(rows);
}

function syncToolProjects(toolId, projectIds) {
  deleteProjectToolRows({ toolId });

  if (!projectIds.length) {
    return;
  }

  const sheet = getSheet(CONFIG.SHEETS.PROJECT_TOOLS);
  const rows = normalizeIds(projectIds).map((projectId) => [projectId, toolId]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, CONFIG.SHEETS.PROJECT_TOOLS.HEADERS.length).setValues(rows);
}

function deleteProjectToolRows(criteria) {
  const sheet = getSheet(CONFIG.SHEETS.PROJECT_TOOLS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, CONFIG.SHEETS.PROJECT_TOOLS.HEADERS.length).getValues();

  for (let index = rows.length - 1; index >= 0; index--) {
    const relation = rowToObject(rows[index], CONFIG.SHEETS.PROJECT_TOOLS.HEADERS);
    const matchesProject = !criteria.projectId || relation.projectId === criteria.projectId;
    const matchesTool = !criteria.toolId || relation.toolId === criteria.toolId;

    if (matchesProject && matchesTool) {
      sheet.deleteRow(index + 2);
    }
  }
}

function findRowIndexById(sheet, id) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return -1;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let index = 0; index < ids.length; index++) {
    if (String(ids[index][0]).trim() === id) {
      return index + 2;
    }
  }

  return -1;
}

function rowToObject(row, headers, formulas) {
  const object = {};

  headers.forEach((header, index) => {
    const formula = formulas && formulas[index] ? String(formulas[index]) : "";
    const value = formula || row[index];
    object[header] = value === null || value === undefined ? "" : String(value);
  });

  return object;
}

function objectToRow(object, headers) {
  return headers.map((header) => escapeSheetText(object[header] || ""));
}

function escapeSheetText(value) {
  const text = String(value || "");

  if (/^[=+\-@]/.test(text)) {
    return "'" + text;
  }

  return text;
}

function normalizeTool(data) {
  return {
    id: String(data.id || "").trim(),
    tenCongCu: String(data.tenCongCu || "").trim(),
    taiKhoan: String(data.taiKhoan || "").trim(),
    matKhau: String(data.matKhau || "").trim(),
    url: String(data.url || "").trim(),
    moTa: String(data.moTa || "").trim(),
    ghiChu: String(data.ghiChu || "").trim(),
  };
}

function normalizeProject(data) {
  return {
    id: String(data.id || "").trim(),
    tenDuAn: String(data.tenDuAn || "").trim(),
    moTa: String(data.moTa || "").trim(),
    ghiChu: String(data.ghiChu || "").trim(),
  };
}

function normalizeIds(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  const result = [];

  list.forEach((item) => {
    const id = String(item || "").trim();
    if (id && result.indexOf(id) === -1) {
      result.push(id);
    }
  });

  return result;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
