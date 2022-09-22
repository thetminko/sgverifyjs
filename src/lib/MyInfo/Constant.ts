import { SgVerifyEnvironment } from '../../types';

export enum MyInfoPersonAttributes {
  partialNricFin = 'partialuinfin',
  nricFin = 'uinfin',
  uuid = 'uuid',
  name = 'name',
  aliasName = 'aliasname',
  hanyuPinyinName = 'hanyupinyinname',
  hanyuPinyinAliasName = 'hanyupinyinaliasname',
  marriedName = 'marriedname',
  gender = 'sex',
  race = 'race',
  secondaryRace = 'secondaryrace',
  dateOfBirth = 'dob',
  residentialStatus = 'residentialstatus',
  nationality = 'nationality',
  birthCountry = 'birthcountry',
  passportNumber = 'passportnumber',
  passType = 'passtype',
  passStatus = 'passstatus',
  passExpiryDate = 'passexpirydate',
  mobileNumber = 'mobileno',
  email = 'email',
  address = 'regadd',
  employment = 'employment',
  drivingLicence = 'drivinglicence'
}

export const URL_CONFIG: {
  [key in SgVerifyEnvironment]: {
    tokenUrl: string;
    personUrl: string;
  };
} = {
  PROD: {
    tokenUrl: 'https://api.myinfo.gov.sg/sgverify/v2/token',
    personUrl: 'https://api.myinfo.gov.sg/sgverify/v2/person'
  },
  TEST: {
    tokenUrl: 'https://test.api.myinfo.gov.sg/sgverify/v2/token',
    personUrl: 'https://test.api.myinfo.gov.sg/sgverify/v2/person'
  },
  SANDBOX: {
    tokenUrl: 'https://sandbox.api.myinfo.gov.sg/sgverify/v2/token',
    personUrl: 'https://sandbox.api.myinfo.gov.sg/sgverify/v2/person'
  }
};

export const DEFAULT_CONFIG = {
  signatureMethod: 'RS256'
};
