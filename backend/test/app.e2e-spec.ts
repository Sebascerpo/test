import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/modules/shared/infrastructure/health.controller';

describe('HealthController (e2e)', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleFixture.get(HealthController);
  });

  it('health endpoint contract', () => {
    const response = controller.health();
    expect(response.status).toBe('ok');
    expect(response.service).toBe('payment-api');
    expect(typeof response.timestamp).toBe('string');
  });
});
