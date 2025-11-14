import { Test, TestingModule } from '@nestjs/testing';
import { ClassListController } from './classList.controller';

describe('ClassListController', () => {
  let controller: ClassListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassListController],
    }).compile();

    controller = module.get<ClassListController>(ClassListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
