import axios from "axios";
import { envs, logger } from "../../shared";

type SendMessagePayload = {
  chat_id: string | number;
  text: string;
  parse_mode: string;
  message_thread_id?: number;
};

class TelegramService {
  private botToken = envs.TELEGRAM_BOT_TOKEN;
  private chatId = envs.TELEGRAM_CHAT_ID;
  // private errorsThreadId = envs.TELEGRAM_ERRORS_THREAD_ID;
  private baseUrl = `https://api.telegram.org/bot${this.botToken}`;

  public async sendAdminNotification(
    message: string,
    threadId: number,
  ): Promise<void> {
    try {
      const payload: SendMessagePayload = {
        chat_id: this.chatId,
        text: message,
        parse_mode: "html",
        message_thread_id: threadId,
      };

      await axios.post(`${this.baseUrl}/sendMessage`, payload);
      logger.info(`Sent Telegram notification to chat ID ${this.chatId}`);
    } catch (error) {
      logger.error("Failed to send Telegram notification");
      if (axios.isAxiosError(error)) {
        logger.error(error.response?.data || error.message);
      } else {
        logger.error(error);
      }
    }
  }
}

export const telegramService = new TelegramService();
