module simple_oracle::lending_oracle {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use std::option;

    // 스테이블코인 토큰 구조체
    public struct STABLE_COIN has drop {}

    // 스테이블코인 발행 권한을 가진 구조체
    public struct StableCoinCap has key, store {
        id: UID,
        treasury_cap: TreasuryCap<STABLE_COIN>,
    }

    // 오라클 구조체
    public struct Oracle has key {
        id: UID,
        price: u64, // 담보 자산 가격 (cents 단위)
        total_deposits: u64,
        total_borrowed: u64,
        pool_balance: Balance<SUI>,
        user_deposits: Table<address, u64>,
        user_borrowed: Table<address, u64>, // 스테이블코인 단위
        stablecoin_cap: StableCoinCap, // 스테이블코인 발행 권한
    }

    // 이벤트 구조체들
    public struct DepositEvent has copy, drop {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    public struct WithdrawEvent has copy, drop {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    public struct BorrowEvent has copy, drop {
        user: address,
        amount: u64,
        collateral_value: u64,
        timestamp: u64,
    }

    public struct RepayEvent has copy, drop {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    // 초기화 함수
    fun init(witness: STABLE_COIN, ctx: &mut TxContext) {
        // 스테이블코인 토큰 생성
        let (treasury_cap, metadata) = coin::create_currency<STABLE_COIN>(
            witness,
            9, // decimals
            b"SUSD", // symbol
            b"Sui USD", // name
            b"Stablecoin backed by SUI collateral", // description
            option::none(), // icon url
            ctx
        );

        // 메타데이터 공유
        transfer::public_freeze_object(metadata);

        // StableCoinCap 생성
        let stablecoin_cap = StableCoinCap {
            id: object::new(ctx),
            treasury_cap,
        };

        let oracle = Oracle {
            id: object::new(ctx),
            price: 500, // $5.00 초기 가격
            total_deposits: 0,
            total_borrowed: 0,
            pool_balance: balance::zero(),
            user_deposits: table::new(ctx),
            user_borrowed: table::new(ctx),
            stablecoin_cap,
        };
        transfer::share_object(oracle);
    }

    // 가격 조회 (읽기 전용)
    public fun get_price(oracle: &Oracle): u64 {
        oracle.price
    }

    // 총 예치금 조회 (읽기 전용)
    public fun get_total_deposits(oracle: &Oracle): u64 {
        oracle.total_deposits
    }

    // 총 대출금 조회 (읽기 전용)
    public fun get_total_borrowed(oracle: &Oracle): u64 {
        oracle.total_borrowed
    }

    // 사용자 예치금 조회 (읽기 전용)
    public fun get_user_deposit(oracle: &Oracle, user: address): u64 {
        if (table::contains(&oracle.user_deposits, user)) {
            *table::borrow(&oracle.user_deposits, user)
        } else {
            0
        }
    }

    // 사용자 대출금 조회 (읽기 전용)
    public fun get_user_borrowed(oracle: &Oracle, user: address): u64 {
        if (table::contains(&oracle.user_borrowed, user)) {
            *table::borrow(&oracle.user_borrowed, user)
        } else {
            0
        }
    }

    // 풀 잔액 조회 (읽기 전용)
    public fun get_pool_balance(oracle: &Oracle): u64 {
        balance::value(&oracle.pool_balance)
    }

    // 가격 업데이트 (관리자 전용)
    public entry fun update_price(oracle: &mut Oracle, new_price: u64, _ctx: &mut TxContext) {
        oracle.price = new_price;
    }

    // 예치 기능
    public entry fun deposit(
        oracle: &mut Oracle,
        coin: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        let user = tx_context::sender(ctx);

        // 코인을 풀에 추가
        coin::put(&mut oracle.pool_balance, coin);

        // 사용자 예치금 업데이트
        if (table::contains(&oracle.user_deposits, user)) {
            let current_deposit = table::borrow_mut(&mut oracle.user_deposits, user);
            *current_deposit = *current_deposit + amount;
        } else {
            table::add(&mut oracle.user_deposits, user, amount);
        };

        // 총 예치금 업데이트
        oracle.total_deposits = oracle.total_deposits + amount;

        // 이벤트 발생
        event::emit(DepositEvent {
            user,
            amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // 인출 기능
    public entry fun withdraw(
        oracle: &mut Oracle,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);

        // 사용자 예치금 확인
        assert!(table::contains(&oracle.user_deposits, user), 1);
        let user_deposit = table::borrow_mut(&mut oracle.user_deposits, user);
        assert!(*user_deposit >= amount, 2);

        // 풀에 충분한 잔액이 있는지 확인
        assert!(balance::value(&oracle.pool_balance) >= amount, 3);

        // 사용자 예치금 업데이트
        *user_deposit = *user_deposit - amount;

        // 총 예치금 업데이트
        oracle.total_deposits = oracle.total_deposits - amount;

        // 인출 실행
        let withdrawn_coin = coin::take(&mut oracle.pool_balance, amount, ctx);
        transfer::public_transfer(withdrawn_coin, user);

        // 이벤트 발생
        event::emit(WithdrawEvent {
            user,
            amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // 대출 기능 (SUI 담보로 스테이블코인 대출)
    public entry fun borrow(
        oracle: &mut Oracle,
        collateral_coin: Coin<SUI>,
        borrow_amount: u64, // 스테이블코인 단위
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        let collateral_amount = coin::value(&collateral_coin);

        // 담보 가치 계산 (현재 가격 기준, 스테이블코인 단위)
        let collateral_value_cents = (collateral_amount * oracle.price) / 1_000_000_000; // SUI to cents
        let collateral_value_dollars = collateral_value_cents / 100; // cents to dollars
        let collateral_value_stable = collateral_value_dollars * 1_000_000_000; // dollars to stablecoin units

        // LTV 70% 적용 (대출 가능 금액은 담보 가치의 70%)
        let max_borrow = (collateral_value_stable * 70) / 100;
        assert!(borrow_amount <= max_borrow, 4);

        // 담보를 풀에 추가
        coin::put(&mut oracle.pool_balance, collateral_coin);

        // 사용자 대출금 업데이트 (스테이블코인 단위)
        if (table::contains(&oracle.user_borrowed, user)) {
            let current_borrowed = table::borrow_mut(&mut oracle.user_borrowed, user);
            *current_borrowed = *current_borrowed + borrow_amount;
        } else {
            table::add(&mut oracle.user_borrowed, user, borrow_amount);
        };

        // 총 대출금 업데이트 (스테이블코인 단위)
        oracle.total_borrowed = oracle.total_borrowed + borrow_amount;

        // 스테이블코인 발행 및 전송
        let stablecoin = coin::mint(&mut oracle.stablecoin_cap.treasury_cap, borrow_amount, ctx);
        transfer::public_transfer(stablecoin, user);

        // 이벤트 발생
        event::emit(BorrowEvent {
            user,
            amount: borrow_amount,
            collateral_value: collateral_value_stable,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // 상환 기능 (스테이블코인으로 상환)
    public entry fun repay(
        oracle: &mut Oracle,
        repay_coin: Coin<STABLE_COIN>,
        ctx: &mut TxContext
    ) {
        let user = tx_context::sender(ctx);
        let repay_amount = coin::value(&repay_coin);

        // 사용자 대출금 확인 (스테이블코인 단위)
        assert!(table::contains(&oracle.user_borrowed, user), 6);
        let user_borrowed = table::borrow_mut(&mut oracle.user_borrowed, user);
        assert!(*user_borrowed >= repay_amount, 7);

        // 스테이블코인 소각
        coin::burn(&mut oracle.stablecoin_cap.treasury_cap, repay_coin);

        // 사용자 대출금 업데이트 (스테이블코인 단위)
        *user_borrowed = *user_borrowed - repay_amount;

        // 총 대출금 업데이트 (스테이블코인 단위)
        oracle.total_borrowed = oracle.total_borrowed - repay_amount;

        // 이벤트 발생
        event::emit(RepayEvent {
            user,
            amount: repay_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }
}