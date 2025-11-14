import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    this.firestore = admin.firestore();
    this.firestore.settings({ ignoreUndefinedProperties: true });
  }

  // 🔹 자료/과제 추가
  async addPost(dto: CreatePostDto) {
    if (!dto.rootClassUid) {
      throw new BadRequestException('rootClassUid가 필요합니다.');
    }
    if (!dto.postState) {
      throw new BadRequestException('postState가 필요합니다.');
    }

    const docRef = this.firestore.collection('post').doc(dto.rootClassUid);

    try {
      const docSnap = await docRef.get();

      const basePostList = dto.postList.map((item) => {
        const commonData: any = {
          postUid: item.postUid,
          postName: item.postName,
          postDescription: item.postDescription,
          postState: dto.postState,
          createdAt: new Date(),
          // 🔹 새로 추가
          fileUrl: (item as any).fileUrl || null,
          submissionUrls: (item as any).submissionUrls || [],
        };

        if (dto.postState === 'assignment') {
          commonData.postStartDate = new Date((item as any).postStartDate);
          commonData.postEndDate = new Date((item as any).postEndDate);
        }

        return commonData;
      });

      if (!docSnap.exists) {
        // 새 문서
        const data = {
          rootClassUid: dto.rootClassUid,
          postList: basePostList,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await docRef.set(data);
      } else {
        // 기존 문서 업데이트 -> 배열에 추가
        for (const post of basePostList) {
          await docRef.update({
            postList: admin.firestore.FieldValue.arrayUnion(post),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      return { message: 'Post 추가 완료', rootClassUid: dto.rootClassUid };
    } catch (error) {
      console.error('Post 추가 실패:', error);
      throw new BadRequestException('Post 추가 중 오류 발생');
    }
  }

  // 🔹 자료 조회
  async getPostsByClassUid(rootClassUid: string) {
    if (!rootClassUid) throw new BadRequestException('rootClassUid가 필요합니다.');

    try {
      const docRef = this.firestore.collection('post').doc(rootClassUid);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new NotFoundException(`해당 클래스(${rootClassUid})의 자료가 없습니다.`);
      }

      const data = docSnap.data();
      const postList = data?.postList || [];

      // createdAt 기준 최신 정렬
      const sortedList = postList.sort((a: any, b: any) => {
        const tA = a.createdAt?._seconds
          ? a.createdAt._seconds * 1000
          : new Date(a.createdAt).getTime();
        const tB = b.createdAt?._seconds
          ? b.createdAt._seconds * 1000
          : new Date(b.createdAt).getTime();
        return tB - tA;
      });

      return {
        rootClassUid,
        count: sortedList.length,
        posts: sortedList,
      };
    } catch (error) {
      console.error('자료 조회 오류:', error);
      throw new BadRequestException('자료 조회 실패');
    }
  }

  // 🔹 포스트 삭제
  async deletePost(rootClassUid: string, postUid: string) {
    if (!rootClassUid) throw new BadRequestException('rootClassUid가 필요합니다.');
    if (!postUid) throw new BadRequestException('postUid가 필요합니다.');

    const docRef = this.firestore.collection('post').doc(rootClassUid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new NotFoundException(`해당 클래스(${rootClassUid})의 포스트 문서가 없습니다.`);
    }

    const data = docSnap.data();
    const postList = data?.postList || [];

    // 해당 postUid 존재 확인
    const exists = postList.some((item: any) => item.postUid === postUid);
    if (!exists) {
      throw new NotFoundException(`postUid(${postUid})가 존재하지 않습니다.`);
    }

    // post 제거
    const updatedPostList = postList.filter((item: any) => item.postUid !== postUid);

    try {
      await docRef.update({
        postList: updatedPostList,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        message: '포스트 삭제 완료',
        deletedPostUid: postUid,
      };
    } catch (error) {
      console.error('포스트 삭제 오류:', error);
      throw new BadRequestException('포스트 삭제 실패');
    }
  }

  // 🔹 포스트 수정
  // 🔹 포스트 수정
  async updatePost(
    rootClassUid: string,
    postUid: string,
    updateData: {
      postName?: string;
      postDescription?: string;
      postEndDate?: string | null; // null 허용
      fileUrl?: string | null;     // ⭐️ fileUrl 추가
    },
  ) {
    if (!rootClassUid) throw new BadRequestException('rootClassUid가 필요합니다.');
    if (!postUid) throw new BadRequestException('postUid가 필요합니다.');

    const docRef = this.firestore.collection('post').doc(rootClassUid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new NotFoundException(`해당 클래스(${rootClassUid})의 포스트 문서가 없습니다.`);
    }

    const data = docSnap.data();
    const postList = data?.postList || [];

    const exists = postList.some((item: any) => item.postUid === postUid);
    if (!exists) {
      throw new NotFoundException(`postUid(${postUid})가 존재하지 않습니다.`);
    }

    // 🔹 undefined 대신 null 처리 + fileUrl 반영
    const updatedPostList = postList.map((post: any) => {
      if (post.postUid !== postUid) return post;

      return {
        ...post,
        postName: updateData.postName ?? post.postName,
        postDescription: updateData.postDescription ?? post.postDescription,
        postEndDate: updateData.postEndDate
          ? new Date(updateData.postEndDate)
          : post.postEndDate,
        fileUrl: updateData.fileUrl !== undefined ? updateData.fileUrl : post.fileUrl, // ⭐️ 여기
        updatedAt: new Date(),
      };
    });

    try {
      await docRef.update({
        postList: updatedPostList,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        message: '포스트 수정 완료',
        updatedPostUid: postUid,
      };
    } catch (error) {
      console.error('🔥 포스트 수정 오류:', error);
      throw new BadRequestException('포스트 수정 실패');
    }
  }
}