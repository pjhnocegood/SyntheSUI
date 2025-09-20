

// 컨트랙트 관련 상수 (SUI → SUSD 담보 대출 with Oracle)
export const ORACLE_PACKAGE_ID = process.env.NEXT_PUBLIC_ORACLE_PACKAGE_ID || '0xfb7d4c251395ab306a80223009a3ca44184374cf2cacc8d32b29b1fb6f373937'
export const ORACLE_OBJECT_ID = process.env.NEXT_PUBLIC_ORACLE_OBJECT_ID || '0xfdddc8e044759d9d158eede90290ec5ea488833000e7b632ef0317d97ad3ce2d'
export const TREASURY_OBJECT_ID = process.env.NEXT_PUBLIC_TREASURY_OBJECT_ID || '0xc56b08afa5586a437d5b86a25d233632ae88f1a8d8eecc8461f3f49fe803b313'
export const PRICE_ORACLE_ID = process.env.NEXT_PUBLIC_PRICE_ORACLE_ID || '0x749a7e28bdb8319b4dd8713f15f64282305df8e5e58385f68aeaa53c047eb6ae'

// 스테이블코인 타입
export const SUSD_COIN_TYPE = `${ORACLE_PACKAGE_ID}::stablecoin_simple::SUSD`