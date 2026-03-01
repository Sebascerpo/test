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

  async tokenizeCard(
    input: CardTokenizationInput,
  ): ResultAsync<CardTokenizationResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Tokenizing card (Public Key)...');
      const response = await this.api.post(
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
      console.error(
        '[PAYMENT_GATEWAY] Tokenization Error Payload:',
        JSON.stringify(error.response?.data, null, 2),
      );
      console.error('[PAYMENT_GATEWAY] Full Error Object:', error.message);
      return err(
        new Error(
          error.response?.data?.error?.reason ||
            error.response?.data?.error?.type ||
            'Tokenization failed',
        ),
      );
    }
  }

  async createPaymentSource(
    input: PaymentSourceInput,
  ): ResultAsync<PaymentSourceResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Creating payment source (Private Key)...');
      const response = await this.api.post(
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
      console.error(
        '[PAYMENT_GATEWAY] Payment Source Error Payload:',
        JSON.stringify(error.response?.data, null, 2),
      );
      return err(
        new Error(
          error.response?.data?.error?.reason ||
            error.response?.data?.error?.type ||
            'Failed to create payment source',
        ),
      );
    }
  }

  async createTransaction(
    input: TransactionInput,
  ): ResultAsync<TransactionResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Creating transaction (Private Key)...', {
        reference: input.reference,
      });

      const response = await this.api.post(
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
        status: response.data.data.status,
        reference: response.data.data.reference,
      });
    } catch (error: any) {
      console.error(
        '[PAYMENT_GATEWAY] Transaction Error Payload:',
        JSON.stringify(error.response?.data, null, 2),
      );
      return err(
        new Error(
          error.response?.data?.error?.reason ||
            error.response?.data?.error?.type ||
            'Transaction failed',
        ),
      );
    }
  }

  async getTransactionStatus(id: string): ResultAsync<TransactionResult> {
    try {
      console.log('[PAYMENT_GATEWAY] Fetching status (Private Key)...', { id });
      const response = await this.api.get(`/transactions/${id}`, {
        headers: this.getPrivateHeaders(),
      });
      return ok({
        id: response.data.data.id,
        status: response.data.data.status,
        reference: response.data.data.reference,
      });
    } catch (error: any) {
      return err(
        new Error(
          error.response?.data?.error?.reason || 'Failed to fetch status',
        ),
      );
    }
  }

  async getAcceptanceToken(): ResultAsync<string> {
    try {
      console.log(
        '[PAYMENT_GATEWAY] Fetching acceptance token (Public Key)...',
      );
      const response = await this.api.get(
        `/merchants/${this.config.publicKey}`,
        { headers: this.getPublicHeaders() },
      );
      const acceptanceToken =
        response.data.data.presigned_acceptance.acceptance_token;
      return ok(acceptanceToken);
    } catch (error: any) {
      console.error(
        '[PAYMENT_GATEWAY] Acceptance Token Error:',
        error.response?.data || error.message,
      );
      return err(new Error('Failed to fetch acceptance token'));
    }
  }

  generateSignature(reference: string, amountInCents: number): string {
    const rawSignature = `${reference}${amountInCents}${this.config.currency}${this.config.integrityKey}`;
    return crypto.createHash('sha256').update(rawSignature).digest('hex');
  }
}
