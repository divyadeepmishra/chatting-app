import cors from "cors";
import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";

const app = express();
const PORT = process.env.PORT || 8080;

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send("Hello World!"));



const users = new Map();
let userIdCounter = 1;

const broadCast = (data) => {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};


wss.on("connection", (ws) => {
    // console.log("Client connected");

    const userId = userIdCounter++;
    const newUser = {
        id: userId,
        name: `User${userId}`,
        socket: ws
    };
    users.set(userId, newUser);

    // console.log(`User connected: ${JSON.stringify({
    //     id: userId,
    //     name: newUser.name
    // })}`);

    ws.send(JSON.stringify({
        type: "userId",
        userId
    }));

    broadCast({
        type: "newUser",
        user: {
            id: userId,
            name: newUser.name
        }
    });

    broadCast({
        type: "userList",
        users: Array.from(users.values()).map(user => ({ id: user.id, name: user.name }))
    });

    ws.on("message", (message) => {
        const textMessage = message.toString("utf-8");
        // console.log(`Received message from User${userId}: ${textMessage}`);

        broadCast({
            type: "message",
            message: textMessage,
            userId,
        });
    });

    ws.on("close", () => {
        users.delete(userId);
        // console.log(`User disconnected: User${userId}`);

        broadCast({ type: "userDisconnected", userId });
    });

    ws.on("error", (err) => {
        // console.error(`WebSocket error (User${userId}):`, err);
    });

    ws.send(JSON.stringify({
        type: "status",
        message: "Connected to WebSocket server"
    }));
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});