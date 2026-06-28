"use client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs"
import { useEffect, useState } from "react"
import axios from "axios"
import { Loader } from "../components/Loader"
import Link from "next/link"
import { TrendingUpIcon } from "lucide-react"
import { ThemeToggle } from "../components/ThemeToggle"
import { UserMenu } from "../components/UserMenu"

type OpenOrder = {
    "price": number,
    "quantity": number,
    "orderId": string,
    "filled": number,
    "side": "sell" | "buy",
    "userId": string,
    "timeStamp": number,
    "rQuantity": number
}

type ExecutedOrder = {
    id: number,
    time: number,
    market: string,
    price: string,
    qty: string,
    side: "buy" | "sell"
}

const type = "TATA"

export default function OpenOrdersTable() {
    const [openOrders, setOpenOrders] = useState<OpenOrder[] | null>(null);
    const [executedOrders, setExecutedOrders] = useState<ExecutedOrder[] | null>(null);
    const [orderType, setOrderType] = useState<"open" | "executed">("open");
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem("user");
        if (raw) {
            const user = JSON.parse(raw);
            setUserId(user.id);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;
        axios.get<OpenOrder[]>(`http://localhost:8000/api/v1/order/open?userId=${userId}&market=TATA_INR`).then(res => {
            setOpenOrders(res.data)
        })
    }, [userId])

    useEffect(() => {
        if (!userId) return;
        axios.get<{ orders: ExecutedOrder[] }>(`http://localhost:8000/api/v1/order/executed_orders?userId=${userId}`).then(res => {
            setExecutedOrders(res.data.orders)
        })
    }, [userId])

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-border">
                <Link href="/markets" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-black">
                        <TrendingUpIcon size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold tracking-tight">
                        Trade<span className="text-emerald-500">Pi</span>
                    </span>
                </Link>
                <div className="flex items-center gap-3">
                    <UserMenu />
                    <ThemeToggle />
                </div>
            </nav>

            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Orders</h1>

                <Card className="p-6">
                    <Tabs value={orderType} onValueChange={setOrderType} className="mb-6">
                        <TabsList className="bg-muted rounded-lg p-1 text-sm font-semibold inline-flex gap-1">
                            <TabsTrigger
                                value="open"
                                className={`px-4 py-2 rounded-md transition-all ${orderType === "open" ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Open Orders
                            </TabsTrigger>
                            <TabsTrigger
                                value="executed"
                                className={`px-4 py-2 rounded-md transition-all ${orderType === "executed" ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Executed Orders
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="open" className="overflow-x-auto mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Side</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Market</TableHead>
                                        <TableHead>Filled</TableHead>
                                        <TableHead>Remaining</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {openOrders ? openOrders.map((order) => (
                                        <TableRow key={order.orderId}>
                                            <TableCell className="font-medium">{order.quantity}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={order.side === "buy" ? "border-emerald-500 text-emerald-500" : "border-red-500 text-red-500"}
                                                >
                                                    {order.side}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono">₹ {order.price}</TableCell>
                                            <TableCell className="text-muted-foreground">{type}</TableCell>
                                            <TableCell>{order.filled}</TableCell>
                                            <TableCell>{order.rQuantity}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="destructive" size="sm">Cancel</Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : <Loader message="Loading open orders" />}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="executed" className="overflow-x-auto mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Market</TableHead>
                                        <TableHead>Side</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {executedOrders ? (
                                        executedOrders.length > 0 ? executedOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(order.time).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{order.market}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={order.side === "buy" ? "border-emerald-500 text-emerald-500" : "border-red-500 text-red-500"}
                                                    >
                                                        {order.side}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono">₹ {order.price}</TableCell>
                                                <TableCell className="font-medium">{order.qty}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                                    No executed orders yet
                                                </TableCell>
                                            </TableRow>
                                        )
                                    ) : <Loader message="Loading executed orders" />}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    )
}
