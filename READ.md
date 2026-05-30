# READ.md — Tool Manager Website

## 1. Mục tiêu dự án

Xây dựng một website quản lý các công cụ làm việc nội bộ, sử dụng:

- **Frontend:** Next.js + React + Tailwind CSS
- **Database:** Google Sheet
- **API trung gian:** Google Apps Script Web App
- **Deploy:** Vercel

Website dùng để quản lý danh sách công cụ, tài khoản, mật khẩu, URL, mô tả và ghi chú.

---

## 2. Thông tin Google Sheet

- **Google Sheet ID:** `1CSDwsIpFi94nnC7C1dwTEvEwSamWuEKKOrI9g3QXbpc`
- **Tên sheet:** `Main`

Sheet `Main` có cấu trúc cột như sau:

| Cột | Field | Mô tả |
|---|---|---|
| A | `id` | ID duy nhất của công cụ |
| B | `tenCongCu` | Tên công cụ |
| C | `taiKhoan` | Tài khoản đăng nhập |
| D | `matKhau` | Mật khẩu |
| E | `url` | Link truy cập |
| F | `moTa` | Mô tả công cụ |
| G | `ghiChu` | Ghi chú thêm |

Dòng 1 là header. Dữ liệu bắt đầu từ dòng 2.

---

## 3. Yêu cầu chức năng

### 3.1. Chức năng chính

Website cần có các chức năng:

- Hiển thị danh sách công cụ từ Google Sheet.
- Tìm kiếm theo:
  - `id`
  - `tenCongCu`
  - `taiKhoan`
  - `url`
  - `moTa`
  - `ghiChu`
- Thêm công cụ mới.
- Sửa công cụ.
- Xóa công cụ.
- Xem chi tiết một công cụ.
- Ẩn/hiện mật khẩu.
- Sao chép nhanh:
  - tài khoản
  - mật khẩu
  - URL
- Mở nhanh URL ở tab mới.
- Responsive tốt trên desktop, tablet, mobile.

### 3.2. Chức năng bảo mật cơ bản

Vì dữ liệu có chứa trường `matKhau`, cần làm tối thiểu:

- Có màn hình đăng nhập admin.
- Không public trực tiếp Google Sheet.
- Frontend không gọi Google Sheet trực tiếp.
- Frontend chỉ gọi API Google Apps Script.
- Có `API_SECRET` để xác thực request giữa frontend và Google Apps Script.
- Mật khẩu trên giao diện mặc định phải được che.
- Chỉ hiện mật khẩu khi người dùng bấm nút "Hiện mật khẩu".

---

## 4. Kiến trúc hệ thống

```txt
User
  ↓
Next.js Website on Vercel
  ↓
Next.js API Route / Server Action
  ↓
Google Apps Script Web App
  ↓
Google Sheet Main
```

Không gọi Google Apps Script trực tiếp từ client nếu có thể. Nên gọi qua Next.js API route để giấu `API_SECRET`.

---

## 5. Công nghệ sử dụng

### Frontend

- Next.js App Router
- React
- Tailwind CSS
- shadcn/ui nếu cần
- lucide-react cho icon

### Backend nhẹ

- Next.js API routes làm proxy
- Google Apps Script làm API đọc/ghi Google Sheet

### Deploy

- Vercel

---

## 6. Cấu trúc thư mục đề xuất

```txt
tool-manager/
│
├── app/
│   ├── page.jsx
│   ├── login/
│   │   └── page.jsx
│   ├── dashboard/
│   │   └── page.jsx
│   └── api/
│       └── tools/
│           └── route.js
│
├── components/
│   ├── AppHeader.jsx
│   ├── LoginForm.jsx
│   ├── ToolTable.jsx
│   ├── ToolCard.jsx
│   ├── ToolDetail.jsx
│   ├── ToolFormModal.jsx
│   └── ConfirmDialog.jsx
│
├── lib/
│   ├── api.js
│   ├── auth.js
│   └── utils.js
│
├── public/
│
├── .env.local.example
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 7. Biến môi trường

Tạo file `.env.local`:

```env
GAS_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
API_SECRET=your_private_api_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
```

Tạo thêm file `.env.local.example`:

```env
GAS_API_URL=
API_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

Lưu ý:

- Không commit file `.env.local`.
- Khi deploy Vercel, thêm các biến này trong Project Settings > Environment Variables.

---

## 8. Chuẩn dữ liệu trả về từ API

### 8.1. Danh sách công cụ

Response mẫu:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "tenCongCu": "Gmail",
      "taiKhoan": "example@gmail.com",
      "matKhau": "********",
      "url": "https://mail.google.com",
      "moTa": "Mail chính",
      "ghiChu": "Có mail dự phòng"
    }
  ]
}
```

### 8.2. Lỗi

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## 9. API cần có

Frontend/Next.js gọi vào endpoint nội bộ:

```txt
GET    /api/tools
POST   /api/tools
PUT    /api/tools
DELETE /api/tools
```

Next.js API route sẽ gọi tiếp Google Apps Script.

### 9.1. GET `/api/tools`

Lấy danh sách công cụ.

### 9.2. POST `/api/tools`

Thêm công cụ mới.

Body:

```json
{
  "tenCongCu": "Canva",
  "taiKhoan": "abc@gmail.com",
  "matKhau": "123456",
  "url": "https://www.canva.com",
  "moTa": "Thiết kế hình ảnh",
  "ghiChu": "Tài khoản team"
}
```

### 9.3. PUT `/api/tools`

Cập nhật công cụ.

Body:

```json
{
  "id": "1",
  "tenCongCu": "Canva Pro",
  "taiKhoan": "abc@gmail.com",
  "matKhau": "123456",
  "url": "https://www.canva.com",
  "moTa": "Thiết kế hình ảnh",
  "ghiChu": "Đã gia hạn"
}
```

### 9.4. DELETE `/api/tools`

Xóa công cụ.

Body:

```json
{
  "id": "1"
}
```

---

## 10. Next.js API route mẫu

Tạo file:

```txt
app/api/tools/route.js
```

Code mẫu:

```js
const GAS_API_URL = process.env.GAS_API_URL;
const API_SECRET = process.env.API_SECRET;

async function callGasApi(payload) {
  const res = await fetch(GAS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      ...payload,
      secret: API_SECRET,
    }),
    cache: "no-store",
  });

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      success: false,
      message: "Invalid response from Google Apps Script",
      raw: text,
    };
  }
}

export async function GET() {
  const result = await callGasApi({
    action: "list",
  });

  return Response.json(result);
}

export async function POST(request) {
  const body = await request.json();

  const result = await callGasApi({
    action: "create",
    data: body,
  });

  return Response.json(result);
}

export async function PUT(request) {
  const body = await request.json();

  const result = await callGasApi({
    action: "update",
    data: body,
  });

  return Response.json(result);
}

export async function DELETE(request) {
  const body = await request.json();

  const result = await callGasApi({
    action: "delete",
    data: body,
  });

  return Response.json(result);
}
```

---

## 11. Google Apps Script API

Tạo một project Google Apps Script gắn với Google Sheet hoặc tạo standalone Apps Script.

### 11.1. Config

```js
const CONFIG = {
  SHEET_ID: "1CSDwsIpFi94nnC7C1dwTEvEwSamWuEKKOrI9g3QXbpc",
  SHEET_NAME: "Main",
  API_SECRET: "your_private_api_secret",
  HEADERS: ["id", "tenCongCu", "taiKhoan", "matKhau", "url", "moTa", "ghiChu"],
};
```

### 11.2. Full Apps Script code

```js
const CONFIG = {
  SHEET_ID: "1CSDwsIpFi94nnC7C1dwTEvEwSamWuEKKOrI9g3QXbpc",
  SHEET_NAME: "Main",
  API_SECRET: "your_private_api_secret",
  HEADERS: ["id", "tenCongCu", "taiKhoan", "matKhau", "url", "moTa", "ghiChu"],
};

function doGet(e) {
  return jsonResponse({
    success: true,
    message: "Tool Manager API is running",
  });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    if (body.secret !== CONFIG.API_SECRET) {
      return jsonResponse({
        success: false,
        message: "Unauthorized",
      });
    }

    const action = body.action;

    if (action === "list") {
      return jsonResponse({
        success: true,
        data: listTools(),
      });
    }

    if (action === "create") {
      return jsonResponse(createTool(body.data || {}));
    }

    if (action === "update") {
      return jsonResponse(updateTool(body.data || {}));
    }

    if (action === "delete") {
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
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet not found: " + CONFIG.SHEET_NAME);
  }

  ensureHeader(sheet);
  return sheet;
}

function ensureHeader(sheet) {
  const range = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length);
  const values = range.getValues()[0];

  const isEmpty = values.every((v) => !v);
  if (isEmpty) {
    range.setValues([CONFIG.HEADERS]);
    return;
  }

  const current = values.map(String);
  const expected = CONFIG.HEADERS;

  const isValid = expected.every((header, index) => current[index] === header);
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

  const values = sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.length).getValues();

  return values
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => rowToObject(row));
}

function createTool(data) {
  const sheet = getSheet();

  const newId = data.id ? String(data.id) : generateId();
  const rowObject = normalizeTool({
    ...data,
    id: newId,
  });

  sheet.appendRow(objectToRow(rowObject));

  return {
    success: true,
    message: "Created successfully",
    data: rowObject,
  };
}

function updateTool(data) {
  const sheet = getSheet();
  const id = String(data.id || "").trim();

  if (!id) {
    return {
      success: false,
      message: "Missing id",
    };
  }

  const rowIndex = findRowIndexById(sheet, id);

  if (rowIndex === -1) {
    return {
      success: false,
      message: "Tool not found",
    };
  }

  const rowObject = normalizeTool(data);
  sheet.getRange(rowIndex, 1, 1, CONFIG.HEADERS.length).setValues([objectToRow(rowObject)]);

  return {
    success: true,
    message: "Updated successfully",
    data: rowObject,
  };
}

function deleteTool(data) {
  const sheet = getSheet();
  const id = String(data.id || "").trim();

  if (!id) {
    return {
      success: false,
      message: "Missing id",
    };
  }

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

  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === id) {
      return i + 2;
    }
  }

  return -1;
}

function rowToObject(row) {
  const obj = {};

  CONFIG.HEADERS.forEach((header, index) => {
    obj[header] = row[index] === null || row[index] === undefined ? "" : String(row[index]);
  });

  return obj;
}

function objectToRow(obj) {
  return CONFIG.HEADERS.map((header) => obj[header] || "");
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

function generateId() {
  return Utilities.getUuid();
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 12. Deploy Google Apps Script

Các bước:

1. Mở Google Apps Script.
2. Dán code ở mục trên.
3. Đổi `API_SECRET` thành chuỗi bí mật riêng.
4. Bấm **Deploy**.
5. Chọn **New deployment**.
6. Chọn loại **Web app**.
7. Execute as: **Me**.
8. Who has access: **Anyone** hoặc **Anyone with the link**.
9. Copy Web App URL.
10. Dán URL vào biến môi trường `GAS_API_URL` của Next.js.

---

## 13. Giao diện yêu cầu

### 13.1. Layout tổng thể

Giao diện nên có:

- Sidebar hoặc header trên cùng.
- Dashboard cards:
  - Tổng công cụ
  - Có URL
  - Có ghi chú
  - Có mật khẩu
- Thanh tìm kiếm.
- Bảng danh sách công cụ.
- Panel chi tiết bên phải hoặc modal chi tiết.
- Modal thêm/sửa.

### 13.2. Style

Phong cách:

- Sạch, chuyên nghiệp.
- Nền xám nhạt.
- Card trắng, bo góc lớn.
- Font dễ đọc.
- Nút rõ ràng.
- Màu trạng thái vừa phải.
- Responsive tốt.

### 13.3. Trường hiển thị trong bảng

| Cột | Hiển thị |
|---|---|
| `id` | ID |
| `tenCongCu` | Tên công cụ |
| `taiKhoan` | Tài khoản |
| `matKhau` | Mật khẩu được che |
| `url` | Nút mở link |
| `moTa` | Mô tả |
| `ghiChu` | Ghi chú |
| action | Xem / Sửa / Xóa |

---

## 14. Form thêm/sửa

Form gồm các input:

```txt
tenCongCu
taiKhoan
matKhau
url
moTa
ghiChu
```

Riêng `id`:

- Khi thêm mới: tự sinh bằng Apps Script.
- Khi sửa: giữ nguyên `id`.

Validate cơ bản:

- `tenCongCu` bắt buộc.
- `taiKhoan` không bắt buộc nhưng nên có cảnh báo nếu trống.
- `url` nếu có thì nên đúng định dạng URL.
- `matKhau` có thể trống.

---

## 15. Đăng nhập admin

Có thể làm bản đơn giản trước:

- Login bằng `ADMIN_USERNAME` và `ADMIN_PASSWORD` từ biến môi trường.
- Sau khi login thành công, lưu session bằng cookie HTTP-only nếu có thể.
- Nếu chưa login thì redirect về `/login`.
- Không hiển thị dashboard nếu chưa đăng nhập.

Giai đoạn đầu nếu cần làm nhanh, có thể dùng localStorage, nhưng bản deploy thật nên dùng cookie/session để an toàn hơn.

---

## 16. File `lib/api.js` đề xuất

```js
export async function getTools() {
  const res = await fetch("/api/tools", {
    method: "GET",
    cache: "no-store",
  });

  return res.json();
}

export async function createTool(data) {
  const res = await fetch("/api/tools", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function updateTool(data) {
  const res = await fetch("/api/tools", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function deleteTool(id) {
  const res = await fetch("/api/tools", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  return res.json();
}
```

---

## 17. UI component gợi ý

### Tool object type

```js
const tool = {
  id: "",
  tenCongCu: "",
  taiKhoan: "",
  matKhau: "",
  url: "",
  moTa: "",
  ghiChu: "",
};
```

### Component cần có

- `ToolTable.jsx`
- `ToolDetail.jsx`
- `ToolFormModal.jsx`
- `ConfirmDialog.jsx`
- `AppHeader.jsx`
- `LoginForm.jsx`

---

## 18. Yêu cầu xử lý lỗi

Khi API lỗi, hiển thị thông báo rõ ràng:

- Không kết nối được API.
- Sai API secret.
- Không tìm thấy sheet.
- Không tìm thấy công cụ.
- Thiếu `id`.
- Thiếu `tenCongCu`.
- URL không hợp lệ.

Không để app trắng màn hình khi lỗi.

---

## 19. Yêu cầu bảo mật quan trọng

Dữ liệu đang chứa mật khẩu, tài khoản, API key. Cần lưu ý:

- Không hard-code mật khẩu thật trong frontend.
- Không đưa dữ liệu mẫu thật vào source code.
- Không commit `.env.local`.
- Không hiển thị `matKhau` mặc định.
- Nên có nút copy thay vì hiển thị trực tiếp.
- Nên có quyền admin trước khi sửa/xóa.
- Google Apps Script phải kiểm tra `API_SECRET`.
- Nên đổi `API_SECRET` định kỳ.
- Nếu về sau dữ liệu nhiều và nhạy cảm hơn, nên chuyển sang database thật như Supabase/PostgreSQL và mã hóa mật khẩu.

---

## 20. Lệnh khởi tạo dự án

```bash
npx create-next-app@latest tool-manager
cd tool-manager
npm install lucide-react
npm run dev
```

Nếu dùng shadcn/ui:

```bash
npx shadcn@latest init
npx shadcn@latest add button card input dialog table badge dropdown-menu
```

---

## 21. Deploy Vercel

Các bước:

1. Đẩy source lên GitHub.
2. Vào Vercel.
3. Import project từ GitHub.
4. Framework chọn Next.js.
5. Thêm Environment Variables:
   - `GAS_API_URL`
   - `API_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
6. Deploy.
7. Test các chức năng:
   - Login
   - List
   - Create
   - Update
   - Delete
   - Search
   - Hide/show password

---

## 22. Checklist nghiệm thu

- [ ] Website chạy local bằng `npm run dev`.
- [ ] Giao diện responsive.
- [ ] Kết nối được Google Apps Script.
- [ ] Đọc được dữ liệu từ Sheet `Main`.
- [ ] Thêm dòng mới vào Sheet.
- [ ] Sửa đúng dòng theo `id`.
- [ ] Xóa đúng dòng theo `id`.
- [ ] Tìm kiếm hoạt động.
- [ ] Mật khẩu mặc định bị che.
- [ ] Copy tài khoản/mật khẩu hoạt động.
- [ ] Mở URL ở tab mới.
- [ ] Có thông báo lỗi/thành công.
- [ ] Deploy Vercel thành công.
- [ ] Đã cấu hình biến môi trường trên Vercel.
- [ ] Không commit `.env.local`.

---

## 23. Ghi chú cho Codex

Hãy build dự án hoàn chỉnh theo README này.

Ưu tiên:

1. Chạy được local.
2. Giao diện đẹp, chuyên nghiệp.
3. Kết nối thật với Google Sheet thông qua Apps Script.
4. Có CRUD đầy đủ.
5. Có đăng nhập admin đơn giản.
6. Code rõ ràng, dễ bảo trì.

Không dùng database khác ở giai đoạn đầu. Google Sheet là nguồn dữ liệu chính.

Không đưa dữ liệu nhạy cảm thật vào source code.

---

## 24. Kết quả mong muốn

Sau khi hoàn thành, người dùng có thể:

- Truy cập website đã deploy trên Vercel.
- Đăng nhập admin.
- Xem danh sách công cụ từ Google Sheet.
- Thêm/sửa/xóa công cụ.
- Copy tài khoản/mật khẩu.
- Mở nhanh link công cụ.
- Quản lý toàn bộ dữ liệu theo đúng các cột trong sheet `Main`.
