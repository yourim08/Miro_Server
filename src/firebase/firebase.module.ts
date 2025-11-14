// firebase/firebase.module.ts
import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Module({
  providers: [FirebaseService],
  exports: [FirebaseService], // 다른 모듈에서 주입 가능하게 export
})
export class FirebaseModule {}
