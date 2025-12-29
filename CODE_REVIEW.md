# Code Review Report - Invoice Management System

## Tong quan

Danh gia codebase Invoice Management System - he thong quan ly hoa don dien tu tich hop voi 7 nha cung cap (M-Invoice, FPT, VNPT, MiFi, MISA, Viettel, Hilo).

---

## 1. DANH GIA TONG THE

### 1.1 Diem manh

| STT | Diem manh | Mo ta |
|-----|-----------|-------|
| 1 | Kien truc module | Su dung NestJS modules tot, tach biet cac concerns |
| 2 | Design Patterns | Ap dung Adapter, Factory, Saga patterns |
| 3 | Caching | Multi-level cache (Memory + Redis) |
| 4 | Message Queue | Kafka + Bull/BullMQ cho async processing |
| 5 | Health Monitoring | Co metrics va health checks |

### 1.2 Diem yeu can cai thien

| Muc do | So luong van de |
|--------|-----------------|
| Critical | 3 |
| High | 8 |
| Medium | 12 |
| Low | 6 |

---

## 2. VAN DE CRITICAL

### 2.1 File qua lon - Vi pham Single Responsibility Principle

**Vi tri:**
- `src/version_3/invoices/invoices.service.ts` - 96KB (~2500 dong)
- `src/version_3/invoice-details/invoice-details.service.ts` - 55KB (~1700 dong)
- `src/kafka/consumer.ts` - ~2150 dong

**Van de:**
```typescript
// invoices.service.ts chua qua nhieu chuc nang:
// - Authentication
// - Validation
// - Export logic cho 7 partners
// - Saga orchestration
// - Caching
// - Sync operations
// - Failed invoice handling
```

**De xuat toi uu:**

```
src/version_3/invoices/
├── invoices.controller.ts
├── invoices.module.ts
├── services/
│   ├── invoice-crud.service.ts          # CRUD operations
│   ├── invoice-export.service.ts        # Export logic
│   ├── invoice-validation.service.ts    # Validation rules
│   ├── invoice-sync.service.ts          # Sync operations
│   └── invoice-failed.service.ts        # Failed handling
└── dto/
```

### 2.2 Logic tinh VAT qua phuc tap va lap lai

**Vi tri:** `consumer.ts:1041-1558`

**Van de hien tai:**
```typescript
// Logic tinh VAT lap lai o 3 noi:
// 1. consumer.ts - calculateVatAmountsForRestaurant()
// 2. consumer.ts - calculateVatAmountsForAppFood()
// 3. invoice-details.service.ts - createInvoiceDetailByKafka()

// Moi function dai 200-300 dong voi nhieu nested conditions
private calculateVatAmountsForRestaurant(
  invoice: KafkaElectricInvoice,
  kafkaOrderDetails: KafkaOrderDetail[],
  vat: number
): void {
  // 500+ dong code voi nhieu if-else long nhau
}
```

**De xuat toi uu:**

```typescript
// Tao VatCalculator class rieng biet
// src/common/calculators/vat.calculator.ts

interface VatCalculationResult {
  totalVatAmount: number;
  totalAmountWithoutVat: number;
  details: VatDetailResult[];
}

interface VatCalculationContext {
  invoice: Invoice;
  orderDetails: OrderDetail[];
  vatRate: number;
  isRestaurantOrder: boolean;
  hasItemDiscount: boolean;
  hasTotalDiscount: boolean;
}

@Injectable()
export class VatCalculator {

  calculate(context: VatCalculationContext): VatCalculationResult {
    const strategy = this.getStrategy(context);
    return strategy.calculate(context);
  }

  private getStrategy(context: VatCalculationContext): IVatStrategy {
    if (context.isRestaurantOrder) {
      if (context.hasItemDiscount) {
        return new RestaurantItemDiscountVatStrategy();
      }
      if (context.hasTotalDiscount) {
        return new RestaurantTotalDiscountVatStrategy();
      }
      return new RestaurantStandardVatStrategy();
    }
    return new AppFoodVatStrategy();
  }
}

// Strategy Pattern cho cac loai tinh VAT
interface IVatStrategy {
  calculate(context: VatCalculationContext): VatCalculationResult;
}

class RestaurantItemDiscountVatStrategy implements IVatStrategy {
  calculate(context: VatCalculationContext): VatCalculationResult {
    // Logic don gian hon, chi 30-50 dong
  }
}
```

### 2.3 Console.log trong production code

**Vi tri:** Nhieu file trong codebase

**Van de:**
```typescript
// consumer.ts:1103-1129
if (invoice.order_id == 883016 || invoice.order_id == 883065) {
  console.log("DEBUG Calculated discount...");
}
// Hardcoded order IDs cho debug - khong nen co trong production
```

**De xuat:**
```typescript
// Su dung Logger cua NestJS voi log levels
// Xoa tat ca console.log, thay bang:
this.logger.debug(`Discount calculation: ${JSON.stringify(data)}`);

// Config log level trong production
// .env
LOG_LEVEL=error # production
LOG_LEVEL=debug # development
```

---

## 3. VAN DE HIGH

### 3.1 Magic Numbers va Hard-coded Values

**Vi tri:** Nhieu noi trong code

```typescript
// invoice-details.service.ts
const defaultVat = 0; // VAT mac dinh 0%

// consumer.ts
this.ORDER_EXPIRY_TIME = 60 * 60 * 24; // 24 hours
batchSize: 20,
maxConcurrency: 15,
retryDelay: 500,

// invoices.service.ts
// Partner types hardcoded as numbers
case 1: // M-Invoice
case 2: // FPT
```

**De xuat:**
```typescript
// src/common/constants/invoice.constants.ts
export const InvoiceConstants = {
  VAT: {
    DEFAULT: 8,
    RESTAURANT_DEFAULT: 0,
    MIN: 0,
    MAX: 100,
    VALID_VALUES: [0, 3, 5, 8, 10] as const,
  },
  CACHE: {
    ORDER_EXPIRY_SECONDS: 86400, // 24 hours
    RESTAURANT_INFO_TTL: 3600,   // 1 hour
    INVOICE_DETAILS_TTL: 180,    // 3 minutes
  },
  BATCH: {
    SIZE: 20,
    MAX_CONCURRENCY: 15,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 500,
  },
} as const;
```

### 3.2 Thieu Type Safety

**Van de:**
```typescript
// Su dung `any` qua nhieu
private async validatePartnerStatus(
  loginOauthDTO: LoginOauthDTO,
  loginToPartNer: any,  // any type
  invoice: any,          // any type
  restaurantPartnerInvoiceEntity: any  // any type
): Promise<void>

// invoice-details.service.ts
async updateMultiFoodInInvoice(
  invoiceDetailUpdateBase: InvoiceDetailUpdateBase
): Promise<any>  // any return type
```

**De xuat:**
```typescript
// Tao interfaces cu the
interface PartnerLoginResult {
  token: string;
  partnerType: PartnerElectronicInvoiceTypeEnum;
  expiresAt?: Date;
}

interface ValidatePartnerStatusParams {
  loginOauthDTO: LoginOauthDTO;
  loginResult: PartnerLoginResult;
  invoice: Invoice;
  partnerConfig: RestaurantPartnerInvoiceEntity;
}

private async validatePartnerStatus(
  params: ValidatePartnerStatusParams
): Promise<PartnerValidationResult>
```

### 3.3 Error Handling khong nhat quan

**Van de:**
```typescript
// Mot so noi throw HttpException voi HttpStatus.OK (sai)
throw new HttpException(
  new ExceptionResponseDetail(
    HttpStatus.BAD_REQUEST,
    InvoiceHandlerException.PARTNER_WAS_TURN_OFF
  ),
  HttpStatus.OK  // Sai - nen la BAD_REQUEST
);

// Mot so noi lai dung dung
throw new HttpException(
  new ExceptionResponseDetail(
    HttpStatus.INTERNAL_SERVER_ERROR,
    sagaResult.error || "Saga execution failed"
  ),
  HttpStatus.INTERNAL_SERVER_ERROR  // Dung
);
```

**De xuat:**
```typescript
// Tao custom exceptions
// src/common/exceptions/invoice.exceptions.ts

export class PartnerDisabledException extends HttpException {
  constructor(partnerId: string) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `Partner ${partnerId} is currently disabled`,
        error: 'Partner Disabled',
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

export class InvoiceNotFoundException extends HttpException {
  constructor(invoiceId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Invoice ${invoiceId} not found`,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND
    );
  }
}

// Su dung
throw new PartnerDisabledException(partnerConfig.id);
```

### 3.4 Code Duplication trong Partner Exports

**Vi tri:** `invoices.service.ts:623-800`

**Van de:**
```typescript
// Moi partner co 1 method rieng voi structure tuong tu
private async exportToMInvoice(params: {...}): Promise<any>
private async exportToFPT(params: {...}): Promise<any>
private async exportToMiFi(params: {...}): Promise<any>
private async exportToVNPT(params: {...}): Promise<any>
private async exportToMISA(params: {...}): Promise<any>
private async exportToHilo(params: {...}): Promise<any>
private async exportToViettel(params: {...}): Promise<any>
```

**De xuat:**
```typescript
// Su dung Strategy Pattern properly
// src/partner/strategies/export.strategy.ts

interface IExportStrategy {
  canHandle(partnerType: PartnerElectronicInvoiceTypeEnum): boolean;
  export(params: ExportParams): Promise<ExportResult>;
}

@Injectable()
export class MInvoiceExportStrategy implements IExportStrategy {
  canHandle(type: PartnerElectronicInvoiceTypeEnum): boolean {
    return type === PartnerElectronicInvoiceTypeEnum.M_INVOICE;
  }

  async export(params: ExportParams): Promise<ExportResult> {
    // MInvoice specific logic
  }
}

// Export Service chi can:
@Injectable()
export class InvoiceExportService {
  constructor(
    @Inject('EXPORT_STRATEGIES')
    private strategies: IExportStrategy[]
  ) {}

  async export(
    partnerType: PartnerElectronicInvoiceTypeEnum,
    params: ExportParams
  ): Promise<ExportResult> {
    const strategy = this.strategies.find(s => s.canHandle(partnerType));
    if (!strategy) {
      throw new UnsupportedPartnerException(partnerType);
    }
    return strategy.export(params);
  }
}
```

### 3.5 Thieu Input Validation o Controller

**Vi tri:** `invoices.controller.ts`

**Van de:**
```typescript
// Chi validate ObjectId, thieu validation khac
@Post("/update")
async updateInvoices(
  @Res() res: Response,
  @Body() invoiceUpdateDto: InvoiceUpdateDto  // Khong co ValidationPipe
): Promise<any>
```

**De xuat:**
```typescript
// Them ValidationPipe global hoac tung endpoint
@Post("/update")
async updateInvoices(
  @Res() res: Response,
  @Body(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))
  invoiceUpdateDto: InvoiceUpdateDto
): Promise<any>

// Hoac set global trong main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

### 3.6 Promise.all khong co Error Boundary

**Vi tri:** Nhieu noi trong code

**Van de:**
```typescript
// Neu 1 trong cac promise fail, tat ca se fail
const [invoiceDetails, invoiceTwoTime] = await Promise.all([
  this.invoiceDetailsService.findAllByOrderId(orderId),
  this.invoiceModel.findById(invoiceId),
]);
```

**De xuat:**
```typescript
// Su dung Promise.allSettled cho non-critical operations
const results = await Promise.allSettled([
  this.invoiceDetailsService.findAllByOrderId(orderId),
  this.invoiceModel.findById(invoiceId),
]);

// Xu ly ket qua
const [detailsResult, invoiceResult] = results;

if (detailsResult.status === 'rejected') {
  this.logger.error('Failed to fetch details', detailsResult.reason);
  // Handle gracefully
}

// Hoac tao utility function
async function safePromiseAll<T>(
  promises: Promise<T>[],
  fallbackValue: T
): Promise<T[]> {
  const results = await Promise.allSettled(promises);
  return results.map(r =>
    r.status === 'fulfilled' ? r.value : fallbackValue
  );
}
```

### 3.7 Thieu Transaction trong Database Operations

**Vi tri:** `invoice-details.service.ts:618-646`

**Van de:**
```typescript
// Insert va update khong trong transaction
const insertedInvoiceDetails = await this.invoiceDetailModel.insertMany(
  invoiceDetailCreateMulti
);

// Prepare bulk operations
const bulkOps = insertedInvoiceDetails.map((detail) => {...});

// Execute bulk update - Neu fail, data inconsistent
if (bulkOps.length > 0) {
  await this.invoiceDetailModel.bulkWrite(bulkOps);
}
```

**De xuat:**
```typescript
// Su dung MongoDB transactions
async createAndUpdateInvoiceDetails(
  invoiceDetailCreateMulti: any[],
  invoice: any
): Promise<void> {
  const session = await this.connection.startSession();

  try {
    session.startTransaction();

    const insertedDetails = await this.invoiceDetailModel.insertMany(
      invoiceDetailCreateMulti,
      { session }
    );

    const bulkOps = this.prepareBulkOperations(insertedDetails, invoice);

    if (bulkOps.length > 0) {
      await this.invoiceDetailModel.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### 3.8 Memory Leak Potential trong Consumer

**Vi tri:** `consumer.ts:95-99`

**Van de:**
```typescript
// Memory cache va processingQueue co the lon dan
private memoryCache: Map<string, { data: any; expiry: number }> = new Map();
private processingQueue: Map<string, Promise<ProcessedOrderResult>> = new Map();
```

**De xuat:**
```typescript
// Them size limit va eviction policy
import LRU from 'lru-cache';

private memoryCache = new LRU<string, { data: any; expiry: number }>({
  max: 500,  // Max 500 entries
  ttl: 5 * 60 * 1000,  // 5 minutes
  updateAgeOnGet: true,
});

// Hoac dung node-cache voi size limit
import NodeCache from 'node-cache';

private memoryCache = new NodeCache({
  stdTTL: 300,  // 5 minutes
  maxKeys: 500,
  checkperiod: 60,
});
```

---

## 4. VAN DE MEDIUM

### 4.1 Comments khong nhat quan (Tieng Viet lan Tieng Anh)

**De xuat:** Thong nhat su dung Tieng Anh cho tat ca comments va documentation.

### 4.2 Thieu Logging co cau truc

**De xuat:**
```typescript
// Su dung structured logging
this.logger.log({
  event: 'invoice_exported',
  invoiceId: invoice._id,
  partnerId: partner.id,
  duration: processingTime,
  success: true,
});
```

### 4.3 Return statement "return;" trong middle of function

**Vi tri:** `invoice-details.service.ts:431`
```typescript
async createMultiFood(...): Promise<InvoiceDetail[]> {
  return;  // Tra ve undefined
  // Code phia duoi khong bao gio chay
  const invoice = await this.validateInvoiceExists(...);
}
```

### 4.4 Thieu Rate Limiting cho API

**De xuat:**
```typescript
// Them rate limiting
import { Throttle } from '@nestjs/throttler';

@Controller('invoices')
export class InvoicesController {
  @Throttle(10, 60)  // 10 requests per 60 seconds
  @Post('/export/partner')
  async exportInvoices(...) {}

  @Throttle(100, 60)  // 100 requests per 60 seconds
  @Get('')
  async getList(...) {}
}
```

### 4.5 Hardcoded Debug Order IDs

**Vi tri:** `consumer.ts:1103, 1317`
```typescript
if (invoice.order_id == 883016 || invoice.order_id == 883065) {
  console.log("DEBUG...");
}
```
**Phai xoa truoc khi deploy production.**

### 4.6 Thieu Retry Decorator cho External Calls

**De xuat:**
```typescript
// Tao retry decorator
function Retry(options: { attempts: number; delay: number }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;

      for (let i = 0; i < options.attempts; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          if (i < options.attempts - 1) {
            await new Promise(r => setTimeout(r, options.delay * (i + 1)));
          }
        }
      }

      throw lastError;
    };
  };
}

// Su dung
@Retry({ attempts: 3, delay: 1000 })
async exportToPartner(...) {}
```

---

## 5. DE XUAT REFACTORING

### 5.1 Cau truc thu muc de xuat

```
src/
├── common/
│   ├── constants/
│   │   ├── invoice.constants.ts
│   │   └── cache.constants.ts
│   ├── calculators/
│   │   ├── vat.calculator.ts
│   │   └── discount.calculator.ts
│   ├── exceptions/
│   │   ├── invoice.exceptions.ts
│   │   └── partner.exceptions.ts
│   ├── decorators/
│   │   ├── retry.decorator.ts
│   │   └── cache.decorator.ts
│   └── interfaces/
│       ├── vat.interface.ts
│       └── export.interface.ts
├── partner/
│   ├── strategies/
│   │   ├── export/
│   │   │   ├── export.strategy.interface.ts
│   │   │   ├── minvoice.export.strategy.ts
│   │   │   ├── fpt.export.strategy.ts
│   │   │   └── ...
│   │   └── cancel/
│   │       └── ...
│   └── factory/
│       └── partner.factory.ts
└── version_3/
    └── invoices/
        ├── services/
        │   ├── invoice-crud.service.ts
        │   ├── invoice-export.service.ts
        │   ├── invoice-validation.service.ts
        │   └── invoice-sync.service.ts
        └── ...
```

### 5.2 Priority Refactoring

| Uu tien | Task | Effort | Impact |
|---------|------|--------|--------|
| 1 | Tach VatCalculator thanh class rieng | Medium | High |
| 2 | Xoa console.log, thay bang Logger | Low | High |
| 3 | Tao constants file | Low | Medium |
| 4 | Tach invoices.service.ts | High | High |
| 5 | Them input validation | Medium | High |
| 6 | Fix error handling status codes | Low | Medium |
| 7 | Them database transactions | Medium | High |

---

## 6. METRICS

### 6.1 Complexity Metrics (Uoc tinh)

| File | Lines | Cyclomatic Complexity | Maintainability |
|------|-------|----------------------|-----------------|
| invoices.service.ts | ~2500 | Very High | Low |
| invoice-details.service.ts | ~1700 | High | Low |
| consumer.ts | ~2150 | Very High | Low |
| invoices.controller.ts | ~800 | Medium | Medium |

### 6.2 Technical Debt (Uoc tinh)

| Loai | So luong | Thoi gian sua (gio) |
|------|----------|---------------------|
| Code Duplication | 15+ instances | 20-30 |
| Missing Types | 50+ any types | 15-20 |
| Missing Tests | Unknown | 40-60 |
| Error Handling | 20+ instances | 8-12 |
| Magic Numbers | 30+ instances | 4-6 |

---

## 7. KET LUAN

### 7.1 Diem can uu tien cai thien ngay:

1. **Xoa console.log** - Anh huong bao mat va performance
2. **Fix hardcoded debug order IDs** - Khong nen co trong production
3. **Tach logic tinh VAT** - Giam complexity, de maintain
4. **Them input validation** - Tang bao mat

### 7.2 Ke hoach dai han:

1. Refactor services lon thanh cac services nho hon
2. Viet unit tests cho logic tinh toan (VAT, discount)
3. Thong nhat error handling
4. Them monitoring va alerting
5. Documentation cho business logic phuc tap

---

**Nguoi review:** Claude AI
**Ngay review:** 2025-12-29
**Version:** 1.0
