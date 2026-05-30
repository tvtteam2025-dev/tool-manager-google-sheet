# Work Tools Manager

Website Next.js quản lý công cụ làm việc nội bộ, dùng Google Sheet làm database thông qua Google Apps Script Web App.

## Chạy local

1. Cài dependencies:

```powershell
npm install
```

2. Tạo file `.env.local` từ `.env.local.example`:

```env
GAS_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
API_SECRET=your_private_api_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
SESSION_SECRET=change_this_long_random_string
```

3. Chạy dev server:

```powershell
npm run dev
```

4. Mở:

```text
http://localhost:3000
```

## Google Apps Script

1. Mở Google Apps Script.
2. Dán nội dung `google-apps-script/Code.gs`.
3. Đổi `CONFIG.API_SECRET` trùng với `.env.local`.
4. Deploy dạng Web app.
5. Copy Web App URL vào `GAS_API_URL`.

Sheet `Main` cần các cột:

```text
id, tenCongCu, taiKhoan, matKhau, url, moTa, ghiChu
```

## API nội bộ

Frontend chỉ gọi:

```text
GET    /api/tools
POST   /api/tools
PUT    /api/tools
DELETE /api/tools
```

`API_SECRET` chỉ nằm ở server Next.js, không lộ trên trình duyệt.
