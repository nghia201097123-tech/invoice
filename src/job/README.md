# Restaurant Queue Management System

## Tổng quan

Hệ thống quản lý queue riêng biệt cho từng nhà hàng, cho phép xử lý hóa đơn một cách độc lập và có thể cấu hình riêng cho từng nhà hàng.

## Tính năng chính

### 1. Queue riêng cho từng nhà hàng
- Mỗi nhà hàng có queue riêng biệt
- Isolation hoàn toàn giữa các nhà hàng
- Tránh ảnh hưởng lẫn nhau khi có lỗi

### 2. Cấu hình linh hoạt
- **Regular restaurants**: Cấu hình tiêu chuẩn với delay để tránh overwhelm
- Có thể tùy chỉnh cho từng nhà hàng

### 3. Monitoring và Management
- API endpoints để monitor queue stats
- Pause/Resume queue của từng nhà hàng
- Health check tổng thể
- Cleanup tự động

## Cấu trúc Code

```
src/job/
├── controllers/
│   └── queue-management.controller.ts    # API endpoints quản lý queue
├── services/
│   └── queue-manager.service.ts          # Service quản lý queue động
├── task/
│   └── cron-job.service.ts              # Cron job chính (đã cập nhật)
├── enums/
│   └── task.enum.ts                     # Enum định nghĩa queue names
└── job.module.ts                        # Module configuration
```

## Cách hoạt động

### 1. Cron Job (mỗi 10 giây)
```typescript
@Cron(CronExpression.EVERY_10_SECONDS)
async autoSendThirdParty() {
  // Lấy danh sách nhà hàng từ cache/database
  // Với mỗi nhà hàng:
  //   1. Tìm hóa đơn cần gửi
  //   2. Tạo/lấy queue riêng cho nhà hàng
  //   3. Thêm job vào queue với cấu hình riêng
}
```

### 2. Queue Manager
```typescript
// Tự động tạo queue cho nhà hàng nếu chưa có
const queue = await queueManagerService.getOrCreateRestaurantQueue(restaurantId);

// Thêm job với cấu hình riêng
await queue.add(jobName, jobData, {
  priority: getRestaurantPriority(restaurant),
  attempts: getRestaurantRetryAttempts(restaurant),
  delay: getRestaurantJobDelay(restaurant)
});
```

### 3. Cấu hình theo loại nhà hàng

#### VIP Restaurant:
- **Priority**: 10 (cao)
- **Retry attempts**: 5 lần
- **Backoff delay**: 300ms
- **Job delay**: 0ms (xử lý ngay)

#### Regular Restaurant:
- **Priority**: 1 (thấp)
- **Retry attempts**: 3 lần
- **Backoff delay**: 500ms
- **Job delay**: 100ms (tránh overwhelm)

## API Endpoints

### 1. Monitoring
```bash
# Lấy thống kê tất cả queue
GET /queue-management/stats

# Lấy thống kê queue của nhà hàng cụ thể
GET /queue-management/stats/{restaurantId}

# Kiểm tra health của queue system
GET /queue-management/health
```

### 2. Management
```bash
# Tạm dừng queue của nhà hàng
POST /queue-management/pause/{restaurantId}

# Tiếp tục queue của nhà hàng
POST /queue-management/resume/{restaurantId}

# Dọn dẹp queue không sử dụng
POST /queue-management/cleanup

# Kích hoạt gửi hóa đơn thủ công
POST /queue-management/trigger-manual-send
```

## Cron Jobs

### 1. Auto Send (mỗi 10 giây)
```typescript
@Cron(CronExpression.EVERY_10_SECONDS)
async autoSendThirdParty()
```
Xử lý gửi hóa đơn tự động cho tất cả nhà hàng.

### 2. Cleanup (mỗi ngày lúc 2AM)
```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async cleanupUnusedQueues()
```
Dọn dẹp queue không sử dụng để tiết kiệm tài nguyên.

## Lợi ích

### 1. **Isolation**
- Lỗi ở nhà hàng A không ảnh hưởng nhà hàng B
- Có thể pause/resume từng nhà hàng độc lập

### 2. **Scalability**
- Dễ dàng thêm nhà hàng mới
- Queue tự động được tạo khi cần

### 3. **Flexibility**
- Cấu hình riêng cho từng nhà hàng
- VIP treatment cho nhà hàng quan trọng

### 4. **Monitoring**
- Theo dõi performance từng nhà hàng
- Phát hiện vấn đề sớm

### 5. **Reliability**
- Fallback về queue chung nếu có lỗi
- Retry logic thông minh

## Migration từ hệ thống cũ

### Backward Compatibility
- Giữ lại method `sendInvoiceToThirdParty()` làm fallback
- Queue chung vẫn hoạt động bình thường
- Không breaking changes

### Rollback Plan
- Có thể tắt tính năng queue riêng bằng cách comment code
- Fallback tự động về queue chung khi có lỗi

## Monitoring và Troubleshooting

### 1. Logs
```bash
# Logs khi tạo queue mới
"Created dedicated queue for restaurant 123: invoice_send_third_party_queue_123"

# Logs khi thêm job
"Added 5 invoices to dedicated queue for restaurant 123"

# Logs khi có lỗi
"Error adding job to restaurant queue for 123: [error details]"
```

### 2. Health Check
```json
{
  "success": true,
  "data": {
    "totalQueues": 15,
    "activeQueues": 3,
    "failedJobs": 2,
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Queue Stats
```json
{
  "restaurantId": "123",
  "queueName": "invoice_send_third_party_queue_123",
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 1
  }
}
```

## Best Practices

### 1. **Resource Management**
- Cleanup queue định kỳ
- Monitor memory usage
- Limit số lượng queue đồng thời

### 2. **Error Handling**
- Luôn có fallback plan
- Log chi tiết để debug
- Graceful degradation

### 3. **Performance**
- Sử dụng cache cho restaurant config
- Batch processing khi có thể
- Monitor queue depth

### 4. **Security**
- Validate restaurant ID
- Rate limiting cho API endpoints
- Access control cho management APIs

## Kết luận

Hệ thống queue riêng cho từng nhà hàng mang lại nhiều lợi ích về isolation, scalability và flexibility. Với thiết kế backward compatible và fallback mechanisms, việc migration sẽ an toàn và không gây gián đoạn service.