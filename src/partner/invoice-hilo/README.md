# HILO Invoice Integration

Tích hợp hóa đơn điện tử với đối tác HILO dựa trên tài liệu API HDDT_API Tích hợp 15012025.md

## Cấu trúc thư mục

```
invoice-hilo/
├── constants/
│   └── hilo.constants.ts          # Các hằng số và cấu hình
├── dto/
│   ├── export.dto.ts              # DTO cho tạo hóa đơn
│   ├── cancel.dto.ts              # DTO cho hủy hóa đơn
│   ├── update.dto.ts              # DTO cho điều chỉnh hóa đơn
│   └── response.dto.ts            # DTO cho response từ API
├── service/
│   └── third-party-hilo.service.ts # Service chính xử lý logic
├── utils/
│   └── hilo.helper.ts             # Các utility functions
├── module.ts                      # Module configuration
└── README.md                      # Tài liệu hướng dẫn
```

## Tính năng chính

### 1. Tạo hóa đơn (Draft Invoice)
- Tạo hóa đơn nháp
- Ký hóa đơn bằng HSM
- Hỗ trợ nhiều loại hóa đơn (GTGT, bán hàng, phiếu thu)

### 2. Hủy hóa đơn
- Hủy hóa đơn đã phát hành
- Ghi nhận lý do hủy

### 3. Điều chỉnh hóa đơn
- Điều chỉnh tăng/giảm
- Điều chỉnh thông tin
- Tạo hóa đơn thay thế

### 4. Truy xuất thông tin
- Lấy chi tiết hóa đơn
- Tải file PDF
- Tải file XML

## Cấu hình

### Environment Variables

```env
# Hilo API Configuration
CONFIG_HILO_INVOICE_LOGIN_PATH=/api/auth/login
HILO_API_ENDPOINT=https://api.hilo.vn
HILO_API_TIMEOUT=30000
```

### Database Configuration

Thêm cấu hình đối tác HILO vào bảng `restaurant_partner_invoice`:

```sql
INSERT INTO restaurant_partner_invoice (
  restaurant_id,
  partner_type,
  endpoint,
  username,
  password,
  tax_code,
  is_active
) VALUES (
  'your_restaurant_id',
  6, -- HILO enum value
  'https://api.hilo.vn',
  'your_username',
  'your_password',
  'your_tax_code',
  true
);
```

## Sử dụng

### 1. Import Module

```typescript
import { HiloInvoiceModule } from './partner/invoice-hilo/module';

@Module({
  imports: [
    HiloInvoiceModule,
    // other modules
  ],
})
export class AppModule {}
```

### 2. Sử dụng Service

```typescript
import { ThirdPartyFactory } from './partner/factory/Third-party-factory';
import { PartnerElectronicInvoiceTypeEnum } from './restaurant-service/restaurant-partner-invoice/partner-electronic-invoice.enum/partner-electronic-invoice-type.enum';

// Lấy service instance
const hiloService = await ThirdPartyFactory.ThirdParty(
  PartnerElectronicInvoiceTypeEnum.HILO
);

// Tạo hóa đơn
const result = await hiloService.export({
  token: 'access_token',
  invoice: invoiceData,
  exportInvoiceDTO: exportDto,
  restaurantPartnerInvoiceEntity: partnerConfig
});
```

## API Endpoints

| Chức năng | Method | Endpoint | Mô tả |
|-----------|--------|----------|-------|
| Đăng nhập | POST | `/api/auth/login` | Xác thực và lấy token |
| Tạo hóa đơn nháp | POST | `/api/invoices/draft` | Tạo hóa đơn nháp |
| Ký hóa đơn | POST | `/api/invoices/sign` | Ký hóa đơn bằng HSM |
| Hủy hóa đơn | POST | `/api/invoices/cancel` | Hủy hóa đơn |
| Điều chỉnh hóa đơn | POST | `/api/invoices/adjust` | Điều chỉnh hóa đơn |
| Chi tiết hóa đơn | GET | `/api/invoices/{id}` | Lấy thông tin hóa đơn |
| Tải PDF | GET | `/api/invoices/pdf/{id}` | Tải file PDF |
| Tải XML | GET | `/api/invoices/xml/{id}` | Tải file XML |

## Validation Rules

### Mã số thuế
- Định dạng: 10 hoặc 13 chữ số
- Pattern: `/^\d{10}$|^\d{13}$/`

### Ký hiệu hóa đơn (Pattern)
- Độ dài: 1-6 ký tự
- Pattern: `/^[A-Z0-9]{1,6}$/`

### Số seri (Serial)
- Độ dài: 2-6 ký tự
- Pattern: `/^[A-Z0-9]{2,6}$/`

### Số điện thoại
- Pattern: `/^(0|\+84)[0-9]{9,10}$/`

### Email
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

## Error Handling

### Mã lỗi thường gặp

| Mã lỗi | Mô tả | Xử lý |
|--------|-------|-------|
| AUTH_001 | Xác thực thất bại | Kiểm tra username/password |
| AUTH_002 | Token không hợp lệ | Đăng nhập lại |
| AUTH_003 | Token hết hạn | Refresh token |
| INV_001 | Dữ liệu hóa đơn không hợp lệ | Kiểm tra validation |
| INV_002 | Không tìm thấy hóa đơn | Kiểm tra ID hóa đơn |
| INV_003 | Hóa đơn đã được ký | Không thể chỉnh sửa |
| TAX_001 | Mã số thuế không hợp lệ | Kiểm tra format MST |

## Testing

### Unit Tests

```bash
npm run test -- --testPathPattern=hilo
```

### Integration Tests

```bash
npm run test:e2e -- --testPathPattern=hilo
```

## Monitoring

### Logs

Service sử dụng `InvoiceHandlerException` để log errors:

```typescript
try {
  // API call
} catch (error) {
  throw new InvoiceHandlerException(error, 'Hilo operation name');
}
```

### Metrics

- Response time
- Success/failure rates
- Error distribution

## Security

### Authentication
- Sử dụng Bearer token
- Token có thời hạn
- Hỗ trợ refresh token

### Data Protection
- Mã hóa dữ liệu nhạy cảm
- Validate input data
- Sanitize output data

## Troubleshooting

### Lỗi kết nối
1. Kiểm tra endpoint URL
2. Kiểm tra network connectivity
3. Kiểm tra firewall settings

### Lỗi xác thực
1. Kiểm tra username/password
2. Kiểm tra tax code
3. Kiểm tra token expiration

### Lỗi validation
1. Kiểm tra format dữ liệu
2. Kiểm tra required fields
3. Kiểm tra business rules

## Changelog

### Version 1.0.0
- Initial implementation
- Support for basic invoice operations
- HSM signing integration
- Error handling and validation

## Support

Liên hệ team development để được hỗ trợ:
- Email: dev@techres.vn
- Slack: #invoice-integration