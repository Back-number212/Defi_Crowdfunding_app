# Hướng dẫn Setup Supabase cho CrowdFundX

## Bước 1: Tạo Supabase Project

1. Truy cập [Supabase](https://supabase.com) và đăng nhập
2. Tạo một project mới
3. Lưu lại **Project URL** và **anon/public key**

## Bước 2: Chạy SQL Schema

1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy toàn bộ nội dung từ file `supabase-schema.sql`
3. Paste vào SQL Editor và chạy (Run)

Schema này sẽ tạo các bảng:
- `creators` - Thông tin chủ dự án
- `campaigns` - Thông tin chiến dịch
- `updates` - Cập nhật tiến trình từ chủ dự án
- `comments` - Bình luận từ cộng đồng
- `comment_reactions` - Cảm xúc/bày tỏ cảm xúc cho comments

## Bước 3: Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục root của project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Lưu ý:** Restart dev server sau khi thêm environment variables!

## Bước 4: (Tùy chọn) Cấu hình Supabase Storage cho Images

Để upload hình ảnh đúng cách, bạn cần:

1. Vào **Storage** trong Supabase Dashboard
2. Tạo bucket mới tên `campaign-images` với public access
3. Cập nhật code trong `lib/supabase-services.ts` để upload images vào Storage thay vì dùng base64

## Bước 5: Kiểm tra

1. Khởi động dev server: `npm run dev`
2. Mở một chiến dịch và kiểm tra:
   - Tab "Cập nhật tiến trình" - Chủ dự án có thể tạo cập nhật
   - Tab "Bình luận" - Mọi người có thể bình luận và bày tỏ cảm xúc

## Tính năng

### Updates (Cập nhật tiến trình)
- ✅ Chỉ chủ dự án có thể tạo cập nhật
- ✅ Có thể thêm tiêu đề, nội dung và hình ảnh
- ✅ Chủ dự án có thể xóa cập nhật của mình
- ✅ Hiển thị thời gian đăng

### Comments (Bình luận)
- ✅ Mọi người có thể bình luận bằng text hoặc hình ảnh
- ✅ Tên chủ dự án có màu khác và badge "Creator"
- ✅ Có thể xóa bình luận của chính mình
- ✅ Bày tỏ cảm xúc: Like, Love, Haha, Wow, Sad, Angry
- ✅ Hiển thị số lượng reactions

## Troubleshooting

### Lỗi: "Missing Supabase environment variables"
- Kiểm tra file `.env.local` đã được tạo chưa
- Đảm bảo tên biến đúng: `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server

### Lỗi: "relation does not exist"
- Chạy lại SQL schema trong Supabase SQL Editor

### Lỗi: "new row violates row-level security policy"
- Kiểm tra RLS policies trong Supabase
- Có thể tạm thời disable RLS để test (không khuyến khích cho production)

### Images không hiển thị
- Hiện tại code dùng base64 (tạm thời)
- Cần implement Supabase Storage upload cho production

