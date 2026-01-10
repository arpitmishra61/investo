import { Router } from "express"
import { RedisManager } from "../RedisManager"
import { GET_BALANCE } from "../types"

export const balanceRouter = Router()

balanceRouter.get("/", async (req, res) => {
    const { userId } = req.query
    if (userId && typeof userId === 'string') {
        const response = await RedisManager.getInstance().sendAndAwait({
            type: GET_BALANCE,
            data: {
                userId
            }
        })
        console.log("Rer", response)
        res.json(response.payload)
    }
    else {
        res.status(404).json({error:true, messgage:"Invalid User Id"})
    }
})