export declare class CryptoUtil {
    static signWithRs256(data: string, privateKey: string): string;
    private static sign;
    static nonce(bytes?: number): string;
}
