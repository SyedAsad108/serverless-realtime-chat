import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ region: "ap-south-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        const token = event.queryStringParameters?.token;

        if (!token) {
            return {
                statusCode: 401,
                body: "Unauthorized: No token provided",
            };
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decoded.userId;

        const connectionId = event.requestContext.connectionId;

        // Store connection in DynamoDB
        await dynamo.send(
            new PutCommand({
                TableName: "Connections",
                Item: {
                    userId,
                    connectionId,
                    connectedAt: Date.now(),
                },
            })
        );

        return {
            statusCode: 200,
            body: "Connected",
        };
    } catch (error) {
        console.error("Connection error:", error);

        return {
            statusCode: 401,
            body: "Unauthorized",
        };
    }
};