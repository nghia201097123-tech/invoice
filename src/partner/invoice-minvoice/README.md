# M-Invoice Integration - Updated Implementation

## Tổng quan

Module này đã được cập nhật để tuân thủ đầy đủ tài liệu M-Invoice API v1.0.9, bao gồm các trường dữ liệu mới theo Nghị định 70 (ND70) và Nghị quyết 101 (NQ101).

## Các cập nhật chính

### 1. DTO Updates

#### ExportInvoiceDTO (`export.dto.ts`)
- ✅ Thêm các trường bắt buộc: `editmode`, `inv_invoiceNumber`, `key_api`
- ✅ Thêm thông tin người mua: `ma_dt`, `buyerIdentityCard`, `buyerTel`, `sobaomat`
- ✅ Thêm các trường theo NQ101: `tlptdoanhthu20`, `tgtck20`, `isDeductionNQ43`
- ✅ Thêm các trường theo ND70: `ma_ch`, `ten_ch`, `dchicuahang`, `mdvqhnsach_nmua`, `so_hchieu`, `cccdan`, `socialDeductionAmount`, `ratioOrtherTax`, `ortherFee`, `mdvqhnsach_nban`, `so_qdinh`, `ngay_qdinh`, `cqbhanh_qdinh`
- ✅ Cập nhật constructor với giá trị mặc định từ MINVOICE_DEFAULTS

#### InvoiceDetailDTO (`map_intem_detail.dto.ts`)
- ✅ Thêm các trường bắt buộc: `inv_unitName`, `inv_Amount`
- ✅ Thêm các trường chi tiết: `inv_promotion`, `inv_vatRateDeduction`, `inv_vatAmountDeduction`
- ✅ Thêm các trường theo ND70: `inv_purity`, `inv_weight`, `inv_labourCode`
- ✅ Thêm phương thức `mapCommodityNatureType` và `mapVatRateToTaxCode`
- ✅ Cập nhật constructor với logic tính toán đầy đủ

### 2. API Endpoints

#### Đã implement:
- ✅ `POST /InvoiceApi78/Save` - Tạo hóa đơn
- ✅ `GET /InvoiceApi78/GetDetail` - Lấy chi tiết hóa đơn
- ✅ `POST /InvoiceApi78/Cancel` - Hủy hóa đơn
- ✅ `POST /InvoiceApi78/Update` - Điều chỉnh hóa đơn
- ✅ `GET /InvoiceApi78/GetTypeInvoiceSeries` - Lấy danh sách loại hóa đơn (mới)

### 3. Validation

#### Cập nhật `MInvoiceValidation` class:
- ✅ Validation mã thuế suất sử dụng TaxCode enum
- ✅ Thêm phương thức `validateExportInvoice` cho validation toàn diện
- ✅ Thêm phương thức `validateInvoiceDetail` cho validation chi tiết
- ✅ Sử dụng constants từ `minvoice.constants.ts`
- ✅ Validation field length và format patterns
- ✅ Error handling với thông báo chi tiết

### 4. Constants

#### Cập nhật `minvoice.constants.ts`:
- ✅ Cập nhật enum EditMode và TaxCode theo tài liệu
- ✅ Thêm VAT_RATE_MAPPING cho ánh xạ thuế suất
- ✅ Thêm VAT_DEDUCTION_RATES cho NQ101
- ✅ Thêm FIELD_MAX_LENGTHS cho validation độ dài
- ✅ Thêm VALIDATION_MESSAGES cho thông báo lỗi
- ✅ Cập nhật MINVOICE_DEFAULTS với giá trị mặc định đầy đủ
- ✅ Default values

## Cách sử dụng

### 1. Tạo hóa đơn

```typescript
import { ThirdPartyMinVoice } from './service/third-party-minvoice.service';
import { InvoiceConvertPartnerMInvoiceDTO } from './dto/export.dto';

const minvoiceService = new ThirdPartyMinVoice();

// Tạo DTO với validation tự động
const exportDto = new InvoiceConvertPartnerMInvoiceDTO(
  exportInvoiceDTO,
  invoiceDetails
);

// Gửi hóa đơn (có validation)
const result = await minvoiceService.export({
  invoice,
  invoiceDetails
});
```

### 2. Lấy danh sách loại hóa đơn

```typescript
import { GetTypeInvoiceSeriesRequestDTO } from './dto/get-type-invoice-series.dto';

const request: GetTypeInvoiceSeriesRequestDTO = {
  key_api: 'your-api-key',
  tax_code: 'company-tax-code'
};

const series = await minvoiceService.getTypeInvoiceSeries(request);
```

### 3. Validation thủ công

```typescript
import { MInvoiceValidation } from './validation/minvoice.validation';

// Validate mã thuế
const isValidTax = MInvoiceValidation.validateTaxCode('10%');

// Validate email
const isValidEmail = MInvoiceValidation.validateEmail('test@example.com');

// Validate toàn bộ DTO
MInvoiceValidation.validateExportInvoice(exportDto);
```

## Các trường dữ liệu mới

### Theo Nghị định 70 (ND70):
- `so_hchieu`: Số hộ chiếu
- `cccdan`: Căn cước công dân
- `socialDeductionAmount`: Phí vận chuyển
- `ratioOrtherTax`: Thuế tiêu thụ đặc biệt (%)
- `ortherFee`: Tiền thuế tiêu thụ đặc biệt
- `mdvqhansach_nban`: Mã đơn vị quan hệ ngân sách
- `so_qdinh`: Số quyết định
- `ngay_qdinh`: Ngày quyết định
- `cqbhanh_qdinh`: Cơ quan ban hành quyết định

### Theo Nghị quyết 101 (NQ101):
- `inv_vatRateDeduction`: Tỷ lệ % thuế GTGT trên doanh thu áp dụng cho hóa đơn bán hàng có giảm thuế GTGT

### Vận chuyển và kho:
- `dd_vchuyen`: Địa điểm vận chuyển
- `tg_vchuyen`: Ngày bắt đầu vận chuyển
- `tg_vchuyen_den`: Ngày vận chuyển đến
- `tnvchuyen`: Tên người vận chuyển
- `ptvchuyen`: Phương tiện vận chuyển
- `dckhoxuat`: Địa chỉ kho xuất
- `dckhonhap`: Địa chỉ kho nhập
- `sohopdong`: Hợp đồng vận chuyển
- `hvtnxhang`: Tên người xuất hàng

## Mã thuế suất hợp lệ

- `0%`: Thuế suất 0%
- `5%`: Thuế suất 5%
- `8%`: Thuế suất 8%
- `10%`: Thuế suất 10%
- `KCT`: Không chịu thuế
- `KKKNT`: Không kê khai không nộp thuế
- `GTGT`: Thuế GTGT

## Error Handling

Tất cả các phương thức đều có error handling với:
- Validation errors (BadRequestException)
- API errors từ M-Invoice
- Network errors
- Logging chi tiết cho debugging

## Testing

Để test integration:

1. Đảm bảo có API key hợp lệ
2. Kiểm tra network connectivity đến M-Invoice API
3. Test với dữ liệu mẫu hợp lệ
4. Verify validation rules

## Migration Notes

Khi migrate từ version cũ:

1. Cập nhật các DTO calls để include các trường mới
2. Thêm validation cho mã thuế suất
3. Cập nhật error handling
4. Test thoroughly với dữ liệu production

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs để xem validation errors
2. Verify API key và network connectivity
3. Đảm bảo dữ liệu input đúng format
4. Tham khảo tài liệu M-Invoice API v1.0.9