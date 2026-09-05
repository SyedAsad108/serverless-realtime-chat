import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        console.log("DISCONNECT EVENT:", JSON.stringify(event));

        const connectionId = event?.requestContext?.connectionId;

        if (!connectionId) {
            console.log("No connectionId found");
            return { statusCode: 200 };
        }

        console.log("Connection ID:", connectionId);

        const result = await dynamo.send(
            new ScanCommand({
                TableName: "Connections",
                FilterExpression: "connectionId = :cid",
                ExpressionAttributeValues: {
                    ":cid": connectionId,
                },
            })
        );

        if (result.Items && result.Items.length > 0) {
            const user = result.Items[0];

            await dynamo.send(
                new DeleteCommand({
                    TableName: "Connections",
                    Key: {
                        userId: user.userId,
                    },
                })
            );

            console.log("Connection deleted");
        } else {
            console.log("No matching connection found");
        }

        return { statusCode: 200 };

    } catch (error) {
        console.error("Disconnect error:", error);
        return { statusCode: 200 }; // IMPORTANT: Always return 200 for disconnect
    }
};