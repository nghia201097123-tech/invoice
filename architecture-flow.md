# Kiến Trúc Hệ Thống Invoice - TechRes

## Tổng Quan Kiến Trúc

```mermaid
graph TB
    subgraph "Client Layer"
        API[REST API Endpoints]
        GRPC[gRPC Services]
    end
    
    subgraph "Application Layer"
        CTRL[Controllers]
        SVC[Services]
        GUARD[Guards & Interceptors]
    end
    
    subgraph "Business Logic Layer"
        INV[Invoice Service]
        INVDET[Invoice Details Service]
        CALC[Calculate Utils]
        SAGA[Saga Orchestrator]
    end
    
    subgraph "Integration Layer"
        KAFKA[Kafka Consumer]
        OAUTH[OAuth Service]
        THIRD[Third Party Adapter]
    end
    
    subgraph "Data Layer"
        MONGO[(MongoDB)]
        MYSQL[(MySQL)]
        REDIS[(Redis Cache)]
    end
    
    subgraph "External Services"
        FPT[FPT Invoice]
        VNPT[VNPT Invoice]
        MIFI[MiFi Invoice]
        MINV[M-Invoice]
        HILO[Hilo Invoice]
    end
    
    API --> CTRL
    GRPC --> CTRL
    CTRL --> SVC
    SVC --> INV
    SVC --> INVDET
    INV --> CALC
    INV --> SAGA
    
    KAFKA --> INV
    KAFKA --> INVDET
    
    INV --> MONGO
    INVDET --> MONGO
    SVC --> REDIS
    
    SAGA --> THIRD
    OAUTH --> THIRD
    THIRD --> FPT
    THIRD --> VNPT
    THIRD --> MIFI
    THIRD --> MINV
    THIRD --> HILO
```

## 1. API Architecture

### REST API Endpoints
- **Invoice Management**: `/v3/invoices`
- **Invoice Details**: `/v3/invoice-details`
- **Health Check**: `/health-check`

### gRPC Services
- Token validation
- Data validation
- Inter-service communication

## 2. Database Architecture

### MongoDB Collections
```
invoices/
├── _id: ObjectId
├── restaurant_id: number
├── order_id: number
├── customer_info: object
├── amounts: object
├── status: number
└── timestamps: object

invoice_details/
├── _id: ObjectId
├── order_id: number
├── food_info: object
├── pricing: object
└── calculations: object

invoice_send_failed/
├── _id: ObjectId
├── invoice_id: string
├── error_info: object
└── retry_count: number
```

### MySQL Entities
```
restaurant_partner_invoice/
├── id: number
├── restaurant_id: number
├── partner_type: enum
├── credentials: object
└── configuration: object

employee/
├── id: number
├── name: string
├── permissions: object
└── restaurant_id: number
```

## 3. Caching Strategy

### Redis Cache Layers
```
Cache Keys:
├── processed_order_ids (24h TTL)
├── restaurant_invoice_info (1h TTL)
├── invoice_details:order_{orderId} (3min TTL)
└── restaurant_partner_data (1h TTL)
```

### Cache Invalidation
- **Kafka-based**: Clear cache messages
- **Event-driven**: On invoice/detail updates
- **TTL-based**: Automatic expiration

## 4. Kafka Integration

### Topics
```
kafka.topic.invoice-sync
├── Producer: Order Management System
├── Consumer: Invoice Service
└── Message: Order data for invoice creation

kafka.topic.invoice-clear-restaurant-invoice-cache
├── Producer: Various services
├── Consumer: Cache Clear Service
└── Message: Cache invalidation commands
```

### Consumer Groups
- `electric-invoices-techres-local`
- `electric-invoices-clear-cache`

### Message Processing Flow
```mermaid
sequenceDiagram
    participant OMS as Order Management
    participant KAFKA as Kafka
    participant CONSUMER as Invoice Consumer
    participant DB as MongoDB
    participant CACHE as Redis
    
    OMS->>KAFKA: Publish order data
    KAFKA->>CONSUMER: Consume message
    CONSUMER->>CONSUMER: Validate restaurant sync
    CONSUMER->>DB: Create invoice & details
    CONSUMER->>CACHE: Update cache
    CONSUMER->>CONSUMER: Process third-party export
```

## 5. Third-Party Integration Flow

### Supported Partners
1. **FPT Invoice**
2. **VNPT Invoice**
3. **MiFi Invoice**
4. **M-Invoice**
5. **Hilo Invoice**

### Integration Pattern
```mermaid
sequenceDiagram
    participant CLIENT as Client
    participant SVC as Invoice Service
    participant SAGA as Saga Orchestrator
    participant OAUTH as OAuth Service
    participant ADAPTER as Third Party Adapter
    participant PARTNER as Partner API
    
    CLIENT->>SVC: Export invoice request
    SVC->>SVC: Validate invoice
    SVC->>OAUTH: Authenticate with partner
    OAUTH->>PARTNER: Login request
    PARTNER->>OAUTH: Return token
    SVC->>SAGA: Start export saga
    SAGA->>ADAPTER: Execute export
    ADAPTER->>PARTNER: Send invoice data
    PARTNER->>ADAPTER: Return result
    ADAPTER->>SAGA: Process result
    SAGA->>SVC: Update invoice status
    SVC->>CLIENT: Return response
```

### Saga Pattern Implementation
```
Export Invoice Saga Steps:
1. Validate Invoice
2. Create Log Entry
3. Call Third Party API
4. Update Invoice Status

Compensation Actions:
- Remove log entry
- Compensate third party call
- Revert invoice status
```

## 6. Luồng Xử Lý Chi Tiết

### 6.1 Invoice Creation Flow
```mermaid
flowchart TD
    A[Kafka Message] --> B{Validate Restaurant}
    B -->|Valid| C[Parse Order Data]
    B -->|Invalid| D[Skip Processing]
    C --> E[Create Invoice]
    E --> F[Create Invoice Details]
    F --> G[Calculate Amounts]
    G --> H[Update Cache]
    H --> I[Log Success]
    
    E --> J{Auto Export?}
    J -->|Yes| K[Queue Export Job]
    J -->|No| L[End]
    K --> L
```

### 6.2 Invoice Export Flow
```mermaid
flowchart TD
    A[Export Request] --> B[Validate Invoice]
    B --> C[Get Partner Config]
    C --> D[Authenticate]
    D --> E[Prepare Data]
    E --> F{Apply Discount?}
    F -->|Yes| G[Recalculate]
    F -->|No| H[Use Original]
    G --> I[Export to Partner]
    H --> I
    I --> J{Success?}
    J -->|Yes| K[Update Status]
    J -->|No| L[Log Error]
    K --> M[Invalidate Cache]
    L --> N[Queue Retry]
    M --> O[Return Success]
    N --> O
```

### 6.3 Cache Management Flow
```mermaid
flowchart TD
    A[Data Change Event] --> B{Cache Type}
    B -->|Invoice| C[Clear Invoice Cache]
    B -->|Details| D[Clear Details Cache]
    B -->|Restaurant| E[Clear Restaurant Cache]
    C --> F[Notify Other Services]
    D --> F
    E --> F
    F --> G[Update Memory Cache]
    G --> H[Log Cache Event]
```

## 7. Error Handling & Monitoring

### Error Handling Strategy
- **Retry Mechanism**: 3 attempts with exponential backoff
- **Circuit Breaker**: Prevent cascade failures
- **Dead Letter Queue**: Failed message handling
- **Compensation**: Saga pattern for rollback

### Monitoring Points
- Kafka consumer lag
- Third-party API response times
- Cache hit/miss ratios
- Invoice processing metrics
- Error rates by partner

## 8. Performance Optimizations

### Batch Processing
- **Batch Size**: 20 invoices
- **Concurrency**: 15 parallel processes
- **Memory Cache**: 10-minute cleanup cycle

### Database Optimizations
- **Indexes**: Compound indexes on frequently queried fields
- **Aggregation**: Optimized pipeline for calculations
- **Connection Pooling**: Efficient resource usage

### Caching Strategy
- **Multi-level**: Memory + Redis
- **TTL-based**: Different expiration for different data types
- **Invalidation**: Event-driven cache clearing

## 9. Security Considerations

### Authentication & Authorization
- **OAuth 2.0**: Partner authentication
- **JWT Tokens**: API authentication
- **Role-based**: Access control

### Data Protection
- **Encryption**: Sensitive data encryption
- **Audit Logs**: All operations logged
- **Rate Limiting**: API protection

## 10. Deployment Architecture

### Containerization
- **Docker**: Application containerization
- **Environment**: Development/Staging/Production
- **Configuration**: Environment-based config

### Scalability
- **Horizontal**: Multiple consumer instances
- **Vertical**: Resource scaling
- **Load Balancing**: Request distribution

Cấu trúc này đảm bảo tính mở rộng, độ tin cậy và hiệu suất cao cho hệ thống xử lý hóa đơn điện tử.