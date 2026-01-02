# Hướng dẫn Upload Code lên GitHub

## Bước 1: Khởi tạo Git Repository (Đã hoàn thành ✅)

Repository đã được khởi tạo trong thư mục project.

## Bước 2: Kiểm tra và cấu hình Git

### 2.1. Cấu hình Git (nếu chưa có)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2.2. Kiểm tra file .gitignore
File `.gitignore` đã có và sẽ bỏ qua:
- `node_modules/`
- `.env*` (quan trọng - không commit environment variables)
- `.next/`
- Các file build và log

## Bước 3: Thêm files vào Git

```bash
# Xem các file sẽ được thêm
git status

# Thêm tất cả files (trừ những file trong .gitignore)
git add .

# Hoặc thêm từng file cụ thể
git add package.json
git add app/
git add components/
# ...
```

## Bước 4: Commit code

```bash
# Commit với message mô tả
git commit -m "Initial commit: DeFi Crowdfunding App"

# Hoặc commit chi tiết hơn
git commit -m "Initial commit: DeFi Crowdfunding App with Supabase integration, Updates and Comments features"
```

## Bước 5: Tạo Repository trên GitHub

1. Đăng nhập vào [GitHub](https://github.com)
2. Click nút **"+"** ở góc trên bên phải → **"New repository"**
3. Điền thông tin:
   - **Repository name**: `defi-crowdfunding-app` (hoặc tên bạn muốn)
   - **Description**: "DeFi Crowdfunding Platform with Supabase"
   - **Visibility**: Public hoặc Private
   - **KHÔNG** check "Initialize this repository with a README" (vì đã có code)
4. Click **"Create repository"**

## Bước 6: Kết nối và Push lên GitHub

Sau khi tạo repository, GitHub sẽ hiển thị hướng dẫn. Chạy các lệnh sau:

```bash
# Thêm remote repository (thay YOUR_USERNAME và REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Đổi tên branch chính thành main (nếu cần)
git branch -M main

# Push code lên GitHub
git push -u origin main
```

**Lưu ý**: Nếu GitHub yêu cầu authentication:
- Sử dụng **Personal Access Token** thay vì password
- Hoặc sử dụng **SSH key** (khuyến nghị)

## Bước 7: Xác nhận

Kiểm tra trên GitHub xem code đã được upload chưa.

---

## Các lệnh Git thường dùng

### Xem trạng thái
```bash
git status
```

### Xem lịch sử commit
```bash
git log
```

### Thêm file mới sau khi đã commit
```bash
git add .
git commit -m "Add new feature"
git push
```

### Tạo branch mới
```bash
git checkout -b feature/new-feature
git push -u origin feature/new-feature
```

### Cập nhật code từ GitHub
```bash
git pull origin main
```

---

## Lưu ý quan trọng

### ⚠️ KHÔNG commit các file sau:
- `.env.local` - Chứa secrets
- `node_modules/` - Quá lớn
- `.next/` - Build files
- Các file cá nhân

### ✅ Nên commit:
- Source code (`.ts`, `.tsx`, `.js`, `.jsx`)
- Configuration files (`package.json`, `tsconfig.json`)
- Documentation (`.md` files)
- Public assets

---

## Troubleshooting

### Lỗi: "fatal: remote origin already exists"
```bash
# Xóa remote cũ
git remote remove origin

# Thêm lại
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Lỗi: "Authentication failed"
- Sử dụng Personal Access Token thay vì password
- Hoặc setup SSH key

### Lỗi: "failed to push some refs"
```bash
# Pull code mới nhất trước
git pull origin main --rebase

# Sau đó push lại
git push origin main
```

---

## Tạo Personal Access Token (nếu cần)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Chọn quyền: `repo` (full control)
4. Copy token và dùng thay password khi push

---

## Setup SSH Key (Khuyến nghị)

1. Tạo SSH key:
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

2. Copy public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

3. Thêm vào GitHub: Settings → SSH and GPG keys → New SSH key

4. Sử dụng SSH URL:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

