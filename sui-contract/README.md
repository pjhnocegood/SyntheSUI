# SUI Lending Protocol

SUI 기반의 담보 대출 프로토콜입니다.

## 주요 기능

1. **SUI 입금**: 사용자가 SUI를 담보로 입금
2. **스테이블코인 대출**: 입금한 SUI 가치의 최대 50%까지 스테이블코인 대출
3. **자동 스테이킹**: 입금된 SUI의 50%는 자동으로 스테이킹되어 수익 창출
4. **숏 포지션**: 나머지 50%는 숏 포지션으로 헤징 (Mock 구현)
5. **대출 상환**: 스테이블코인 상환 후 담보 SUI 회수
6. **청산**: 담보 가치가 75% 이하로 떨어지면 청산 가능
7. **가격 오라클**: SUI 가격 피드 제공 (Mock 구현)

## 프로젝트 구조

```
sui/
├── Move.toml                    # 프로젝트 설정
├── sources/
│   ├── lending_pool.move       # 메인 대출 프로토콜
│   ├── stablecoin.move         # 스테이블코인 토큰
│   ├── price_oracle.move       # 가격 오라클 (Mock)
│   ├── staking_manager.move    # 스테이킹 관리
│   └── short_position.move     # 숏 포지션 관리 (Mock)
└── tests/
    └── lending_tests.move      # 테스트 스위트
```

## 설치 및 빌드

### 1. Sui CLI 설치

```bash
# macOS
brew install sui

# 또는 cargo로 설치
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

### 2. 프로젝트 빌드

```bash
# 프로젝트 디렉토리로 이동
cd sui

# 빌드
sui move build

# 테스트 실행
sui move test
```

## 배포

### 1. 테스트넷 설정

```bash
# 테스트넷 사용
sui client switch --env testnet

# .env 파일의 private key 확인
# SUI_PRIVATE_KEY=suiprivkey1qzckhzhuxwa42uuuknjxy6kha5ete07jfwtnt5uqrj3lat865c2fq86pjva
# Public Address: 0xacce198c8ca3f3416e9aa5c468473902d58861eede25aa92091de41c015f9640
```

### 2. 컨트랙트 배포

```bash
# 프로젝트 빌드 및 배포
sui client publish --gas-budget 100000000
```

### 3. 배포된 주소들

**Package ID**: `0x520b8c7892e4e8bfe470f2cbe186869d362cdb39c4c7266c9fc437f35d918ddf`

| Contract | Object ID |
|----------|-----------|
| Lending Pool | `0xd37849a98df108c784a91553bb4f4378d2ea1816081807018ddc7eccfd7b20ea` |
| Stablecoin Treasury | `0xfbc4c7a79cc47d11b7212def848e4c4f23d61125a9982ad59bbc5cb81fbb8f7c` |
| Staking Manager | `0x159bcce6db5daee0c0bd80ccce038e4783b313b19214608f2c8a02ea64fd2dbc` |
| Short Position Manager | `0x2f5a940df9bc5e9a433e03519b5c41ddf42e416d94f0a4c940b022d3058a25ba` |

## 사용 방법

### 1. SUI 입금

```move
lending_pool::deposit_sui(
    pool,           // 대출 풀
    staking_manager,    // 스테이킹 매니저
    short_manager,      // 숏 포지션 매니저
    deposit_coin,       // SUI 코인
    ctx
);
```

### 2. 스테이블코인 대출

```move
lending_pool::borrow_stablecoin(
    pool,       // 대출 풀
    oracle,     // 가격 오라클
    treasury,   // 스테이블코인 Treasury
    amount,     // 대출 금액
    ctx
);
```

### 3. 대출 상환

```move
lending_pool::repay_loan(
    pool,       // 대출 풀
    treasury,   // 스테이블코인 Treasury
    payment,    // 상환할 스테이블코인
    ctx
);
```

### 4. 담보 회수

```move
lending_pool::withdraw_collateral(
    pool,           // 대출 풀
    staking_manager,    // 스테이킹 매니저
    short_manager,      // 숏 포지션 매니저
    amount,             // 회수할 금액
    ctx
);
```

## 주요 파라미터

- **최대 LTV (Loan-to-Value)**: 50%
- **청산 임계값**: 75%
- **담보 분배**: 50% 스테이킹 / 50% 숏 포지션
- **스테이킹 연 수익률**: 5% (Mock)
- **가격 정밀도**: 4 소수점 (10000 = $1.00)

## 보안 고려사항

- 관리자 권한 제어
- 재진입 공격 방지
- 오버플로우/언더플로우 체크
- 입력 검증
- 청산 메커니즘

## 테스트

```bash
# 전체 테스트 실행
sui move test

# 특정 테스트 실행
sui move test test_deposit_and_borrow
```

## 주의사항

- 이 프로토콜은 교육/테스트 목적으로 구현되었습니다
- 숏 포지션과 가격 오라클은 Mock 구현입니다
- 프로덕션 사용 전 충분한 감사와 테스트가 필요합니다

## 라이센스

MIT