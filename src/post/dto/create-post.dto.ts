import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ValidateIf,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class MaterialPostDto {
  @IsNotEmpty()
  @IsString()
  postUid: string;

  @IsNotEmpty()
  @IsString()
  postName: string;

  @IsNotEmpty()
  @IsString()
  postDescription: string;

  @IsOptional()
  @IsString()
  fileUrl?: string; // 게시물 첨부 파일

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  submissionUrls?: string[]; // 나중에 멘티가 올리는 파일들
}

class AssignmentPostDto extends MaterialPostDto {
  @ValidateIf((o) => o.postState === 'assignment')
  @IsNotEmpty()
  @IsDateString()
  postStartDate: string;

  @ValidateIf((o) => o.postState === 'assignment')
  @IsNotEmpty()
  @IsDateString()
  postEndDate: string;
}

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  rootClassUid: string;

  @IsNotEmpty()
  @IsString()
  postState: string; // "material" | "assignment"

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type((obj) => {
    return obj?.object?.postState === 'assignment'
      ? AssignmentPostDto
      : MaterialPostDto;
  })
  postList: (MaterialPostDto | AssignmentPostDto)[];
}
