# Viettel Invoice Integration

This module provides integration with Viettel's electronic invoice system for creating, managing, and canceling invoices.

## Features

- **Authentication**: Login with username/password to get access token
- **Invoice Creation**: Support both HSM and USB token signing methods
- **Invoice Management**: Cancel, update payment status, and retrieve invoice details
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Validation**: Input validation for invoice data

## API Endpoints

### Authentication
- `POST /auth/login` - Login to get access token

### Invoice Operations
- `POST /createInvoice` - Create invoice with HSM signing
- `POST /createInvoiceWithUSBToken` - Create invoice with USB token signing
- `POST /cancelTransactionInvoice` - Cancel an invoice
- `POST /updatePaymentStatus` - Update payment status
- `POST /searchInvoice` - Search invoices
- `GET /getInvoiceDetail` - Get invoice details
- `POST /sendEmail` - Send invoice via email

## Usage

### 1. Configuration

Ensure your restaurant partner invoice entity has the following configuration:

```typescript
{
  endpoint: 'https://api.viettel.com', // Viettel API base URL
  username: 'your_username',
  password: 'your_password',
  serial_cert: 'certificate_serial', // Optional: for USB token signing
  supplier_tax_code: 'your_tax_code',
  template_code: 'your_template_code',
  pattern: 'your_pattern'
}
```

### 2. Export Invoice

```typescript
const viettelService = new ThirdPartyViettel(invoiceModel, invoiceDetailModel, invoiceHelper);

// Login first
const authResult = await viettelService.login('username', 'password');
const accessToken = authResult.access_token;

// Export invoice
const invoiceData = {
  _id: 'invoice_id',
  pattern: '1C22TTA',
  serial: 'AA/22E',
  // ... other invoice fields
};

const result = await viettelService.export(invoiceData, accessToken);
```

### 3. Cancel Invoice

```typescript
const cancelData = {
  pattern: '1C22TTA',
  serial: 'AA/22E',
  fkey: 'invoice_fkey',
  reason: 'Cancellation reason'
};

const result = await viettelService.cancel(cancelData, accessToken);
```

### 4. Update Payment Status

```typescript
const updateData = {
  fkey: 'invoice_fkey',
  paymentStatus: 1, // 1: Paid, 0: Unpaid
  paymentDate: '2024-01-15',
  paymentMethod: 'Cash',
  note: 'Payment completed'
};

const result = await viettelService.updatePaymentStatus(updateData, accessToken);
```

## Data Transfer Objects (DTOs)

### ViettelInvoiceExportDto
Main DTO for exporting invoices with all required fields including buyer information, invoice details, and amounts.

### ViettelInvoiceCancelDto
DTO for canceling invoices with pattern, serial, fkey, and cancellation reason.

### ViettelInvoiceUpdateDto
DTO for updating payment status with payment information.

### ViettelInvoiceSearchDto
DTO for searching invoices by various criteria.

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    "fkey": "invoice_fkey",
    "invoiceNo": "0000001",
    "transactionUuid": "uuid"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Detailed error message"
    }
  ]
}
```

## Constants

### Invoice Types
- `INVOICE_TYPE_SALE`: 1 (Sales invoice)
- `INVOICE_TYPE_ADJUSTMENT`: 2 (Adjustment invoice)
- `INVOICE_TYPE_REPLACEMENT`: 3 (Replacement invoice)

### VAT Rates
- `VAT_RATE_0`: 0%
- `VAT_RATE_5`: 5%
- `VAT_RATE_8`: 8%
- `VAT_RATE_10`: 10%
- `VAT_RATE_EXEMPT`: -1 (Exempt)
- `VAT_RATE_NOT_SUBJECT`: -2 (Not subject to VAT)

## Error Handling

The service includes comprehensive error handling:

- **Authentication Errors**: Invalid credentials, expired tokens
- **Validation Errors**: Missing required fields, invalid data formats
- **API Errors**: Network issues, server errors
- **Business Logic Errors**: Invoice already exists, invalid status transitions

## Testing

Run the test suite:

```bash
npm test -- third-party-viettel.service.spec.ts
```

## Dependencies

- `@nestjs/common`: NestJS framework
- `@nestjs/mongoose`: MongoDB integration
- `@nestjs/axios`: HTTP client
- `class-validator`: Data validation
- `class-transformer`: Data transformation
- `uuid`: UUID generation

## Security Considerations

- Access tokens are required for all API calls
- Sensitive data (passwords, tokens) should be stored securely
- API endpoints should be called over HTTPS
- Input validation is performed on all data

## Support

For issues or questions regarding the Viettel integration, please refer to the official Viettel API documentation or contact the development team.