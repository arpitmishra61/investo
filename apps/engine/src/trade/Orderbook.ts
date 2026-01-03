import { BASE_CURRENCY } from "./Engine";

export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
    timeStamp: number
}

export interface Fill {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
    timeStamp: number;
}

export class Orderbook {
    bids: Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset: string = BASE_CURRENCY;
    lastTradeId: number;
    currentPrice: number;

    constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId: number, currentPrice: number) {
        this.bids = bids;
        this.asks = asks;
        this.baseAsset = baseAsset;
        this.lastTradeId = lastTradeId || 0;
        this.currentPrice = currentPrice ||0;
    }

    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`;
    }
    insertBid(order:Order) {
    let i = 0;
    while (
        i < this.bids.length &&
        (
            this.bids[i].price > order.price ||
            (this.bids[i].price === order.price &&
             this.bids[i].timeStamp <= order.timeStamp)
        )
    ) {
        console.log(this.bids[i].price , order.price)
        i++;
    }
    this.bids.splice(i, 0, order);
    }
    insertAsk(order:Order) {
    let i = 0;
    while (
        i < this.asks.length &&
        (
            this.asks[i].price > order.price ||
            (this.asks[i].price === order.price &&
             this.asks[i].timeStamp <= order.timeStamp)
        )
    ) {
        i++;
    }
        this.asks.splice(i, 0, order);
        console.log("this.asks", this.asks,order)
}

    getSnapshot() {
        return {
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }

    //TODO: Add self trade prevention
    addOrder(order: Order): {
        executedQty: number,
        fills: Fill[]
    } {
        console.log("orderbook is the", order)
        if (order.side === "buy") {
            const {executedQty, fills} = this.matchBid(order); 
            order.filled = executedQty;
            if (executedQty === order.quantity) {
                return {
                    executedQty,
                    fills
                }
            }
           this.insertBid(order)
            return {
                executedQty,
                fills
            }
        } else {
            console.log(order)
            const { executedQty, fills } = this.matchAsk(order);
            console.log(executedQty, fills)
            order.filled = executedQty;
            if (executedQty === order.quantity) {
                return {
                    executedQty,
                    fills
                }
            }
            this.insertAsk(order)
            return {
                executedQty,
                fills
            }
        }
    }

    matchBid(order: Order): {fills: Fill[], executedQty: number} {
        const fills: Fill[] = [];
        let executedQty = 0;

        for (let i = 0; i < this.asks.length; i++) {
            if (this.asks[i].price <= order.price && executedQty < order.quantity) {
                const filledQty = Math.min((order.quantity - executedQty), this.asks[i].quantity);
                executedQty += filledQty;
                this.asks[i].filled += filledQty;
                order.quantity-=filledQty
                fills.push({
                    price: this.asks[i].price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.asks[i].userId,
                    markerOrderId: this.asks[i].orderId,
                    timeStamp: order.timeStamp
                });
            }
        }
        for (let i = 0; i < this.asks.length; i++) {
            if (this.asks[i].filled === this.asks[i].quantity) {
                this.asks.splice(i, 1);
                i--;
            }
        }
        return {
            fills,
            executedQty
        };
    }

    matchAsk(order: Order): {fills: Fill[], executedQty: number} {
        const fills: Fill[] = [];
        let executedQty = 0;
        
        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i].price >= order.price && executedQty < order.quantity) {
                const amountRemaining = Math.min(order.quantity - executedQty, this.bids[i].quantity);
                executedQty += amountRemaining;
                this.bids[i].filled += amountRemaining;
                order.quantity-=executedQty
                fills.push({
                    price: this.bids[i].price.toString(),
                    qty: amountRemaining,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.bids[i].userId,
                    markerOrderId: this.bids[i].orderId,
                    timeStamp: order.timeStamp
                });
            }
        }
        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i].filled === this.bids[i].quantity) {
                this.bids.splice(i, 1);
                i--;
            }
        }
        return {
            fills,
            executedQty
        };
    }

    //TODO: Can you make this faster? Can you compute this during order matches?
    getDepth() {
        console.log("asks", this.asks)
        const bids: [string, string][] = [];
        const asks: [string, string][] = [];

        const bidsObj:Map<number ,number> = new Map();
        const asksObj:Map<number ,number> = new Map();

        for (let i = 0; i < this.bids.length; i++) {
            const order = this.bids[i];
            const previousQty =  bidsObj.get(order.price) ?? 0 
            bidsObj.set(order.price,previousQty ===0?  order.quantity : order.quantity+ previousQty)
        }

        for (let i = 0; i < this.asks.length; i++) {
            const order = this.asks[i];
            const previousQty =  asksObj.get(order.price) ?? 0 
            asksObj.set(order.price,previousQty ===0?  order.quantity : order.quantity+ previousQty)
        }
        
        for (const [price,qty] of bidsObj) {
            bids.unshift([price.toString(),qty.toString()])
        }

        for (const [price,qty] of asksObj) {
            asks.unshift([price.toString(),qty.toString()])
        }

        console.log(bids, bidsObj)
        return {
            bids,
            asks
        };
    }

    getOpenOrders(userId: string): Order[] {
        const asks = this.asks.filter(x => x.userId === userId);
        const bids = this.bids.filter(x => x.userId === userId);
        return [...asks, ...bids];
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.bids[index].price;
            this.bids.splice(index, 1);
            return price
        }
    }

    cancelAsk(order: Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.asks[index].price;
            this.asks.splice(index, 1);
            return price
        }
    }

}
