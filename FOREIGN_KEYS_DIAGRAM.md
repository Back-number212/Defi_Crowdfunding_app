# Sơ đồ Foreign Keys - CrowdFundX Database

## Mối quan hệ giữa các bảng

```
creators (Bảng gốc)
├── wallet_address (PRIMARY KEY)
│
├── campaigns
│   ├── creator_wallet → creators.wallet_address (FK)
│   │
│   ├── updates
│   │   ├── campaign_id → campaigns.campaign_id (FK)
│   │   └── creator_wallet → creators.wallet_address (FK)
│   │
│   └── comments
│       ├── campaign_id → campaigns.campaign_id (FK)
│       ├── author_wallet → creators.wallet_address (FK)
│       └── parent_id → comments.id (FK - Self-referencing for replies)
│           │
│           └── comment_reactions
│               ├── comment_id → comments.id (FK)
│               └── user_wallet → creators.wallet_address (FK)
```

## Chi tiết Foreign Keys

### 1. campaigns → creators
- **Column**: `creator_wallet`
- **References**: `creators.wallet_address`
- **On Delete**: CASCADE
- **Mô tả**: Mỗi campaign phải thuộc về một creator

### 2. updates → campaigns
- **Column**: `campaign_id`
- **References**: `campaigns.campaign_id`
- **On Delete**: CASCADE
- **Mô tả**: Mỗi update thuộc về một campaign

### 3. updates → creators
- **Column**: `creator_wallet`
- **References**: `creators.wallet_address`
- **On Delete**: CASCADE
- **Mô tả**: Mỗi update được tạo bởi một creator

### 4. comments → campaigns
- **Column**: `campaign_id`
- **References**: `campaigns.campaign_id`
- **On Delete**: CASCADE
- **Mô tả**: Mỗi comment thuộc về một campaign

### 5. comments → creators
- **Column**: `author_wallet`
- **References**: `creators.wallet_address`
- **On Delete**: CASCADE
- **Mô tả**: Mỗi comment được viết bởi một creator/user

### 6. comments → comments (Self-referencing)
- **Column**: `parent_id`
- **References**: `comments.id`
- **On Delete**: CASCADE
- **Mô tả**: Cho phép reply comments (nested comments)

### 7. comment_reactions → comments
- **Column**: `comment_id`
- **References**: `comments.id`
- **On Delete**: CASCADE
- **Mô tả**: Mỗi reaction thuộc về một comment

### 8. comment_reactions → creators
- **Column**: `user_wallet`
- **References**: `creators.wallet_address`
- **On Delete**: CASCADE
- **Mô tả**: Mỗi reaction được tạo bởi một user

## Các ràng buộc (Constraints)

### Unique Constraints
- `creators.wallet_address` - UNIQUE (mỗi wallet chỉ có một creator record)
- `campaigns.campaign_id` - UNIQUE (mỗi campaign_id từ smart contract chỉ có một record)
- `comment_reactions(comment_id, user_wallet, reaction_type)` - UNIQUE (mỗi user chỉ có một loại reaction cho mỗi comment)

### Cascade Delete Behavior
- Khi xóa một creator → Tự động xóa tất cả campaigns, updates, comments, và reactions của creator đó
- Khi xóa một campaign → Tự động xóa tất cả updates và comments của campaign đó
- Khi xóa một comment → Tự động xóa tất cả reactions và replies (child comments) của comment đó

## Lợi ích của Foreign Keys

1. **Data Integrity**: Đảm bảo dữ liệu nhất quán, không có orphan records
2. **Referential Integrity**: Tự động kiểm tra khi insert/update/delete
3. **Cascade Operations**: Tự động xóa dữ liệu liên quan khi xóa parent record
4. **Query Optimization**: Database có thể tối ưu hóa queries với foreign keys
5. **Documentation**: Làm rõ mối quan hệ giữa các bảng

## Lưu ý

- Tất cả foreign keys đều sử dụng `ON DELETE CASCADE` để đảm bảo dữ liệu được dọn dẹp tự động
- Khi xóa một creator, tất cả dữ liệu liên quan sẽ bị xóa (campaigns, updates, comments, reactions)
- Khi xóa một campaign, tất cả updates và comments sẽ bị xóa
- Khi xóa một comment, tất cả reactions và replies sẽ bị xóa

