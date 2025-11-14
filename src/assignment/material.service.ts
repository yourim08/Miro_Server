import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateMaterialDto } from './dto/create-material.dto';

@Injectable()
export class MaterialService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    // Firebase Admin SDK 초기화 후 Firestore 가져오기
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(), // 또는 serviceAccountKey.json
      });
    }
    this.firestore = admin.firestore();
  }

  // 🔹 자료 추가
  async addMaterial(dto: CreateMaterialDto) {
    if (!dto.rootClassUid) {
      throw new BadRequestException('rootClassUid가 필요합니다.');
    }

    const docRef = this.firestore.collection('material').doc(dto.rootClassUid);

    try {
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        // 새 문서 생성
        const data = {
          rootClassUid: dto.rootClassUid,
          materialList: dto.materialList.map(item => ({
            materialUid: item.materialUid,
            materialName: item.materialName,
            materialDescription: item.materialDescription,
            createdAt: new Date(), // ✅ 직접 Date 객체로 저장
          })),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(data);
      } else {
        // 기존 문서 업데이트 (배열에 추가)
        for (const item of dto.materialList) {
          await docRef.update({
            materialList: admin.firestore.FieldValue.arrayUnion({
              materialUid: item.materialUid,
              materialName: item.materialName,
              materialDescription: item.materialDescription,
              createdAt: new Date(), // ✅ Date 사용
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      return { message: 'Material 추가 완료', rootClassUid: dto.rootClassUid };
    } catch (error) {
      console.error('Material 추가 실패:', error);
      throw new BadRequestException('Material 추가 중 오류 발생');
    }
  }



  // 🔹 자료 조회 (최신순 정렬)
  async getMaterialsByClassUid(rootClassUid: string) {
    if (!rootClassUid) {
      throw new BadRequestException('rootClassUid가 필요합니다.');
    }

    try {
      const docRef = this.firestore.collection('material').doc(rootClassUid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new NotFoundException(`해당 클래스(${rootClassUid})의 자료를 찾을 수 없습니다.`);
      }

      const data = docSnap.data();
      const materialList = data?.materialList || [];

      // 🔸 createdAt 기준으로 최신순 정렬
      const sortedList = materialList.sort((a: any, b: any) => {
        const timeA = a.createdAt?._seconds
          ? a.createdAt._seconds * 1000
          : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?._seconds
          ? b.createdAt._seconds * 1000
          : new Date(b.createdAt).getTime();
        return timeB - timeA; // 최신 → 오래된 순
      });

      return {
        rootClassUid,
        count: sortedList.length,
        materials: sortedList,
      };
    } catch (error) {
      console.error('자료 조회 중 오류 발생:', error);
      throw new BadRequestException('자료 조회 실패');
    }
  }
}
