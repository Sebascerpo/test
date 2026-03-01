// Infrastructure Adapter - Payment Gateway (Sandbox)
import { Injectable } from '@nestjs/common';
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

// External Provider Sandbox Configuration
const EXTERNAL_PROVIDER_CONFIG: PaymentConfig = {
  publicKey: 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7',
  privateKey: 'prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg',
  baseUrl: 'https://api-sandbox.co.uat.wompi.dev/v1',
  integrityKey: 'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp',
};

@Injectable()
export class PaymentGatewayAdapter implements PaymentGatewayPort {
  private config: PaymentConfig;

  constructor(config: PaymentConfig = EXTERNAL_PROVIDER_CONFIG) {
    this.config = config;
  }

  async tokenizeCard(
    input: CardTokenizationInput,
  ): ResultAsync<CardTokenizationResult> {
    try {
      console.log('[EXTERNAL_PROVIDER] Tokenizing card...');
      // Simulation: Return a mock token
      return ok({
        token: `tok_test_${Math.random().toString(36).substring(7)}`,
        last_four: input.number.slice(-4),
      });
    } catch (error) {
      return err(
        new Error(
          `Tokenization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async createPaymentSource(
    input: PaymentSourceInput,
  ): ResultAsync<PaymentSourceResult> {
    try {
      console.log('[EXTERNAL_PROVIDER] Creating payment source...');
      return ok({
        id: `src_test_${Math.random().toString(36).substring(7)}`,
      });
    } catch (error) {
      return err(
        new Error(
          `Failed to create payment source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async createTransaction(
    input: TransactionInput,
  ): ResultAsync<TransactionResult> {
    try {
      console.log('[EXTERNAL_PROVIDER] Creating transaction...', {
        reference: input.reference,
      });

      // Simulation: Random status (mostly APPROVED)
      const statuses: ('APPROVED' | 'DECLINED' | 'ERROR')[] = [
        'APPROVED',
        'APPROVED',
        'APPROVED',
        'DECLINED',
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      return ok({
        id: `tr_test_${Math.random().toString(36).substring(7)}`,
        status: status,
        reference: input.reference,
      });
    } catch (error) {
      return err(
        new Error(
          `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async getTransactionStatus(id: string): ResultAsync<TransactionResult> {
    try {
      console.log('[EXTERNAL_PROVIDER] Fetching transaction status...', { id });
      return ok({
        id,
        status: 'APPROVED',
        reference: `ref_${Math.random().toString(36).substring(7)}`,
      });
    } catch (error) {
      return err(
        new Error(
          `Failed to fetch status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async getAcceptanceToken(): ResultAsync<string> {
    try {
      console.log('[EXTERNAL_PROVIDER] Fetching acceptance token...');
      return ok('test_acceptance_token');
    } catch (error) {
      return err(
        new Error(
          `Failed to fetch acceptance token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}
