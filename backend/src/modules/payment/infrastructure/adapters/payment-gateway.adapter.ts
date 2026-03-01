// Infrastructure Adapter - Payment Gateway (Wompi Sandbox)
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  PaymentGatewayPort,
  CardTokenizationInput,
  CardTokenizationResult,
  PaymentSourceInput,
  PaymentSourceResult,
  TransactionInput,
  TransactionResult,
  PaymentConfig,
} from '../../application/ports/payment-gateway.port';
import { ResultAsync, ok, err } from '../../../../shared/common/rop';

@Injectable()
export class PaymentGatewayAdapter implements PaymentGatewayPort {
  private api: AxiosInstance;

  constructor(private readonly config: PaymentConfig) {
    this.api = axios.create({
      baseURL: this.config.baseUrl,
    });
  }

  private getPublicHeaders() {
    return {
      Authorization: `Bearer ${this.config.publicKey}`,
    };
  }

  private getPrivateHeaders() {
    return {
      Authorization: `Bearer ${this.config.privateKey}`,
    };
  }

  private extractErrorMessage(error: any, defaultMsg: string): string {
    const axiosError = error as {
      response?: {
        data?: {
          error?: {
            type: string;
            reason?: string;
            messages?: Record<string, string[]>;
          };
        };
      };
      message?: string;
    };
    const data = axiosError.response?.data?.error;
    if (!data) return axiosError.message || defaultMsg;

    if (data.type === 'INPUT_VALIDATION_ERROR' && data.messages) {
      // Wompi returns validation errors as an object where keys are fields and values are arrays of strings
      const details = Object.entries(data.messages)
        .map(
          ([field, msgs]) =>
            `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`,
        )
        .join('; ');
      return `Validación: ${details}`;
    }

    return data.reason || data.type || defaultMsg;
  }

  async tokenizeCard(
    input: CardTokenizationInput,
  ): ResultAsync<CardTokenizationResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Tokenizing card (Public Key)...');
      const response = await this.api.post<{ data: { id: string } }>(
        '/tokens/cards',
        {
          number: input.number,
          cvc: input.cvc,
          exp_month: input.exp_month,
          exp_year: input.exp_year,
          card_holder: input.card_holder,
        },
        { headers: this.getPublicHeaders() },
      );

      return ok({
        token: response.data.data.id,
        last_four: input.number.slice(-4),
      });
    } catch (error: any) {
      const msg = this.extractErrorMessage(error, 'Tokenization failed');
      console.error('[PAYMENT_GATEWAY] Tokenization Error:', msg);
      return err(new Error(msg));
    }
  }

  async createPaymentSource(
    input: PaymentSourceInput,
  ): ResultAsync<PaymentSourceResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Creating payment source (Private Key)...');
      const response = await this.api.post<{ data: { id: number } }>(
        '/payment_sources',
        {
          type: input.type,
          token: input.token,
          customer_email: input.customer_email,
          acceptance_token: input.acceptance_token,
        },
        { headers: this.getPrivateHeaders() },
      );

      return ok({
        id: response.data.data.id.toString(),
      });
    } catch (error: any) {
      const msg = this.extractErrorMessage(
        error,
        'Failed to create payment source',
      );
      console.error('[PAYMENT_GATEWAY] Payment Source Error:', msg);
      return err(new Error(msg));
    }
  }

  async createTransaction(
    input: TransactionInput,
  ): ResultAsync<TransactionResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Creating transaction (Private Key)...', {
        reference: input.reference,
      });

      const response = await this.api.post<{
        data: { id: string; status: string; reference: string };
      }>(
        '/transactions',
        {
          amount_in_cents: input.amount_in_cents,
          currency: input.currency,
          customer_email: input.customer_email,
          payment_source_id: parseInt(input.payment_source_id, 10),
          reference: input.reference,
          signature: input.signature,
          payment_method: {
            installments: input.installments,
          },
        },
        { headers: this.getPrivateHeaders() },
      );

      return ok({
        id: response.data.data.id,
        status: response.data.data.status as any,
        reference: response.data.data.reference,
      });
    } catch (error: any) {
      const msg = this.extractErrorMessage(error, 'Transaction failed');
      console.error('[PAYMENT_GATEWAY] Transaction Error:', msg);
      return err(new Error(msg));
    }
  }

  async getTransactionStatus(id: string): ResultAsync<TransactionResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Fetching status (Private Key)...', { id });
      const response = await this.api.get<{
        data: { id: string; status: string; reference: string };
      }>(`/transactions/${id}`, {
        headers: this.getPrivateHeaders(),
      });
      return ok({
        id: response.data.data.id,
        status: response.data.data.status as any,
        reference: response.data.data.reference,
      });
    } catch (error: any) {
      const msg = this.extractErrorMessage(error, 'Failed to fetch status');
      return err(new Error(msg));
    }
  }

  async getAcceptanceToken(): ResultAsync<string> {
    try {
      console.log(
        '[PAYMENT_GATEWAY] Fetching acceptance token (Public Key)...',
      );
      const response = await this.api.get<{
        data: { presigned_acceptance: { acceptance_token: string } };
      }>(`/merchants/${this.config.publicKey}`, {
        headers: this.getPublicHeaders(),
      });
      const acceptanceToken =
        response.data.data.presigned_acceptance.acceptance_token;
      return ok(acceptanceToken);
    } catch (error: any) {
      const msg = this.extractErrorMessage(
        error,
        'Failed to fetch acceptance token',
      );
      console.error('[PAYMENT_GATEWAY] Acceptance Token Error:', msg);
      return err(new Error(msg));
    }
  }

  generateSignature(reference: string, amountInCents: number): string {
    const rawSignature = `${reference}${amountInCents}${this.config.currency}${this.config.integrityKey}`;
    return crypto.createHash('sha256').update(rawSignature).digest('hex');
  }
}
