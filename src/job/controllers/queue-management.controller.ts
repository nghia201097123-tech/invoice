// import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
// import { CronJobService } from '../task/cron-job.service';
// import { QueueManagerService } from '../services/queue-manager.service';

// @ApiTags('Queue Management')
// @Controller('queue-management')
// export class QueueManagementController {
//   constructor(
//     private readonly cronJobService: CronJobService,
//     private readonly queueManagerService: QueueManagerService,
//   ) {}

//   @Get('stats')
//   @ApiOperation({ summary: 'Lấy thống kê tất cả queue nhà hàng' })
//   @ApiResponse({ status: 200, description: 'Thống kê queue thành công' })
//   async getAllQueueStats() {
//     try {
//       const stats = await this.cronJobService.getQueueStats();
//       return {
//         success: true,
//         data: stats,
//         message: 'Lấy thống kê queue thành công'
//       };
//     } catch (error) {
//       throw new HttpException(
//         {
//           success: false,
//           message: 'Lỗi khi lấy thống kê queue',
//           error: error.message
//         },
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   @Get('stats/:restaurantId')
//   @ApiOperation({ summary: 'Lấy thống kê queue của nhà hàng cụ thể' })
//   @ApiParam({ name: 'restaurantId', description: 'ID của nhà hàng' })
//   @ApiResponse({ status: 200, description: 'Thống kê queue nhà hàng thành công' })
//   async getRestaurantQueueStats(@Param('restaurantId') restaurantId: string) {
//     try {
//       const stats = await this.queueManagerService.getRestaurantQueueStats(+restaurantId);
//       return {
//         success: true,
//         data: stats,
//         message: `Lấy thống kê queue nhà hàng ${restaurantId} thành công`
//       };
//     } catch (error) {
//       throw new HttpException(
//         {
//           success: false,
//           message: `Lỗi khi lấy thống kê queue nhà hàng ${restaurantId}`,
//           error: error.message
//         },
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   @Post('pause/:restaurantId')
//   @ApiOperation({ summary: 'Tạm dừng queue của nhà hàng' })
//   @ApiParam({ name: 'restaurantId', description: 'ID của nhà hàng' })
//   @ApiResponse({ status: 200, description: 'Tạm dừng queue thành công' })
//   async pauseRestaurantQueue(@Param('restaurantId') restaurantId: string) {
//     try {
//       await this.cronJobService.pauseRestaurantQueue(+restaurantId);
//       return {
//         success: true,
//         message: `Tạm dừng queue nhà hàng ${restaurantId} thành công`
//       };
//     } catch (error) {
//       throw new HttpException(
//         {
//           success: false,
//           message: `Lỗi khi tạm dừng queue nhà hàng ${restaurantId}`,
//           error: error.message
//         },
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   @Post('resume/:restaurantId')
//   @ApiOperation({ summary: 'Tiếp tục queue của nhà hàng' })
//   @ApiParam({ name: 'restaurantId', description: 'ID của nhà hàng' })
//   @ApiResponse({ status: 200, description: 'Tiếp tục queue thành công' })
//   async resumeRestaurantQueue(@Param('restaurantId') restaurantId: string) {
//     try {
//       await this.cronJobService.resumeRestaurantQueue(+restaurantId);
//       return {
//         success: true,
//         message: `Tiếp tục queue nhà hàng ${restaurantId} thành công`
//       };
//     } catch (error) {
//       throw new HttpException(
//         {
//           success: false,
//           message: `Lỗi khi tiếp tục queue nhà hàng ${restaurantId}`,
//           error: error.message
//         },
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   @Post('cleanup')
//   @ApiOperation({ summary: 'Dọn dẹp queue không sử dụng' })
//   @ApiResponse({ status: 200, description: 'Dọn dẹp queue thành công' })
//   async cleanupUnusedQueues() {
//     try {
//       await this.queueManagerService.cleanupUnusedQueues();
//       return {
//         success: true,
//         message: 'Dọn dẹp queue không sử dụng thành công'
//       };
//     } catch (error) {
//       throw new HttpException(
//         {
//           success: false,
//           message: 'Lỗi khi dọn dẹp queue',
//           error: error.message
//         },
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   @Post('trigger-manual-send')
//   @ApiOperation({ summary: 'Kích hoạt gửi hóa đơn thủ công' })
//   @ApiResponse({ status: 200, description: 'Kích hoạt gửi hóa đơn thành công' })
//   async triggerManualSend() {
//     try {
//       await this.cronJobService.autoSendThirdParty();
//       return {
//         success: true,
//         message: 'Kích hoạt gửi hóa đơn thủ công thành công'
//       };
//     } catch (error) {
//       throw new HttpException(
//         {
//           success: false,
//           message: 'Lỗi khi kích hoạt gửi hóa đơn thủ công',
//           error: error.message
//         },
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   @Get('health')
//   @ApiOperation({ summary: 'Kiểm tra tình trạng queue system' })
//   @ApiResponse({ status: 200, description: 'Queue system đang hoạt động bình thường' })
//   async getQueueHealth() {
//     try {
//       const stats = await this.cronJobService.getQueueStats();
//       const totalQueues = stats.length;
//       const activeQueues = stats.filter(s => s.stats.active > 0).length;
//       const failedJobs = stats.reduce((sum, s) => sum + s.stats.failed, 0);

//       return {
//         success: true,
//         data: {
//           totalQueues,
//           activeQueues,
//           failedJobs,
//           status: failedJobs > 10 ? 'warning' : 'healthy',
//           timestamp: new Date().toISOString()
//         },
//         message: 'Kiểm tra tình trạng queue thành công'
//       };
//     } catch (error) {
//       throw new HttpException(
//         {
//           success: false,
//           message: 'Lỗi khi kiểm tra tình trạng queue',
//           error: error.message
//         },
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }
// }
