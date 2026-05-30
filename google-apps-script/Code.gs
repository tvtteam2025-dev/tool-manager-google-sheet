const CONFIG = {
  SHEET_ID: "1CSDwsIpFi94nnC7C1dwTEvEwSamWuEKKOrI9g3QXbpc",
  SHEET_NAME: "Main",
  API_SECRET: "your_private_api_secret",
  HEADERS: ["id", "tenCongCu", "taiKhoan", "matKhau", "url", "moTa", "ghiChu"],
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

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet not found: " + CONFIG.SHEET_NAME);
  }

  ensureHeader(sheet);
  return sheet;
}

function ensureHeader(sheet) {
  const range = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length);
  const values = range.getValues()[0];
  const isEmpty = values.every((value) => !value);

  if (isEmpty) {
    range.setValues([CONFIG.HEADERS]);
    return;
  }

  const isValid = CONFIG.HEADERS.every((header, index) => String(values[index]) === header);
  if (!isValid) {
    range.setValues([CONFIG.HEADERS]);
  }
}

function listTools() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.length).getValues();
  return rows.filter((row) => row.some((cell) => cell !== "")).map(rowToObject);
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

  const sheet = getSheet();
  sheet.appendRow(objectToRow(rowObject));

  return {
    success: true,
    message: "Created successfully",
    data: rowObject,
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

  const sheet = getSheet();
  const rowIndex = findRowIndexById(sheet, id);

  if (rowIndex === -1) {
    return {
      success: false,
      message: "Tool not found",
    };
  }

  sheet.getRange(rowIndex, 1, 1, CONFIG.HEADERS.length).setValues([objectToRow(rowObject)]);

  return {
    success: true,
    message: "Updated successfully",
    data: rowObject,
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

  const sheet = getSheet();
  const rowIndex = findRowIndexById(sheet, id);

  if (rowIndex === -1) {
    return {
      success: false,
      message: "Tool not found",
    };
  }

  sheet.deleteRow(rowIndex);

  return {
    success: true,
    message: "Deleted successfully",
    id,
  };
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

function rowToObject(row) {
  const object = {};

  CONFIG.HEADERS.forEach((header, index) => {
    object[header] = row[index] === null || row[index] === undefined ? "" : String(row[index]);
  });

  return object;
}

function objectToRow(object) {
  return CONFIG.HEADERS.map((header) => object[header] || "");
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

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
