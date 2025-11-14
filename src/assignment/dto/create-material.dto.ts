import { IsNotEmpty, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class MaterialListDto {
  @IsNotEmpty()
  @IsString()
  materialUid: String; // 자료 uid

  @IsNotEmpty()
  @IsString()
  materialName: String; // 자료 이름

  @IsNotEmpty()
  @IsString()
  materialDescription: String; // 자료 설명

}

export class CreateMaterialDto {
  @IsNotEmpty()
  @IsString()
  rootClassUid: string; // 루트 클래스 uid


  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialListDto)
  materialList: MaterialListDto[]; // 자료 배열
}
