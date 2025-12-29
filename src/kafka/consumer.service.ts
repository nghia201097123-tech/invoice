import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Consumer, ConsumerRunConfig, Kafka } from "kafkajs";

export const KafkaTopic: any = {
  topics: ["kafka.topic.invoice-sync"],
};

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: [
      `${process.env.CONFIG_KAFKA_HOST_INVOICE}:${process.env.CONFIG_KAFKA_PORT_INVOICE}`,
    ],
  });
  private readonly consumers: Consumer[] = [];

  /**
   *
   * @param topic
   * @param config
   */
  public getKafka() {
    return this.kafka;
  }

  async consumerElectricInvoice(config: ConsumerRunConfig): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: "electric-invoices-techres-local",
    });
    await consumer.connect();
    await consumer.subscribe({
      topics: KafkaTopic.topics,
      fromBeginning: false,
    });
    await consumer.run(config);
    this.consumers.push(consumer);
  }

  async consumerClearCacheInvoice(config: ConsumerRunConfig): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: "electric-invoices-clear-cache",
    });
    await consumer.connect();
    await consumer.subscribe({
      topics: ["kafka.topic.invoice-clear-restaurant-invoice-cache"],
      fromBeginning: false,
    });
    await consumer.run(config);
    this.consumers.push(consumer);
  }
  async onApplicationShutdown() {
    // @ts-ignore
    for (const consumer: Consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
