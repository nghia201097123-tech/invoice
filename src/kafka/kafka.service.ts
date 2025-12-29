import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { Consumer, Kafka, Producer } from "kafkajs";

@Injectable()
export class KafkaService implements OnModuleInit, OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: [
      `${process.env.CONFIG_KAFKA_HOST_INVOICE}:${process.env.CONFIG_KAFKA_PORT_INVOICE}`,
    ],
  });
  private readonly producer: Producer = this.kafka.producer();
  private consumer: Consumer;

  async onModuleInit() {
    try {
      await this.producer.connect();
      // @ts-ignore
    } catch (error) {
      console.error("Failed to connect to Kafka server:", error);
    }
  }

  async onApplicationShutdown(signal?: string) {
    await this.disconnect();
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      if (this.consumer) {
        await this.consumer.disconnect();
      }
      console.log("Disconnected from Kafka server");
    } catch (error) {
      console.error("Error while disconnecting from Kafka server:", error);
    }
  }

  /**
   * Gửi message qua Kafka topic
   * @param topic Tên topic Kafka
   * @param message Nội dung message
   */
  async sendMessage(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });
      console.log(`Message sent to topic ${topic}:`, message);
    } catch (error) {
      console.error(`Error sending message to topic ${topic}:`, error);
      throw error;
    }
  }
}
