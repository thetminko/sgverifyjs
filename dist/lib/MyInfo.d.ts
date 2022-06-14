import { SgVerifyOptions } from '../types';
export declare enum MyInfoPersonAttributes {
    nricFin = "uinfin",
    partialNricFin = "partialuinfin",
    name = "name",
    aliasName = "aliasname",
    marriedName = "marriedname",
    gender = "sex",
    race = "race",
    dateOfBirth = "dob",
    residentialStatus = "residentialstatus",
    nationality = "nationality",
    birthCountry = "birthcountry",
    passType = "passtype",
    mobileNumber = "mobileno",
    email = "email",
    adddress = "regadd"
}
export declare type MyInfoPerson = Readonly<{
    [key in keyof typeof MyInfoPersonAttributes]?: string | undefined;
}>;
export interface MyInfoGetPersonRes {
    data: MyInfoPerson;
    state: string;
}
export interface MyInfoGetPersonReq {
    authCode: string;
    state: string;
    txNo: string;
}
export declare class MyInfo {
    private readonly options;
    private readonly default;
    private readonly requireSecurityFeatures;
    constructor(options: SgVerifyOptions);
    private sortJSON;
    private generateAuthorizationHeader;
    private verifyJws;
    private decryptJwe;
    private getToken;
    private transformPersonData;
    getPersonData(req: MyInfoGetPersonReq): Promise<MyInfoGetPersonRes>;
}
