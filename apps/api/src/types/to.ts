import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_BALANCE,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
  GET_CURRENT_PRICE,
  CREATE_TICKER_WS,
  RESET_ENGINE,
} from ".";

export type MessageToEngine =
  | {
      type: typeof CREATE_ORDER;
      data: {
        market: string;
        price: string;
        quantity: string;
        side: "buy" | "sell";
        userId: string;
        timeStamp: number;
      };
    }
  | {
      type: typeof CANCEL_ORDER;
      data: {
        orderId: string;
        market: string;
      };
    }
  | {
      type: typeof ON_RAMP;
      data: {
        amount: string;
        userId: string;
        txnId: string;
      };
    }
  | {
      type: typeof GET_DEPTH;
      data: {
        market: string;
      };
    }
  | {
      type: typeof GET_OPEN_ORDERS;
      data: {
        userId: string;
        market: string;
      };
    }
  | {
      type: typeof GET_BALANCE;
      data: {
        userId: string;
      };
    }
  | {
      type: typeof GET_CURRENT_PRICE;
      data: {
        market: string;
      };
    }
  | {
      type: typeof RESET_ENGINE;
      data: {};
    };

export type MessageToWs = {
  type: typeof CREATE_TICKER_WS;
  data: {
    market: string;
  };
};
