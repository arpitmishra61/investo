import { Router } from "express"
import { RedisManager } from "../RedisManager"
import { GET_BALANCE } from "../types"
import { AuthedRequest } from "../middleware/auth"

export const balanceRouter = Router()

balanceRouter.get("/", async (req: AuthedRequest, res) => {
    const userId = req.userId
    if (userId) {
        const response = await RedisManager.getInstance().sendAndAwait({
            type: GET_BALANCE,
            data: {
                userId
            }
        })
        res.json(response.payload)
    }
    else {
        res.status(401).json({error:true, message:"Invalid User Id"})
    }
})