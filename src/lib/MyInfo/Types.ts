import { MyInfoPersonAttributes } from './Constant';

export interface MyInfoPersonReq {
  /**
   * Authorization Code sent to our callback URL from SG Verify
   */
  authCode: string;

  /**
   * Same state as above
   */
  state: string;

  /**
   * Transaction ID (Optional)
   * Used for tracking
   */
  txnNo?: string;

  /**
   * Any error returned from callback
   */
  error?: string;

  /**
   * Error description if there is any error from callback
   */
  errorDescription?: string;
}

export interface DecodedAccessToken {
  sub: string;
}

export interface MyInfoTokenApiRes {
  accessToken: string;
  decodedAccessToken: DecodedAccessToken;
}

export type MyInfoPersonKey = keyof typeof MyInfoPersonAttributes;
export type MyInfoPersonData = {
  [key in MyInfoPersonKey]?:
    | {
        code?: string;
        value?: string;
      }
    | {
        country: {
          code: string;
          value: string;
        };
        block: string;
        building: string;
        floorNumber: string;
        unitNumber: string;
        street: string;
        postalCode: string;
      }
    | {
        prefix: string;
        areaCode: string;
        value: string;
      }
    | {
        validity: {
          code: string;
          value: string;
        };
        expiryDate: string;
        classes: {
          class: string;
          issueDate: string;
        }[];
      };
};

export interface MyInfoPersonRes {
  data: MyInfoPersonData;
  state: string;
}
/**
 * Person Data Response from SG Verify
 */
export type MyInfoPersonApiResData = { [key in MyInfoPersonAttributes]?: string };
