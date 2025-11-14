import { Module } from '@nestjs/common';
import { ClassListController } from './classList.controller';
import { ClassListService } from './classList.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [ClassListController],
  providers: [ClassListService]
})
export class ClassListModule {}
