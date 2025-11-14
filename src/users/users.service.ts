import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(private readonly firebaseService: FirebaseService) { }

  private get collection() {
    return this.firebaseService.getDb().collection('users');
  }

  async createUser(dto: CreateUserDto) {
    // 중복 확인 (학년/반/번호)
    const duplicateQuery = await this.collection
      .where('grade', '==', dto.grade)
      .where('class_room', '==', dto.class_room)
      .where('number', '==', dto.number)
      .get();

    const duplicateNickNameQuery = await this.collection
      .where('nickname', '==', dto.nickname)
      .get();

    if (!duplicateQuery.empty) {
      throw new BadRequestException({
        code: 'DUPLICATE_INFO',
        message: '이미 같은 학년/반/번호가 존재합니다!'
      });
    }

    if (!duplicateNickNameQuery.empty) {
      throw new BadRequestException({
        code: 'DUPLICATE_NICKNAME',
        message: '이미 같은 닉네임이 존재합니다!'
      });
    }



    // Firestore에 저장할 데이터 구성 (DTO 구조 반영)
    const userData = {
      uid: dto.uid,
      email: dto.email,
      name: dto.name,
      grade: dto.grade,
      class_room: dto.class_room, // Firestore에는 'class' 필드로 저장
      number: dto.number,
      nickname: dto.nickname,
      score: dto.score ?? 0.0, // 점수 초기값 0.0
      reviews: dto.reviews ?? [], // 빈 배열
      myClass: dto.myClass ?? [], // 빈 배열
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // ✅ Firestore 저장
    await this.collection.doc(dto.uid).set(userData);

    return { message: '회원가입 완료' };
  }
}
