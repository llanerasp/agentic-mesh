import type { Request, Response } from 'express';
import { ok } from '@llm-agent/shared';
import type { ChatService } from './chat.service';
import type { ChatInput } from './chat.schemas';

export class ChatController {
  constructor(private readonly service: ChatService) {}

  chat = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as ChatInput;
    const result = await this.service.chat(input);
    res.status(200).json(ok(result));
  };
}
