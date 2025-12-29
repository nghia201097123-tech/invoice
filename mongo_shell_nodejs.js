// MongoDB Script cho Node.js - Tương thích với môi trường Node.js
// Chạy với: node mongo_shell_nodejs.js
// Sử dụng mongoose thay vì mongodb driver

const mongoose = require('mongoose');

// Suppress mongoose deprecation warning
mongoose.set('strictQuery', false);

// ===== CẤU HÌNH KẾT NỐI =====
// Load environment variables with fallback defaults
const MONGO_CONFIG = {
  host: process.env.CONFIG_MONGO_HOST_INVOICE || '172.16.10.90',
  port: process.env.CONFIG_MONGO_PORT_INVOICE || '27017',
  database: process.env.CONFIG_MONGO_DB_NAME_INVOICE || 'invoice_beta',
  username: process.env.CONFIG_MONGO_USERNAME_INVOICE || 'invoice_beta',
  password: process.env.CONFIG_MONGO_PASSWORD_INVOICE || 'invoice_beta'
};

// Build connection URI based on authentication
function buildMongoURI(config) {
  const { host, port, database, username, password } = config;
  
  // For development, try without authentication first
  if (process.env.NODE_ENV === 'development' || !username || !password) {
    return `mongodb://${host}:${port}/${database}`;
  }
  
  return `mongodb://${username}:${password}@${host}:${port}/${database}`;
}

const CONFIG = {
  // Cấu hình cho các môi trường khác nhau
  development: {
    uri: buildMongoURI(MONGO_CONFIG),
    options: {
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    }
  }
};

// Chọn environment (có thể thay đổi qua process.env.NODE_ENV)
const currentConfig = CONFIG['development'];

// ===== CẤU HÌNH COLLECTIONS =====
const COLLECTIONS = {
  invoices: 'invoices'
};

// ===== ENUM PARTNER TYPES =====
const PARTNER_TYPES = {
  1: 'M_INVOICE',
  2: 'FPT',
  3: 'MIFI',
  4: 'VNPT',
  5: 'MISA',
  6: 'HILO',
  7: 'VIETTEL'
};

// ===== UTILITY FUNCTIONS =====
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logError(message, error = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${message}`);
  if (error) {
    console.error(error);
  }
}

// ===== VALIDATION FUNCTIONS =====
function validateDateRange(startDate) {
  if (!startDate || !(startDate instanceof Date)) {
    throw new Error('Start date must be a valid Date object');
  }
  
  const now = new Date();
  if (startDate > now) {
    log('⚠️  Warning: Start date is in the future');
  }
  
  return true;
}

async function validateCollections() {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = Object.values(COLLECTIONS);
    const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
    
    if (missingCollections.length > 0) {
      logError(`Missing collections: ${missingCollections.join(', ')}`);
      return false;
    }
    
    log('✅ All required collections exist');
    return true;
  } catch (error) {
    logError('Error validating collections:', error);
    return false;
  }
}

// ===== QUERY FUNCTIONS =====
function buildRestaurantBranchSummaryPipeline(startDate) {
  return [
    {
      $match: {
        invoice_status: 1,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          restaurant_id: '$restaurant_id',
          restaurant_brand_id: '$restaurant_brand_id',
          branch_id: '$branch_id',
          partner_type: '$partner_type'
        },
        total_exported_invoices: { $sum: 1 },
        total_amount: { $sum: '$total_amount' },
        first_invoice_date: { $min: '$createdAt' },
        last_invoice_date: { $max: '$createdAt' }
      }
    },
    {
      $addFields: {
        partner_type_name: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id.partner_type', 1] }, then: 'M_INVOICE' },
              { case: { $eq: ['$_id.partner_type', 2] }, then: 'FPT' },
              { case: { $eq: ['$_id.partner_type', 3] }, then: 'MIFI' },
              { case: { $eq: ['$_id.partner_type', 4] }, then: 'VNPT' },
              { case: { $eq: ['$_id.partner_type', 5] }, then: 'MISA' },
              { case: { $eq: ['$_id.partner_type', 6] }, then: 'HILO' },
              { case: { $eq: ['$_id.partner_type', 7] }, then: 'VIETTEL' }
            ],
            default: 'NO_PARTNER'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        restaurant_id: '$_id.restaurant_id',
        restaurant_brand_id: '$_id.restaurant_brand_id',
        branch_id: '$_id.branch_id',
        partner_type: '$_id.partner_type',
        partner_type_name: 1,
        total_exported_invoices: 1,
        total_amount: 1,
        first_invoice_date: 1,
        last_invoice_date: 1,
        report_generated_at: new Date()
      }
    },
    {
      $sort: {
        restaurant_brand_id: 1,
        branch_id: 1,
        partner_type: 1
      }
    }
  ];
}

async function getRestaurantBranchSummary(startDate) {
  try {
    log('🔍 Executing restaurant branch summary aggregation...');
    
    const pipeline = buildRestaurantBranchSummaryPipeline(startDate);
    const db = mongoose.connection.db;
    const results = await db.collection(COLLECTIONS.invoices)
      .aggregate(pipeline)
      .toArray();
    
    log(`✅ Found ${results.length} restaurant-branch-partner combinations`);
    return results;
  } catch (error) {
    logError('Error in getRestaurantBranchSummary:', error);
    throw error;
  }
}

async function getPartnerSummary() {
  try {
    log('📊 Getting partner type summary...');
    
    const db = mongoose.connection.db;
    const summary = await db.collection(COLLECTIONS.invoices)
      .aggregate([
        {
          $group: {
            _id: '$partner_type',
            count: { $sum: 1 },
            restaurants: { $addToSet: '$restaurant_id' }
          }
        },
        {
          $addFields: {
            partner_type_name: {
              $switch: {
                branches: Object.entries(PARTNER_TYPES).map(([key, value]) => ({
                  case: { $eq: ['$_id', parseInt(key)] },
                  then: value
                })),
                default: 'UNKNOWN'
              }
            },
            unique_restaurants: { $size: '$restaurants' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      .toArray();
    
    log(`✅ Partner summary completed`);
    return summary;
  } catch (error) {
    logError('Error in getPartnerSummary:', error);
    throw error;
  }
}

async function getInvoiceStats(startDate) {
  try {
    log('📈 Getting invoice statistics...');
    
    const db = mongoose.connection.db;
    const stats = await db.collection(COLLECTIONS.invoices)
      .aggregate([
        {
          $match: {
            invoice_status: 1,
            created_at: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total_invoices: { $sum: 1 },
            unique_restaurants: { $addToSet: '$restaurant_id' },
            date_range: {
              $push: {
                created_at: '$created_at',
                restaurant_id: '$restaurant_id'
              }
            }
          }
        },
        {
          $addFields: {
            unique_restaurant_count: { $size: '$unique_restaurants' },
            earliest_invoice: { $min: '$date_range.created_at' },
            latest_invoice: { $max: '$date_range.created_at' }
          }
        }
      ])
      .toArray();
    
    log(`✅ Invoice statistics completed`);
    return stats[0] || {
      total_invoices: 0,
      unique_restaurant_count: 0,
      earliest_invoice: null,
      latest_invoice: null
    };
  } catch (error) {
    logError('Error in getInvoiceStats:', error);
    throw error;
  }
}

// ===== EXPORT FUNCTIONS =====
function exportToJSON(data, filename) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    log(`✅ Data exported to: ${outputPath}`);
  } catch (error) {
    logError('Error exporting to JSON:', error);
  }
}

function displaySampleResults(results, limit = 5) {
  log(`\n📋 Sample Results (showing first ${limit} records):`);
  console.log('=' .repeat(80));
  
  results.slice(0, limit).forEach((record, index) => {
    console.log(`\n${index + 1}. Restaurant ID: ${record.restaurant_id}`);
    console.log(`   Brand ID: ${record.restaurant_brand_id}`);
    console.log(`   Branch ID: ${record.branch_id}`);
    console.log(`   Restaurant Name: ${record.restaurant_name || 'N/A'}`);
    console.log(`   Partner Type: ${record.partner_type_name} (${record.partner_type || 'N/A'})`);
    console.log(`   Exported Invoices: ${record.total_exported_invoices}`);
  });
  
  if (results.length > limit) {
    console.log(`\n... and ${results.length - limit} more records`);
  }
  console.log('=' .repeat(80));
}

// ===== MAIN EXECUTION FUNCTION =====
async function main() {
  try {
    log(`📡 Connecting to: ${currentConfig.uri}`);
    
    // Kết nối MongoDB với mongoose
    await mongoose.connect(currentConfig.uri, currentConfig.options);
    log('✅ Connected to MongoDB successfully');
    
    // Validate collections
    const collectionsValid = await validateCollections();
    if (!collectionsValid) {
      throw new Error('Required collections are missing');
    }
    
    // Thiết lập ngày bắt đầu (18/06/2025 17:23)
    const START_DATE = new Date('2025-06-18T17:23:00.000Z');
    validateDateRange(START_DATE);
    
    log(`📅 Analyzing invoices from: ${START_DATE.toISOString()}`);
    
    // Thực hiện các truy vấn
    const [restaurantData, partnerSummary, invoiceStats] = await Promise.all([
      getRestaurantBranchSummary(START_DATE),
      getPartnerSummary(),
      getInvoiceStats(START_DATE)
    ]);
    
    // Hiển thị kết quả
    log('\n' + '='.repeat(100));
    log('📊 SUMMARY REPORT');
    log('='.repeat(100));
    
    log(`\n🏪 Total Restaurants: ${restaurantData.length}`);
    log(`📄 Total Exported Invoices (since ${START_DATE.toISOString()}): ${invoiceStats.total_invoices}`);
    log(`🏢 Unique Restaurants with Invoices: ${invoiceStats.unique_restaurant_count}`);
    
    if (invoiceStats.earliest_invoice && invoiceStats.latest_invoice) {
      log(`📅 Invoice Date Range: ${invoiceStats.earliest_invoice.toISOString()} to ${invoiceStats.latest_invoice.toISOString()}`);
    }
    
    log('\n🔌 Partner Type Distribution:');
    partnerSummary.forEach(partner => {
      log(`   ${partner.partner_type_name}: ${partner.count} configurations, ${partner.unique_restaurants} restaurants`);
    });
    
    // Hiển thị sample data
    displaySampleResults(restaurantData);
    
    // Export kết quả
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportToJSON({
      summary: {
        total_restaurants: restaurantData.length,
        total_exported_invoices: invoiceStats.total_invoices,
        unique_restaurants_with_invoices: invoiceStats.unique_restaurant_count,
        analysis_date: new Date().toISOString(),
        start_date: START_DATE.toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
      partner_summary: partnerSummary,
      invoice_stats: invoiceStats,
      restaurant_data: restaurantData
    }, `restaurant_invoice_report_${timestamp}.json`);
    
    log('\n✅ Analysis completed successfully!');
    
  } catch (error) {
    logError('❌ Error during execution:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      log('🔌 MongoDB connection closed');
    }
  }
}

// ===== EXECUTION =====
if (require.main === module) {
  main().catch(error => {
    logError('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  getRestaurantBranchSummary,
  getPartnerSummary,
  getInvoiceStats,
  CONFIG,
  COLLECTIONS,
  PARTNER_TYPES
};