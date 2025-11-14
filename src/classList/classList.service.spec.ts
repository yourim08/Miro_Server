import { Test, TestingModule } from '@nestjs/testing';
import { ClassListService } from './classList.service';

describe('ClassListService', () => {
  let service: ClassListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassListService],
    }).compile();

    service = module.get<ClassListService>(ClassListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
