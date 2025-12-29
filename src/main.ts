import {
  HttpException,
  HttpStatus,
  Logger,
  LoggerService,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { LogLevel } from "typeorm";
import { AppModule } from "./app.module";
import { PartnerApiDefault } from "./partner/api/partner-api.default";
import * as cowsay from "cowsay";
import * as os from "os";
import * as process from "process";
import { ExceptionResponseDetail } from "./common/utils/utils.exception.common/utils.exception.common";
import { NestApplicationContextOptions } from "@nestjs/common/interfaces/nest-application-context-options.interface";
import { MicroserviceOptions } from "@nestjs/microservices";
import { grpcServerOptions } from "./config/grpc/server/grpc-serser.module";
import {
  AuthConfig,
  initializeGlobalAuthService,
} from "@techres/authenticate-lib";

// Global logger instance
const logger = new Logger("Bootstrap");

/**
 * System monitoring utilities
 */
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  uptime: number;
}

/**
 * Get current system metrics with cross-platform compatibility
 */
function getSystemMetrics(): SystemMetrics {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get CPU usage - handle different OS implementations
    let cpuUsage = 0;
    const loadAvg = os.loadavg();

    if (loadAvg && loadAvg.length > 0) {
      // On Linux (Ubuntu/CentOS), loadavg represents system load
      // Convert to approximate percentage
      cpuUsage = Math.round(loadAvg[0] * 100) / 100;
    }

    // Get CPU count with fallback
    let cpuCores = 1;
    try {
      const cpus = os.cpus();
      cpuCores = cpus ? cpus.length : 1;
    } catch (error) {
      cpuCores = 1; // Fallback for restricted environments
    }

    return {
      cpu: {
        usage: cpuUsage,
        cores: cpuCores,
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024),
        used: Math.round(usedMem / 1024 / 1024),
        free: Math.round(freeMem / 1024 / 1024),
        usage: Math.round((usedMem / totalMem) * 100),
      },
      uptime: Math.round(os.uptime()),
    };
  } catch (error) {
    // Fallback metrics for environments with restricted access
    return {
      cpu: {
        usage: 0,
        cores: 1,
      },
      memory: {
        total: 0,
        used: 0,
        free: 0,
        usage: 0,
      },
      uptime: 0,
    };
  }
}

/**
 * Log system metrics with performance context using console for better visibility
 */
function logSystemMetrics(phase: string): void {
  try {
    const metrics = getSystemMetrics();
    const processMemory = process.memoryUsage();
    const platform = os.platform();
    const arch = os.arch();

    console.log(`\n📊 System Metrics (${phase}):`);
    console.log(`   🖥️  Platform: ${platform} ${arch}`);
    console.log(
      `   💻 CPU: ${metrics.cpu.usage} load avg (${metrics.cpu.cores} cores)`
    );
    console.log(
      `   🧠 Memory: ${metrics.memory.used}MB/${metrics.memory.total}MB (${metrics.memory.usage}%)`
    );
    console.log(
      `   📈 Process Memory: RSS=${Math.round(
        processMemory.rss / 1024 / 1024
      )}MB, Heap=${Math.round(
        processMemory.heapUsed / 1024 / 1024
      )}MB/${Math.round(processMemory.heapTotal / 1024 / 1024)}MB`
    );
    console.log(
      `   ⏱️  System Uptime: ${Math.floor(metrics.uptime / 3600)}h ${Math.floor(
        (metrics.uptime % 3600) / 60
      )}m`
    );
    console.log(`   🌐 Node.js: ${process.version}`);
    console.log(`${"=".repeat(60)}\n`);
  } catch (error) {
    console.warn(
      `⚠️  Failed to get system metrics for ${phase}:`,
      error.message
    );
  }
}

/**
 * Performance timer utility
 */
class PerformanceTimer {
  private startTime: number;
  private phase: string;

  constructor(phase: string) {
    this.phase = phase;
    this.startTime = performance.now();
    console.log(`⚡ Starting ${phase}...`);
  }

  end(): void {
    const duration = Math.round(performance.now() - this.startTime);
    console.log(`✅ ${this.phase} completed in ${duration}ms`);
  }
}
/**
 * Setup global error handlers to prevent application crashes
 */
function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception:", error.stack || error.message);
    // Log the error but don't exit the process immediately
    // Allow graceful shutdown instead
    setTimeout(() => {
      logger.error("Forcing shutdown due to uncaught exception");
      process.exit(1);
    }, 5000); // Give 5 seconds for cleanup
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Don't exit the process, just log the error
  });

  // Handle SIGTERM signal (graceful shutdown)
  process.on("SIGTERM", () => {
    logger.log("SIGTERM received, starting graceful shutdown");
    gracefulShutdown();
  });

  // Handle SIGINT signal (Ctrl+C)
  process.on("SIGINT", () => {
    logger.log("SIGINT received, starting graceful shutdown");
    gracefulShutdown();
  });

  // Handle warning events
  process.on("warning", (warning) => {
    logger.warn(
      "Process warning:",
      warning.name,
      warning.message,
      warning.stack
    );
  });
}
/**
 * Graceful shutdown handler
 */
function gracefulShutdown(): void {
  logger.log("Starting graceful shutdown...");

  // Set a timeout to force shutdown if graceful shutdown takes too long
  const forceShutdownTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timeout, forcing exit");
    process.exit(1);
  }, 30000); // 30 seconds timeout

  // Clear the timeout if shutdown completes normally
  process.on("exit", () => {
    clearTimeout(forceShutdownTimeout);
  });

  // Perform cleanup operations here
  // Close database connections, stop timers, etc.

  logger.log("Graceful shutdown completed");
  process.exit(0);
}

/**
 * Setup application-level error handling
 */
function setupApplicationErrorHandling(app: NestFastifyApplication): void {
  // Global exception filter can be added here if needed
  // app.useGlobalFilters(new GlobalExceptionFilter());

  // Enhanced validation pipe with better error handling
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (
        validationErrors: ValidationError[] = []
      ): HttpException => {
        try {
          const firstError = validationErrors[0];
          const errorMessage = firstError?.constraints
            ? Object.values(firstError.constraints)[0]
            : "Validation failed";

          return new HttpException(
            new ExceptionResponseDetail(HttpStatus.BAD_REQUEST, errorMessage),
            HttpStatus.BAD_REQUEST
          );
        } catch (error) {
          logger.error("Error in validation exception factory:", error);
          return new HttpException(
            new ExceptionResponseDetail(
              HttpStatus.BAD_REQUEST,
              "Validation error occurred"
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      },
    })
  );
}

/**
 * Safe environment variable getter with fallback and platform awareness
 */
function getEnvVar(key: string, defaultValue: string = ""): string {
  try {
    const value = process.env[key] || defaultValue;

    // Log when environment is beta or staging
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    if (nodeEnv === "beta" || nodeEnv === "staging") {
      logger.log(
        `Environment variable ${key}: ${value} (NODE_ENV: ${nodeEnv})`
      );
    }

    return value;
  } catch (error) {
    logger.warn(
      `Failed to get environment variable ${key}, using default: ${defaultValue}`
    );
    return defaultValue;
  }
}

/**
 * Check platform compatibility and log environment info
 */
function checkPlatformCompatibility(): void {
  try {
    const platform = os.platform();
    const arch = os.arch();
    const nodeVersion = process.version;
    const isLinux = platform === "linux";
    const isWindows = platform === "win32";
    const isDarwin = platform === "darwin";

    console.log(`\n🔍 Platform Compatibility Check:`);
    console.log(`   Platform: ${platform} (${arch})`);
    console.log(`   Node.js: ${nodeVersion}`);
    console.log(`   Process ID: ${process.pid}`);
    console.log(`   Working Directory: ${process.cwd()}`);

    if (isLinux) {
      console.log(`   ✅ Linux detected - Ubuntu/CentOS compatible`);

      // Check for common Linux environment indicators
      const hasSystemd = process.env.SYSTEMD_EXEC_PID !== undefined;
      const isContainer =
        process.env.container !== undefined ||
        process.env.DOCKER_CONTAINER !== undefined ||
        process.cwd().includes("/app");

      if (hasSystemd) console.log(`   🔧 Systemd detected`);
      if (isContainer) console.log(`   🐳 Container environment detected`);
    } else if (isWindows) {
      console.log(`   ✅ Windows detected`);
    } else if (isDarwin) {
      console.log(`   ✅ macOS detected`);
    } else {
      console.log(
        `   ⚠️  Unknown platform - proceeding with fallback compatibility`
      );
    }

    // Check memory availability
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memGB = Math.round(totalMem / 1024 / 1024 / 1024);

    if (memGB < 1) {
      console.log(
        `   ⚠️  Low memory detected (${memGB}GB) - consider increasing resources`
      );
    } else {
      console.log(`   ✅ Memory: ${memGB}GB available`);
    }

    console.log(`${"=".repeat(60)}\n`);
  } catch (error) {
    console.warn(`⚠️  Platform compatibility check failed:`, error.message);
  }
}
/**
 * Safe logger level configuration
 */
function getLoggerLevels(): LogLevel[] {
  try {
    // Check if environment is beta or staging
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    const isBetaOrStaging =
      nodeEnv?.includes("beta") || nodeEnv?.includes("staging");

    // If beta or staging, enable all log levels
    if (isBetaOrStaging) {
      logger.log(`Environment detected as ${nodeEnv}, enabling all log levels`);
      return ["log", "error", "warn"];
    }

    const loggerLevel = getEnvVar("CONFIG_LOGGER_LEVEL", "log,error,warn");
    return loggerLevel.split(",").filter((level: string): level is LogLevel => {
      return ["log", "error", "warn", "debug", "verbose"].includes(
        level as LogLevel
      );
    });
  } catch (error) {
    logger.warn("Failed to parse logger levels, using defaults");
    return ["log", "error", "warn"];
  }
}

/**
 * Setup Swagger documentation asynchronously
 */
async function setupSwaggerDocumentation(
  app: NestFastifyApplication
): Promise<void> {
  const timer = new PerformanceTimer("Swagger Documentation Setup");
  try {
    const config: Omit<OpenAPIObject, "paths"> = new DocumentBuilder()
      .setTitle(
        "INVOICE PUBLIC AT " +
          new Date().toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
          })
      )
      .setDescription(`Invoice Management System API`)
      .setVersion("1.0")
      .addServer("api")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        "access-token"
      )
      .addBearerAuth()
      .build();

    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);
    timer.end();
  } catch (error) {
    logger.error("Failed to setup Swagger documentation:", error.message);
    timer.end();
    throw error;
  }
}

/**
 * Display system configuration information
 */
async function displaySystemConfiguration(): Promise<void> {
  const timer = new PerformanceTimer("System Configuration Display");
  try {
    const partnerApiDefault: PartnerApiDefault = new PartnerApiDefault();

    const configInfo = `
====================MONGODB_INVOICE===========================
CONFIG_MONGO_HOST_INVOICE: ${getEnvVar("CONFIG_MONGO_HOST_INVOICE")}
CONFIG_MONGO_PORT_INVOICE: ${getEnvVar("CONFIG_MONGO_PORT_INVOICE")}
CONFIG_MONGO_DB_NAME_INVOICE: ${getEnvVar("CONFIG_MONGO_DB_NAME_INVOICE")}
=====================MONGODB_INVOICE==========================

======================MYSQL_INVOICE===========================
CONFIG_MYSQL_HOST_INVOICE: ${getEnvVar("CONFIG_MYSQL_HOST_INVOICE")}
CONFIG_MYSQL_PORT_INVOICE: ${getEnvVar("CONFIG_MYSQL_PORT_INVOICE")}
=======================MYSQL_INVOICE===========================

============================PARTNER_ENDPOINT=======================
CONFIG_VNPT_INVOICE_LOGIN_PATH: ${
      partnerApiDefault.CONFIG_VNPT_INVOICE_LOGIN_PATH
    }
CONFIG_FPT_INVOICE_LOGIN_PATH: ${
      partnerApiDefault.CONFIG_FPT_INVOICE_LOGIN_PATH
    }
CONFIG_MINVOCE_INVOICE_LOGIN_PATH: ${
      partnerApiDefault.CONFIG_MINVOCE_INVOICE_LOGIN_PATH
    }
CONFIG_MIFI_INVOICE_LOGIN_PATH: ${
      partnerApiDefault.CONFIG_MIFI_INVOICE_LOGIN_PATH
    }
CONFIG_MISA_INVOICE_LOGIN_PATH: ${
      partnerApiDefault.CONFIG_MISA_INVOICE_LOGIN_PATH
    }
CONFIG_VIETTEL_INVOICE_LOGIN_PATH: ${
      partnerApiDefault.CONFIG_VIETTEL_INVOICE_LOGIN_PATH
    }
============================PARTNER_ENDPOINT=======================

============================REDIS=======================
CONFIG_REDIS_HOST_INVOICE: ${getEnvVar("CONFIG_REDIS_HOST_INVOICE")}
CONFIG_REDIS_PORT_INVOICE: ${getEnvVar("CONFIG_REDIS_PORT_INVOICE")}
CONFIG_REDIS_DB_INDEX_INVOICE: ${getEnvVar("CONFIG_REDIS_DB_INDEX_INVOICE")}
============================REDIS=======================

============================GRPC=======================
CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_HOST: ${getEnvVar(
      "CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_HOST"
    )}
CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_PORT: ${getEnvVar(
      "CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_PORT"
    )}
GRPC_SERVER_PORT: ${getEnvVar("GRPC_SERVICE_PORT")}
============================GRPC=======================
    `;

    console.log(
      cowsay.think({
        text: configInfo.trim(),
        e: "OO",
        T: "U",
      })
    );

    timer.end();
  } catch (error) {
    logger.error("Failed to display system configuration:", error.message);
    timer.end();
  }
}

/**
 * Optimized bootstrap function with parallel initialization and monitoring
 */
async function bootstrap(): Promise<void> {
  const bootstrapTimer = new PerformanceTimer("Application Bootstrap");
  let app: NestFastifyApplication;

  try {
    // Check platform compatibility first
    checkPlatformCompatibility();

    // Log initial system metrics
    logSystemMetrics("Bootstrap Start");

    setupGlobalErrorHandlers();

    // Phase 1: Create NestJS application
    const appCreationTimer = new PerformanceTimer(
      "NestJS Application Creation"
    );
    const nestApplicationContextOptions: NestApplicationContextOptions = {
      logger: getLoggerLevels() as
        | ("log" | "error" | "warn" | "debug" | "verbose")[]
        | false
        | LoggerService,
    };

    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      nestApplicationContextOptions
    );
    appCreationTimer.end();
    logSystemMetrics("App Created");

    // Phase 2: Setup application configuration (can be done in parallel)
    const setupTimer = new PerformanceTimer("Application Setup");

    // Parallel setup of non-dependent configurations
    const [authService] = await Promise.allSettled([
      // Initialize auth service
      (async () => {
        const globalAuthConfig: AuthConfig = {
          redis: {
            host: process.env.CONFIG_REDIS_OAUTH_HOST,
            port: Number(process.env.CONFIG_REDIS_OAUTH_PORT),
            password: process.env.CONFIG_REDIS_OAUTH_PASSWORD,
            db: Number(process.env.CONFIG_REDIS_OAUTH_DB),
          },
          grpc: {
            host: process.env.CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_HOST,
            port: Number(process.env.CONFIG_GRPC_JAVA_NET_TECHRES_OAUTH_PORT),
          },
          logging: {
            enabled: true,
          },
        };
        return initializeGlobalAuthService(globalAuthConfig);
      })(),
    ]);

    if (authService.status === "rejected") {
      logger.error("Failed to initialize auth service:", authService.reason);
    }

    // Setup application components (these need to be sequential)
    setupApplicationErrorHandling(app);

    // Configure template engine for views using NestJS built-in method
    app.setViewEngine({
      engine: {
        handlebars: require("handlebars"),
      },
      templates: "src/templates",
      options: {
        partials: {
          header: "header.hbs",
          footer: "footer.hbs",
        },
      },
    });

    app.connectMicroservice<MicroserviceOptions>(grpcServerOptions);
    app.startAllMicroservices();

    app.enableVersioning({
      type: VersioningType.URI,
    });
    app.setGlobalPrefix("/api");
    app.enableCors();

    setupTimer.end();
    logSystemMetrics("App Configured");

    // Phase 3: Start server and setup documentation in parallel
    const serverStartTimer = new PerformanceTimer("Server Start");
    const port = getEnvVar("SERVICE_PORT", "3000");

    // Start server and setup swagger in parallel
    const [serverResult, swaggerResult] = await Promise.allSettled([
      app.listen(port, "0.0.0.0"),
      setupSwaggerDocumentation(app),
    ]);

    if (serverResult.status === "rejected") {
      throw new Error(`Failed to start server: ${serverResult.reason}`);
    }

    if (swaggerResult.status === "rejected") {
      logger.warn("Swagger setup failed but continuing:", swaggerResult.reason);
    }

    serverStartTimer.end();
    logSystemMetrics("Server Started");

    console.log(`\n🚀 Application successfully started on port ${port}\n`);

    // Phase 4: Display configuration (non-blocking)
    setImmediate(async () => {
      try {
        await Promise.allSettled([
          displaySystemConfiguration(),
          (async () => {
            try {
              const appUrl = await app.getUrl();
              console.log(
                cowsay.think({
                  text: `🌐 Application is running on: ${appUrl}`,
                  e: "OO",
                })
              );
            } catch (error) {
              console.error(
                "❌ Failed to display application URL:",
                error.message
              );
            }
          })(),
        ]);
      } catch (error) {
        console.warn(
          "⚠️  Non-critical post-startup tasks failed:",
          error.message
        );
      }
    });

    bootstrapTimer.end();
    logSystemMetrics("Bootstrap Complete");

    console.log("🎉 Bootstrap completed successfully!\n");
  } catch (error) {
    logger.error(
      "💥 Failed to start application:",
      error.stack || error.message
    );
    logSystemMetrics("Bootstrap Failed");

    // Attempt graceful cleanup
    if (app) {
      try {
        await app.close();
        logger.log("Application closed gracefully");
      } catch (closeError) {
        logger.error(
          "Failed to close application gracefully:",
          closeError.message
        );
      }
    }

    // Exit with error code
    process.exit(1);
  }
}

// Start the application with error handling
bootstrap().catch((error) => {
  logger.error("Unhandled error in bootstrap:", error.stack || error.message);
  process.exit(1);
});
