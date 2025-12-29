# Dynamic Queue System for Invoice Processing

## Tổng quan

Hệ thống queue động cho phép xử lý invoice theo từng nhà hàng (restaurant_id) một cách độc lập và hiệu quả.

## Kiến trúc

### 1. InvoiceQueueSendConsumer (Dynamic Processor)
- **File**: `invoice-queue.processor.ts`
- **Chức năng**: Quản lý và xử lý các queue động cho từng restaurant
- **Tính năng chính**:
  - Tự động khởi tạo processor cho default queue
  - Tạo processor động cho từng restaurant khi cần
  - Xử lý job với pattern matching linh hoạt
  - Logging chi tiết cho việc debug

### 2. QueueManagerService
- **File**: `queue-manager.service.ts`
- **Chức năng**: Quản lý việc tạo và quản lý các queue
- **Methods chính**:
  - `getOrCreateRestaurantQueue(restaurantId)`: Tạo queue riêng cho restaurant
  - `getDefaultQueue()`: Lấy default queue

### 3. CronJobService
- **File**: `cron-job.service.ts`
- **Chức năng**: Thêm job vào queue phù hợp
- **Logic**:
  - Đảm bảo processor được khởi tạo trước khi add job
  - Add job với tên có restaurant_id để phân biệt

## Cách hoạt động

### 1. Khởi tạo System
```typescript
// Khi module khởi động
1. InvoiceQueueSendConsumer.onModuleInit() được gọi
2. Khởi tạo processor cho default queue
3. Sẵn sàng xử lý job
```

### 2. Thêm Job cho Restaurant
```typescript
// Trong CronJobService
1. Gọi invoiceQueueProcessor.ensureRestaurantProcessor(restaurantId)
2. Tạo queue riêng cho restaurant (nếu chưa có)
3. Add job với tên: `invoice-queue-send_${restaurantId}`
```

### 3. Xử lý Job
```typescript
// Processor tự động nhận job và xử lý
1. processInvoiceJob() được gọi
2. Kiểm tra pattern job name
3. Gọi processSend() với context phù hợp
4. Logging chi tiết quá trình xử lý
```

## Job Naming Convention

- **Default job**: `invoice-queue-send`
- **Restaurant job**: `invoice-queue-send_${restaurant_id}`
- **Queue name**: `invoice_send_third_party_queue_restaurant_${restaurant_id}`

## Logging

Tất cả các hoạt động được log với prefix `[DYNAMIC-PROCESSOR]` để dễ dàng theo dõi:

```
[DYNAMIC-PROCESSOR] Initializing dynamic queue processor
[DYNAMIC-PROCESSOR] Successfully initialized queue processor for restaurant 123
[DYNAMIC-PROCESSOR] Processing job invoice-queue-send_123 via restaurant_123
```

## Lợi ích

1. **Isolation**: Mỗi restaurant có queue riêng, tránh ảnh hưởng lẫn nhau
2. **Scalability**: Có thể scale theo số lượng restaurant
3. **Monitoring**: Dễ dàng monitor từng restaurant riêng biệt
4. **Error Handling**: Lỗi ở một restaurant không ảnh hưởng đến restaurant khác
5. **Performance**: Xử lý song song nhiều restaurant

## Cấu hình

### Environment Variables
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Queue Options
```typescript
const jobOptions = {
  removeOnComplete: true,
  removeOnFail: true,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 500
  }
};
```

## Troubleshooting

### 1. Processor không nhận job
- Kiểm tra queue name có đúng không
- Kiểm tra job name pattern matching
- Xem log `[DYNAMIC-PROCESSOR]` để debug

### 2. Memory leak
- Kiểm tra `dynamicQueues` Map có được cleanup không
- Monitor số lượng queue được tạo

### 3. Performance issues
- Kiểm tra concurrency setting (hiện tại: 5)
- Monitor Redis memory usage
- Kiểm tra job processing time

## Migration từ hệ thống cũ

1. Hệ thống cũ vẫn hoạt động như fallback
2. Từ từ migrate các restaurant sang dynamic queue
3. Monitor và so sánh performance
4. Cleanup hệ thống cũ khi stable