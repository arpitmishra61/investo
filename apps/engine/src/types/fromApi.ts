import { markets } from '@/lib/market';
export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";

export const GET_DEPTH = "GET_DEPTH";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";
export const GET_BALANCE = "GET_BALANCE";
export const GET_CURRENT_PRICE = "GET_CURRENT_PRICE";
export const RESET_ENGINE = "RESET_ENGINE";


//TODO: Can we share the types between the api and the engine?
export type MessageFromApi = {
    type: typeof CREATE_ORDER,
    data: {
        market: string,
        price: string,
        quantity: string,
        side: "buy" | "sell",
        userId: string,
        timeStamp: number
    }
} | {
    type: typeof CANCEL_ORDER,
    data: {
        orderId: string,
        market: string,
    }
} | {
    type: typeof ON_RAMP,
    data: {
        amount: string,
        userId: string,
        txnId: string
    }
} | {
    type: typeof GET_DEPTH,
    data: {
        market: string,
    }
} | {
    type: typeof GET_OPEN_ORDERS,
    data: {
        userId: string,
        market: string,
    }
} | {
    type: typeof GET_BALANCE,
    data: {
        userId: string,
    }
} | {
    type: typeof GET_CURRENT_PRICE,
    data: {
        market: string,
    }
} | {
    type: typeof RESET_ENGINE,
    data: {}
}