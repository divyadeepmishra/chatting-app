import express from "express";
import cors from "cors"
import { createServer } from "http";
import { WebSocket,WebSocketServer } from "ws";


const app = express();
const PORT = 8000;

const server = createServer(app);
const wss = new WebSocketServer({ server });
app.use(cors());

const user = new Map();

app.get("/",(res,req)=>{
    res.send("Hello World")
});


const broadcast = (d)=>{
    const msg = JSON.stringify(d);
    wss.clients.forEach(client=>{
        if(client.readyState == WebSocket.OPEN){
            client.send(msg);
        }
    }
    );
}

const userId = 0;

wss.on("connection",(ws)=>{
    const userId = userId++;
    const newUser ={
        id:userId,
        name:`User ${userId}`,
        ws,
        };

        user.set(userId,newUser);
    console.log("New user connected:", newUser);

    
    ws.send(JSON.stringify({}));
    broadcast({
        type:"userId",
        userId,
    });

    broadcast({
        "type":"userList",
        users:Array.from(users.values()).map(user=>{
            id:user.id;
            name:user.name;
        })
    })

    ws.on("message",(msg)=>{
        const userMsg = msg.toString('utf-8');
        broadcast({
            type:"message",
            message:userMsg,
            userId,
        })
    })

    ws.on("close",()=>{
        user.delete(userId);
        broadcast({
            type:"userDisconnected",
            userId,

        })
    });
    ws.on("error",(err)=>{
        console.error("WebSocket error:", err);

    });

    ws.send(JSON.stringify({
        type:"status",
        message:"Connected to the Server"
    }))

    
})


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
} );
