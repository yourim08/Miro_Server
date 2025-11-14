import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FirebaseService } from './firebase/firebase.service';
import { ClassListModule } from './classList/classList.module';
import { PostModule } from './post/post.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [UsersModule, ClassListModule, PostModule, UploadModule],
  providers: [FirebaseService],
})
export class AppModule {}
