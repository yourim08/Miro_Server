import { IsNotEmpty, IsString, IsNumber, IsDate, IsArray, IsOptional, ValidateNested, Matches} from 'class-validator';
import { Type } from 'class-transformer';


class MentiUidDto {
  @IsNotEmpty()
  @IsString()
  mentiUid: String; // 클래스 uid
}

export class FileDto {
  fileName: string;
  url: string;
  path: string;
}



export class CreateClassListDto {
  @IsNotEmpty()
  @IsString()
  classUid: string; // 클래스 자체 uid

  @IsNotEmpty()
  @IsString()
  creatorUid: string; // 제작자 uid

  @IsNotEmpty()
  @IsString()
  entranceStatus: string = "Open";  // 클래스 입장 여부 Open or Closed (기본값 Open)

  @IsNotEmpty()
  @IsString()
  status: string = "Waiting"; // 클래스 운영 여부 Running or Waiting or End (기본값 Waiting)

  @IsNotEmpty()
  @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => FileDto)
  coverImg: { fileName: string; url: string; path: string }[];
  
  
  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: '이름은 공백으로 입력할 수 없습니다!' }) 
  className: string; // 클래스 이름

  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: '설명은 공백으로 입력할 수 없습니다!' }) 
  description: string; // 클래스 설명

  @IsNotEmpty()
  @IsString()
  field: string; // 클래스 분야 (dev, design, other) end_date

  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: '조건은 공백으로 입력할 수 없습니다!' }) 
  requirement: string; // 클래스 조건 

  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: '주의사항은 공백으로 입력할 수 없습니다!' }) 
  caution: string; // 클래스 주의사항

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  capacity: number; // 클래스 제한 인원

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date) 
  startDate: Date; // 클래스 시작 날짜

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;  // 클래스 종료 날짜

  @IsOptional() // 필수값 X
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => MentiUidDto)
  mentiUidArray: MentiUidDto[]; // 멘티들 uid 배열
}
