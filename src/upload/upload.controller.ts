import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Put,
  BadRequestException,
  Get,
  Param,
  Res,
  NotFoundException,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import path, { extname, join } from 'path';
import type { Response } from 'express';

@Controller('upload')
export class UploadController {
  @Post('uploadFile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const { classUid, postUid, postState, role, userUid } = req.body;

          if (!classUid || !postUid || !postState || !role) {
            return cb(new Error('필드 부족: classUid, postUid, postState, role 필요'), '');
          }

          let uploadPath = `uploads/${classUid}/${postUid}/${role}`;

          // 멘티면 userUid 폴더 포함
          if (role === 'Menti') {
            if (!userUid) {
              return cb(new Error('Menti 업로드에는 userUid 필요'), '');
            }
            uploadPath = `uploads/${classUid}/${postUid}/Menti/${userUid}`;
          }

          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const { fileUid } = req.body;

          if (!fileUid) return cb(new Error('fileUid 필요'), '');

          const ext = extname(file.originalname);
          const originalName = file.originalname.replace(ext, '');
          const filename = `${fileUid}_${originalName}${ext}`;

          cb(null, filename);
        },
      }),
    }),
  )
  async uploadMaterial(
    @UploadedFile() file: Express.Multer.File,
    @Body('classUid') classUid: string,
    @Body('postUid') postUid: string,
    @Body('postState') postState: string,
    @Body('role') role: string,
    @Body('userUid') userUid: string,
  ) {
    if (!file) throw new BadRequestException('파일 필요');

    return {
      message: '업로드 성공',
      role,
      filePath: file.path,
    };
  }

  // ⭐️ [수정] 파일 다운로드 API: 멘토 파일과 멘티 파일을 모두 지원하도록 경로 확장
  @Get('download/:classUid/:postUid/:role/:fileName')
  downloadFile(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
    @Param('role') role: string, // Mento or Menti
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const filePath = join(
      process.cwd(),
      // 멘토 파일 또는 멘티 제출 폴더 없이 저장된 파일 경로
      `uploads/${classUid}/${postUid}/${role}/${fileName}`,
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('파일이 존재하지 않습니다.');
    }

    return res.download(filePath);
  }

  // ⭐️ [신규] 멘티 제출 파일 다운로드 API (멘토가 멘티의 파일을 다운로드할 때 사용)
  @Get('download/:classUid/:postUid/Menti/:userUid/:fileName')
  downloadMenteeFile(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
    @Param('userUid') userUid: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    // 멘티 제출 파일의 정확한 경로 설정 (Menti/userUid 폴더 포함)
    const filePath = join(
      process.cwd(),
      `uploads/${classUid}/${postUid}/Menti/${userUid}/${fileName}`,
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('멘티 제출 파일을 찾을 수 없습니다.');
    }

    return res.download(filePath);
  }

  @Get('list/:classUid/:postUid/:userUid')
  async listMentiFiles(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
    @Param('userUid') userUid: string,
  ) {
    // uploads/classUid/postUid/Menti/userUid
    const folderPath = join(
      process.cwd(),
      `uploads/${classUid}/${postUid}/Menti/${userUid}`,
    );

    if (!fs.existsSync(folderPath)) {
      // 해당 유저의 제출 폴더가 없으면 빈 목록 반환 (404 대신 200으로 처리)
      return {
        message: '제출된 파일이 없습니다.',
        files: [],
      };
    }

    const files = fs.readdirSync(folderPath);

    if (!files.length) {
      return {
        message: '제출된 파일이 없습니다.',
        files: [],
      };
    }

    // 파일명 + 다운로드 URL 형태로 리턴
    const fileList = files.map((file) => ({
      fileName: file,
      // 멘티 전용 다운로드 URL을 사용하도록 변경
      downloadUrl: `/upload/download/${classUid}/${postUid}/Menti/${userUid}/${file}`,
    }));

    return {
      message: '멘티 제출 파일 목록 조회 성공',
      files: fileList,
    };
  }

  // 멘티 제출 파일 삭제 API (변경 없음)
  @Delete('delete/:classUid/:postUid/:userUid/:fileName')
  @HttpCode(204) // 성공 시 204 No Content 반환
  async deleteMentiFile(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
    @Param('userUid') userUid: string,
    @Param('fileName') fileName: string,
  ) {
    // 멘티 제출 파일의 정확한 경로 설정
    const filePath = join(
      process.cwd(),
      `uploads/${classUid}/${postUid}/Menti/${userUid}/${fileName}`,
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('삭제하려는 파일을 찾을 수 없습니다.');
    }

    try {
      // 파일 삭제
      fs.unlinkSync(filePath);
      return; // 204 No Content 반환
    } catch (error) {
      console.error('파일 삭제 중 오류 발생:', error);
      // 삭제 실패는 500 Internal Server Error로 처리
      throw new BadRequestException('파일 삭제에 실패했습니다.');
    }
  }

  // ⭐️ 게시글 단위 멘토 파일 전체 삭제 API
  @Delete('delete-post-mento/:classUid/:postUid')
  async deletePostMentoFiles(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
  ) {
    const folderPath = join(process.cwd(), `uploads/${classUid}/${postUid}/Mento`);

    if (!fs.existsSync(folderPath)) {
      throw new NotFoundException('삭제할 멘토 폴더가 존재하지 않습니다.');
    }

    try {
      // 멘토 폴더만 재귀 삭제
      fs.rmSync(folderPath, { recursive: true, force: true });

      return {
        message: '멘토 파일 폴더 삭제 완료',
        folder: `/uploads/${classUid}/${postUid}/Mento`,
      };
    } catch (error) {
      console.error('멘토 폴더 삭제 중 오류:', error);
      throw new BadRequestException('멘토 폴더 삭제에 실패했습니다.');
    }
  }


  // 멘토가 모든 멘티 제출 파일 조회 (변경 없음)
  @Get('list-all/:classUid/:postUid')
  async listAllMenteeFiles(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
  ) {
    const baseDir = path.join(process.cwd(), `uploads/${classUid}/${postUid}/Menti`);

    if (!fs.existsSync(baseDir)) {
      // 폴더가 없으면 제출된 파일이 없는 것으로 간주하고 빈 객체 반환
      return { classUid, postUid, submissions: {} };
    }

    const users = fs.readdirSync(baseDir).filter((file) =>
      fs.statSync(path.join(baseDir, file)).isDirectory(),
    );

    const result = {};

    for (const userUid of users) {
      const userPath = path.join(baseDir, userUid);
      const files = fs.readdirSync(userPath).filter((file) =>
        fs.statSync(path.join(userPath, file)).isFile(),
      );

      result[userUid] = files.map((fileName) => ({
        fileName,
        // 멘티 전용 다운로드 URL을 사용하도록 변경
        downloadUrl: `/upload/download/${classUid}/${postUid}/Menti/${userUid}/${fileName}`,
      }));
    }

    return { classUid, postUid, submissions: result };
  }

  // ⭐️ 게시글(post) 단위 파일 전체 삭제 API
  @Delete('delete-post/:classUid/:postUid')
  async deletePostFiles(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
  ) {
    const folderPath = join(process.cwd(), `uploads/${classUid}/${postUid}`);

    if (!fs.existsSync(folderPath)) {
      throw new NotFoundException('삭제할 폴더가 존재하지 않습니다.');
    }

    try {
      // Node v14+ 지원: 재귀 폴더 삭제
      fs.rmSync(folderPath, { recursive: true, force: true });

      return {
        message: '게시글 관련 파일 모두 삭제 완료',
        folder: `/uploads/${classUid}/${postUid}`,
      };
    } catch (error) {
      console.error('폴더 삭제 중 오류:', error);
      throw new BadRequestException('폴더 삭제에 실패했습니다.');
    }
  }


  // 글 교체 (멘토 파일)
  @Post('replaceFile') // POST로 변경
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const { classUid, postUid } = req.body;

          if (!classUid || !postUid) {
            return cb(new Error('필드 부족: classUid, postUid 필요'), '');
          }

          const uploadPath = `uploads/${classUid}/${postUid}/Mento`;
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname);
          const fileUid = uuid();
          const originalName = file.originalname.replace(ext, '');
          const filename = `${fileUid}_${originalName}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async replaceMentorFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('classUid') classUid: string,
    @Body('postUid') postUid: string,
  ) {
    if (!file) throw new BadRequestException('새 파일이 필요합니다.');

    const absoluteFolderPath = join(process.cwd(), `uploads/${classUid}/${postUid}/Mento`);

    // 기존 파일 삭제 (새 파일 제외)
    if (fs.existsSync(absoluteFolderPath)) {
      const oldFiles = fs.readdirSync(absoluteFolderPath);
      for (const f of oldFiles) {
        const filePath = join(absoluteFolderPath, f);
        if (f !== file.filename && fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }

    return {
      message: '멘토 파일 교체 완료',
      fileName: file.filename,
      filePath: file.path,
    };
  }
}