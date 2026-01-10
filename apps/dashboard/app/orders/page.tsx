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
const type = "TATA"

export default function OpenOrdersTable() {
    useEffect(() => {
        axios.get<OpenOrder[]>("http://localhost:8000/api/v1/order/open?userId=5&market=TATA_INR").then(res => {
            setOpenOrders(res.data)

        })

    }, [])
    const [openOrders, setOpenOrders] = useState<OpenOrder[] | null>(null);
    const [orderType, setOrderType] = useState<"open" | "executed">("open");

    return (

        <Card className="max-w-200 m-auto p-4 mt-6">
            <Tabs value={orderType} onValueChange={setOrderType} className="mb-6">
                <TabsList className="bg-zinc-100 rounded-md p-1 text-sm font-semibold w-full">
                    <TabsTrigger value="open" className={`px-4 py-2 rounded-md ${orderType === "open" ? 'bg-zinc-800 text-white' : 'text-black'}`}>
                        Open Orders
                    </TabsTrigger>
                    `<TabsTrigger value="executed" className={`px-4 py-2 rounded-md ${orderType === "executed" ? 'bg-zinc-800 text-white' : 'text-black'}`}>
                        Executed Orders
                    </TabsTrigger>
                </TabsList>



                <TabsContent value="open">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead> Qty</TableHead>
                                <TableHead>Side</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Market</TableHead>
                                <TableHead>Filled</TableHead>
                                <TableHead>Remaining</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {openOrders ? openOrders.map((order) => {
                                return (
                                    <TableRow key={order.orderId}>
                                        <TableCell className="font-medium">
                                            {order.quantity}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    order.side === "buy"
                                                        ? "border-green-600 text-green-600"
                                                        : "border-red-600 text-red-600"
                                                }
                                            >
                                                {order.side}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>₹ {order.price}</TableCell>

                                        <TableCell className="text-muted-foreground">
                                            {type}
                                        </TableCell>

                                        <TableCell>{order.filled}</TableCell>

                                        <TableCell>{order.rQuantity}</TableCell>

                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : <Loader message="Loading open orders" />}
                        </TableBody>
                    </Table>

                </TabsContent>

                <TabsContent value="executed">
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
                            <h2>Executed QTY</h2>
                        </TableBody>
                    </Table>

                </TabsContent>
            </Tabs>

        </Card>

    )
}
