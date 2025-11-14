import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateClassListDto } from './dto/create-classList.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class ClassListService {
  constructor(private readonly firebaseService: FirebaseService) { }

  private get collection() {
    return this.firebaseService.getDb().collection('classList');
  }

  // 클래스 생성
  async addClassList(dto: CreateClassListDto) {
    const duplicateQuery = await this.collection
      .where('className', '==', dto.className)
      .get();

    if (!duplicateQuery.empty) {
      throw new BadRequestException({
        code: 'DUPLICATE_INFO',
        message: '이미 같은 클래스 이름이 존재합니다!'
      });
    }

    const classListData = {
      classUid: dto.classUid,
      creatorUid: dto.creatorUid,
      entranceStatus: dto.entranceStatus,
      status: dto.status,
      coverImg: dto.coverImg,
      className: dto.className,
      description: dto.description,
      field: dto.field,
      requirement: dto.requirement,
      caution: dto.caution,
      capacity: dto.capacity,
      startDate: dto.startDate,
      endDate: dto.endDate,
      mentiUidArray: dto.mentiUidArray ?? [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await this.collection.doc(dto.classUid).set(classListData);
    return { message: '클래스 생성 완료' };
  }

  // 현재 사용자가 만든 클래스 제외 + entranceStatus가 'Open' + 멘티 신청 안 한 것
  async getOpenClassesExcludingCreator(uid: string) {
    const snapshot = await this.collection
      .where('creatorUid', '!=', uid)
      .where('entranceStatus', '==', 'Open')
      .get();

    if (snapshot.empty) return [];

    // 멘티 UID 배열에 내 UID가 없는 것만 필터링
    const classList = snapshot.docs
      .map(doc => doc.data())
      .filter(cls => !(cls.mentiUidArray?.includes(uid)));

    return classList;
  }

  // 멘토 클래스 조회 (내가 만든 것만, Waiting이 맨 위로)
  async getMentoClasses(creatorUid: string) {
    // status == 'Waiting' 인 클래스
    const waitingSnapshot = await this.collection
      .where('creatorUid', '==', creatorUid)
      .where('status', '==', 'Waiting')
      .get();

    // 나머지 클래스들
    const othersSnapshot = await this.collection
      .where('creatorUid', '==', creatorUid)
      .where('status', '!=', 'Waiting')
      .get();

    // 데이터 변환
    const waitingClasses = waitingSnapshot.docs.map((doc) => ({
      id: doc.id,
      classUid: doc.id, 
      ...doc.data(),
    }));

    const otherClasses = othersSnapshot.docs.map((doc) => ({
      id: doc.id,
      classUid: doc.id, 
      ...doc.data(),
    }));

    // 'Waiting' → 그 외 순으로 합쳐서 반환
    return [...waitingClasses, ...otherClasses];
  }

  // 멘티 클래스 조회 (내가 신청한 것만)
  async getMentiClasses(uid: string) {
    const snapshot = await this.collection
      .where('mentiUidArray', 'array-contains', uid)
      .where('status', '==', 'Running')
      .get();

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      classUid: doc.id, 
      ...doc.data(),
    }));
  }

  // 클래스 참가 (참가하기 버튼)
  async joinClass(classUid: string, userUid: string) {
    const docRef = this.collection.doc(classUid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new BadRequestException('해당 클래스가 존재하지 않습니다.');
    }

    const classData = docSnap.data() as any;

    // 이미 참여했는지 확인
    if (classData.mentiUidArray?.includes(userUid)) {
      throw new BadRequestException('이미 참여한 클래스입니다.');
    }

    const updatedMentiUidArray = [
      ...(classData.mentiUidArray ?? []),
      userUid,
    ];

    const capacity = classData.capacity ?? 0;
    const newEntranceStatus =
      updatedMentiUidArray.length >= capacity ? 'Closed' : classData.entranceStatus;

    await docRef.update({
      mentiUidArray: updatedMentiUidArray,
      entranceStatus: newEntranceStatus,
    });

    return {
      message: '참가 완료',
      currentParticipants: updatedMentiUidArray.length,
      entranceStatus: newEntranceStatus,
    };
  }

  // 클래스 시작: status → 'Running'으로 변경
  async startClass(classUid: string) {
    const docRef = this.collection.doc(classUid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new NotFoundException('해당 클래스가 존재하지 않습니다.');
    }

    // Firestore 업데이트: status만 Running으로 변경
    await docRef.update({
      status: 'Running',
    });

    return { classUid, status: 'Running' };
  }
}
