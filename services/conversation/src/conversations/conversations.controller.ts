import type { Request, Response } from 'express';
import { ok } from '@llm-agent/shared';
import type { ConversationsService } from './conversations.service';
import type { CreateConversationInput, AddMessageInput, ListMessagesQuery } from './conversations.schemas';

export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateConversationInput;
    const conversation = await this.service.createConversation(input);
    res.status(201).json(ok(conversation));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { conversationId } = req.params as { conversationId: string };
    const conversation = await this.service.getConversation(conversationId);
    res.status(200).json(ok(conversation));
  };

  addMessage = async (req: Request, res: Response): Promise<void> => {
    const { conversationId } = req.params as { conversationId: string };
    const input = req.body as AddMessageInput;
    const message = await this.service.addMessage(conversationId, input);
    res.status(201).json(ok(message));
  };

  listMessages = async (req: Request, res: Response): Promise<void> => {
    const { conversationId } = req.params as { conversationId: string };
    const query = req.query as unknown as ListMessagesQuery;
    const { items, meta } = await this.service.listMessages(conversationId, query);
    res.status(200).json(ok(items, meta));
  };
}
