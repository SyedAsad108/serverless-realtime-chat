import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ region: "ap-south-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { email, password } = body;

        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Email and password required" }),
            };
        }

        // Find user by email
        const result = await dynamo.send(
            new ScanCommand({
                TableName: "Users",
                FilterExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": email,
                },
            })
        );

        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Invalid credentials" }),
            };
        }

        const user = result.Items[0];

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Invalid credentials" }),
            };
        }

        const token = jwt.sign(
            {
                userId: user.userId,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Login successful",
                token,
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