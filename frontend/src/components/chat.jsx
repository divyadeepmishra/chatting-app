import React, { useState,useEffect } from 'react'

const Chat = () => {
    const [ws,setWs] = useState(null);
    const [messages,setMessages] = useState([]);
    const [users,setUsers] = useState([]);
    const [input, setInput] = useState("");
    const [userId, setUserId] = useState(null);
    const [connectionStatus,setConnectionStatus] = useState("Connecting...");
    
useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
        console.log("Connected to WebSocket server");
        setConnectionStatus("connected");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "userId":
                setUserId(data.userId);
                break;

            case "newUser":
                setUsers((prev) => [...prev, data.user]);
                // Add system message for new user
                setMessages((prev) => [
                    ...prev,
                    {
                        userId: -1,
                        content: `${data.user.name} has joined the chat`,
                        timestamp: Date.now()
                    },
                ]);
                break;

            case "userList":
                setUsers(Object.values(data.users));
                break;

            case "message":
                setMessages((prev) => [
                    ...prev,
                    {
                        userId: data.userId,
                        content: data.message,
                        timestamp: data.timestamp || Date.now()
                    },
                ]);
                break;

            case "userDisconnected":
                const disconnectedUser = users.find(user => user.id === data.userId);
                setUsers((prev) => prev.filter((user) => user.id !== data.userId));
                // Add system message for disconnected user
                if (disconnectedUser) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            userId: -1,
                            content: `${disconnectedUser.name} has left the chat`,
                            timestamp: Date.now()
                        },
                    ]);
                }
                break;

            default:
                console.log("Unknown message type:", data);
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setConnectionStatus("disconnected");
    };

    socket.onclose = () => {
        console.log("WebSocket Disconnected");
        setConnectionStatus("disconnected");
    };

    setWs(socket);

    return () => {
        socket.close();
    };
}, []);


    const sendMessage = () => {
        if (ws && input.trim()) {
            try {
                ws.send(JSON.stringify({
                    type: "message",
                    content: input
                }));
            } catch {
                // Fallback to plain text for backward compatibility
                ws.send(input);
            }
            setInput("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };


    

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <div className="bg-gray-800 p-4 shadow-md flex items-center justify-between">
                <h2 className="text-xl font-bold">Chat</h2>
                <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-2 ${connectionStatus === "connected" ? "bg-green-500" :
                        connectionStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"
                        }`}></div>
                    <span className="text-sm">
                        {connectionStatus === "connected" ? "Connected" :
                            connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
                    </span>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                {/* User list sidebar */}
                <div className="w-64 bg-gray-800 p-4 border-r border-gray-700 hidden md:block">
                    <h3 className="font-semibold mb-2 text-gray-400 uppercase text-sm">Online Users ({users.length})</h3>
                    <ul className="space-y-1">
                        {/* {users.map((user) => (
                            <li key={user.id} className={`p-2 rounded ${user.id === userId ? "bg-gray-700" : "hover:bg-gray-700"}`}>
                                <div className="flex items-center">
                                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                    <span className={user.id === userId ? "font-semibold" : ""}>
                                        {user.name} {user.id === userId && "(You)"}
                                    </span>
                                </div>
                            </li>
                        ))} */}
                    </ul>
                </div>

                {/* Chat area */}
                <div className="flex-1 flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-3">
                            {/* Welcome message */}
                            <div className="bg-gray-800 p-3 rounded-lg shadow-md">
                                <p className="text-center text-gray-400">Welcome to DarkChat! Start messaging below.</p>
                            </div>

                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.userId === userId ? "justify-end" : msg.userId === -1 ? "justify-center" : "justify-start"}`}
                                >
                                    {msg.userId === -1 ? (
                                        // System message
                                        <div className="bg-gray-800 py-1 px-3 rounded text-sm text-gray-400 max-w-xs">
                                            {msg.content}
                                        </div>
                                    ) : (
                                        // User message
                                        <div className={`max-w-xs lg:max-w-md ${msg.userId === userId ? "bg-blue-600" : "bg-gray-700"} rounded-lg px-4 py-2 shadow-md`}>
                                            {msg.userId !== userId && (
                                                <div className="font-medium text-sm text-gray-300 mb-1">
                                                    {users.find((u) => u.id === msg.userId)?.name || "Unknown"}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-end gap-4">
                                                <div className="break-words">{msg.content}</div>
                                                <div className="text-xs text-gray-400 whitespace-nowrap">
                                                    {formatTime(msg.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {/* <div ref={messagesEndRef} /> */}
                        </div>
                    </div>

                    {/* Input area */}
                    <div className="bg-gray-800 p-3 border-t border-gray-700">
                        <div className="flex items-center">
                            <textarea
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message..."
                                rows={1}
                            />
                            <button
                                className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={sendMessage}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
  )
}

export default Chat
