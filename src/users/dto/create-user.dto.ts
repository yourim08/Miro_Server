import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, ValidateNested, Matches} from 'class-validator';
import { Type } from 'class-transformer';


class ReviewDto {
  @IsNotEmpty()
  @IsString()
  reviewerUid: String; // 나중에 프로필 눌렀을 때 필요

  @IsNotEmpty()
  @IsString()
  nickname: string; // 닉네임 표시

  @IsNotEmpty()
  @IsString()
  review: String; // 리뷰 내용

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  rating: Number; // 리뷰 점수 (1~5)
}

class MyClassDto {
  @IsNotEmpty()
  @IsString()
  myClassUid: String; // 클래스 uid

  // @IsNotEmpty()
  // @IsString()
  // classType: string; // Mento or Menti -> 수강중, 운영중 표시 위함

  // @IsNotEmpty()
  // @IsString()
  // classStatus: String; // Running or End -> 완료 표시 위함
}


export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  uid: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  grade: string;

  @IsNotEmpty()
  @IsString()
  class_room: string; 

  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: '번호는 공백으로 입력할 수 없습니다!' })
  number: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: '닉네임은 공백으로 입력할 수 없습니다!' }) // 공백제거
  nickname: string;

  @IsOptional() // 필수값 X
  @Type(()=>Number)
  @IsNumber({maxDecimalPlaces: 1})
  score?: Number;

  @IsOptional() // 필수값 X
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => ReviewDto)
  reviews?: ReviewDto[];

  @IsOptional() // 필수값 X
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => MyClassDto)
  myClass?: MyClassDto[];
}
