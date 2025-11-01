import { NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = "CryptoPortfolio"

// Fetch all portfolio data for a user
export async function GET() {
    try {
        const data = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "userId = :uid",
                ExpressionAttributeValues: {
                    ":uid": "atharva123",
                },
            })
        )

        return NextResponse.json(data.Items || [])
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
    }
}

// Save (Buy/Sell) transaction
export async function POST(req: Request) {
    const { cryptoId, transaction } = await req.json()

    try {
        const existing = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { userId: "atharva123", cryptoId },
            })
        )

        const transactions = existing.Item?.transactions || []
        const updatedTransactions = [...transactions, transaction]

        await docClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    userId: "atharva123",
                    cryptoId,
                    transactions: updatedTransactions,
                },
            })
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Failed to save transaction" }, { status: 500 })
    }
}
