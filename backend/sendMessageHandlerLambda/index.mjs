import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand
} from "@aws-sdk/lib-dynamodb";
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from "@aws-sdk/client-apigatewaymanagementapi";
import { v4 as uuidv4 } from "uuid";

const region = "ap-south-1";

const ddbClient = new DynamoDBClient({ region });
const dynamo = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
    try {
        console.log("SEND MESSAGE EVENT:", JSON.stringify(event));

        const connectionId = event.requestContext.connectionId;
        const body = JSON.parse(event.body);

        const { receiverId, message } = body;

        if (!receiverId || !message) {
            return { statusCode: 400 };
        }

        // 1️⃣ Find sender userId from Connections table
        const senderResult = await dynamo.send(
            new ScanCommand({
                TableName: "Connections",
                FilterExpression: "connectionId = :cid",
                ExpressionAttributeValues: {
                    ":cid": connectionId
                }
            })
        );

        if (!senderResult.Items || senderResult.Items.length === 0) {
            return { statusCode: 400 };
        }

        const senderId = senderResult.Items[0].userId;

        // 2️⃣ Create conversationId (sorted pair)
        const conversationId =
            senderId < receiverId
                ? `${senderId}#${receiverId}`
                : `${receiverId}#${senderId}`;

        const timestamp = Date.now();

        // 3️⃣ Save message to Messages table
        await dynamo.send(
            new PutCommand({
                TableName: "Messages",
                Item: {
                    conversationId,
                    timestamp,
                    messageId: uuidv4(),
                    senderId,
                    receiverId,
                    message
                }
            })
        );

        // 4️⃣ Find receiver connection
        const receiverResult = await dynamo.send(
            new ScanCommand({
                TableName: "Connections",
                FilterExpression: "userId = :uid",
                ExpressionAttributeValues: {
                    ":uid": receiverId
                }
            })
        );

        if (!receiverResult.Items || receiverResult.Items.length === 0) {
            return { statusCode: 200 };
        }

        const receiverConnectionId = receiverResult.Items[0].connectionId;

        // 5️⃣ Push message via WebSocket
        const apiEndpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

        const apiClient = new ApiGatewayManagementApiClient({
            region,
            endpoint: apiEndpoint
        });

        await apiClient.send(
            new PostToConnectionCommand({
                ConnectionId: receiverConnectionId,
                Data: JSON.stringify({
                    senderId,
                    message,
                    timestamp
                })
            })
        );

        return { statusCode: 200 };

    } catch (error) {
        console.error("Send message error:", error);
        return { statusCode: 500 };
    }
};