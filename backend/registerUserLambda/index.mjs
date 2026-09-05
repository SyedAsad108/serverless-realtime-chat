import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "ap-south-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        const { username, email, password } = body;

        if (!username || !email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "All fields are required" }),
            };
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userId = randomUUID();

        await dynamo.send(
            new PutCommand({
                TableName: "Users",
                Item: {
                    userId,
                    username,
                    email,
                    passwordHash,
                    createdAt: Date.now(),
                },
            })
        );

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "User registered successfully",
                userId,
            }),
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};