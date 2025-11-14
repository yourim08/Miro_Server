import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // 🔹 포스트 생성
  @Post('addPost')
  async addPost(@Body() createPostDto: CreatePostDto) {
    return this.postService.addPost(createPostDto);
  }

  // 🔹 포스트 조회
  @Get('list')
  async getPosts(@Query('rootClassUid') rootClassUid: string) {
    if (!rootClassUid) {
      throw new BadRequestException('rootClassUid 쿼리 파라미터가 필요합니다.');
    }
    return this.postService.getPostsByClassUid(rootClassUid);
  }

  // 🔹 포스트 삭제
  @Delete(':rootClassUid/:postUid')
  async deletePost(
    @Param('rootClassUid') rootClassUid: string,
    @Param('postUid') postUid: string,
  ) {
    return this.postService.deletePost(rootClassUid, postUid);
  }

  // 🔹 포스트 수정
  @Put(':classUid/:postUid')
  async updatePost(
    @Param('classUid') classUid: string,
    @Param('postUid') postUid: string,
    @Body()
    body: {
      postName?: string;
      postDescription?: string;
      postEndDate?: string | null; // null 허용
      fileUrl?: string | null;     // null 허용, undefined는 무시
    },
  ) {
    if (!body || Object.keys(body).length === 0) {
      throw new BadRequestException('수정할 데이터가 없습니다.');
    }

    return this.postService.updatePost(classUid, postUid, body);
  }
}
