import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return home infos', () => {
      const res = appController.getHomeInfos();
      expect(res).toBeDefined();
      expect(res.name).toBe('developer-website-api');
      expect(res.author).toBe('Samakunchan');
    });
  });
});
