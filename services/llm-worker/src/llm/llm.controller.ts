import type { Request, Response } from 'express';
import { ok } from '@llm-agent/shared';
import type { LLMService } from './llm.service';
import type { GenerateInput } from './llm.schemas';

/**
 * Controller fino. Extrae los datos de la request, llama al service,
 * formatea la respuesta. Ninguna logica de negocio aqui.
 */
export class LLMController {
  constructor(private readonly service: LLMService) {}

  generate = async (req: Request, res: Response): Promise<void> => {
    // req.body ya esta validado y parseado por el middleware validate().
    const input = req.body as GenerateInput;
    const result = await this.service.generate(input);
    res.status(200).json(ok(result));
  };
}
