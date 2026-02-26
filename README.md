# Serverless Real-Time Chat Application

A cloud-native real-time chat application built using AWS Serverless architecture and a Next.js frontend.

This project demonstrates how to design and deploy a scalable WebSocket-based messaging system using AWS Lambda, API Gateway (HTTP + WebSocket), and DynamoDB.

---

## Architecture Overview

The system is built using two APIs:

• HTTP API – Used for authentication (login & registration)
• WebSocket API – Used for real-time message communication

### Backend Components

* AWS Lambda (multiple handlers)
* API Gateway (HTTP + WebSocket APIs)
* Amazon DynamoDB
* JWT-based authentication
* AWS Cloud infrastructure (serverless)

### Frontend

* Next.js (App Router)
* TypeScript
* React
* Context API (Auth + WebSocket state management)
* Component-based UI architecture

---

## Backend Structure

backend/

* connectHandlerLambda.zip
* disconnectHandlerLambda.zip
* loginUserLambda.zip
* registerUserLambda.zip
* sendMessageHandlerLambda.zip

Each Lambda performs a specific role:

connectHandler – Stores WebSocket connection ID
disconnectHandler – Removes connection ID on disconnect
loginUser – Handles authentication and JWT issuance
registerUser – Registers new users in DynamoDB
sendMessageHandler – Broadcasts messages to active WebSocket connections

---

## Frontend Structure

frontend/

* app/ (Next.js routes)
* components/ (UI + chat components)
* context/ (Auth + WebSocket providers)
* hooks/
* lib/ (API utilities and types)
* styles/
* public/

The frontend communicates with:

* HTTP API for authentication
* WebSocket API for real-time messaging

---

## How It Works

1. User registers via HTTP API.
2. User logs in and receives a JWT token.
3. Frontend stores token in context.
4. User connects to WebSocket API.
5. On connection:

   * connectHandler stores connectionId in DynamoDB.
6. When user sends message:

   * sendMessageHandler retrieves active connections.
   * Broadcasts message using API Gateway Management API.
7. On disconnect:

   * disconnectHandler removes connectionId.

This architecture ensures horizontal scalability and eliminates the need for persistent backend servers.

---

## Running the Frontend Locally

Prerequisites:

* Node.js (v18+ recommended)
* npm

Steps:

1. Navigate to frontend directory:

cd frontend

2. Install dependencies:

npm install

3. Build the project:

npm run build

4. Start production server:

npm run start

The application will run at:

[http://localhost:3000](http://localhost:3000)

---

## Environment Variables

The frontend requires API endpoints for:

* HTTP API base URL
* WebSocket API endpoint

Create a `.env.local` file inside `frontend/` and define:

NEXT_PUBLIC_HTTP_API_URL=your_http_api_url
NEXT_PUBLIC_WEBSOCKET_URL=your_websocket_url

These values should match your deployed AWS API Gateway endpoints.

---

## Deployment (Backend)

Backend Lambdas are deployed to AWS and integrated with:

* API Gateway (HTTP routes)
* API Gateway (WebSocket routes)
* DynamoDB tables

Ensure the following are configured in AWS:

* Proper IAM roles for Lambda
* DynamoDB table for users
* DynamoDB table for active WebSocket connections
* WebSocket route integration for:

  * $connect
  * $disconnect
  * sendMessage

---

## Tech Stack

Backend:

* AWS Lambda
* Amazon API Gateway
* Amazon DynamoDB
* Node.js

Frontend:

* Next.js
* React
* TypeScript

Infrastructure:

* Fully Serverless Architecture
