import { Test, TestingModule } from '@nestjs/testing';
import { SpecialService } from './special.service';

describe('SpecialService', () => {
  let service: SpecialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpecialService],
    }).compile();

    service = module.get<SpecialService>(SpecialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
